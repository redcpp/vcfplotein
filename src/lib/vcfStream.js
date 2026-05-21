/**
 * vcfStream.js — streaming file readers used by the VCF worker.
 *
 * These functions never materialise the whole file (or the whole decompressed
 * payload) as a single string. They read the `File` blob in slices, decompress
 * incrementally when needed, and hand decoded *text chunks* to a callback.
 *
 * Two paths:
 *   - plain `.vcf`  → slice + TextDecoder({stream:true})
 *   - `.vcf.gz`     → slice + streaming gunzip + TextDecoder({stream:true})
 *
 * The gzip path is correct for **bgzf** (block-gzip): a `.vcf.gz` produced by
 * htslib/bgzip is many concatenated gzip members. The browser-native
 * `DecompressionStream('gzip')` decodes concatenated members per the gzip
 * spec; the pako fallback restarts the inflator on each member boundary, the
 * same technique `@gmod/bgzf-filehandle` uses.
 */

import pako from 'pako'

// Read at most ~8 MiB of file per slice. Big enough to amortise FileReader
// overhead, small enough that no slice dominates memory.
const SLICE_SIZE = 8 * 1024 * 1024

/**
 * Hard upper bounds. With streaming we no longer hit V8's ~1 GB string cap,
 * but we still guard against inputs that would exhaust device RAM while we
 * build the in-memory variant index. These are deliberately generous.
 */
export const MAX_PLAIN_BYTES = 8 * 1024 * 1024 * 1024 // 8 GiB on disk
export const MAX_GZIP_BYTES = 3 * 1024 * 1024 * 1024 // 3 GiB compressed

export class FileTooLargeError extends Error {
  constructor (message) {
    super(message)
    this.name = 'FileTooLargeError'
  }
}

/** Read a Blob slice as an ArrayBuffer (Promise wrapper around FileReader). */
const readSlice = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => {
      reader.abort()
      reject(new Error('Problem reading file slice.'))
    }
    reader.onload = () => resolve(reader.result)
    reader.readAsArrayBuffer(blob)
  })
}

/**
 * Stream a plain (uncompressed) text file.
 *
 * @param {File} file
 * @param {(text:string)=>void} onText  receives decoded text chunks
 * @param {(loaded:number,total:number)=>void} [onProgress]
 */
export const streamPlainText = async (file, onText, onProgress) => {
  if (file.size > MAX_PLAIN_BYTES) {
    throw new FileTooLargeError(
      `This VCF is ${formatBytes(file.size)}, larger than the ${formatBytes(MAX_PLAIN_BYTES)} ` +
      'this tool can handle in the browser. Pre-filter it to your genes of interest first.'
    )
  }
  const decoder = new TextDecoder('utf-8')
  let offset = 0
  while (offset < file.size) {
    const end = Math.min(offset + SLICE_SIZE, file.size)
    const buf = await readSlice(file.slice(offset, end))
    onText(decoder.decode(new Uint8Array(buf), { stream: true }))
    offset = end
    if (onProgress) { onProgress(offset, file.size) }
  }
  // Flush any pending multi-byte sequence.
  const tail = decoder.decode()
  if (tail) { onText(tail) }
}

/**
 * Stream a gzip / bgzf compressed text file.
 *
 * Uses the native `DecompressionStream` when available (handles concatenated
 * gzip members natively), else falls back to a chunked pako inflator that
 * restarts on each member boundary so bgzf is decoded fully — not just its
 * first block.
 */
export const streamGzipText = async (file, onText, onProgress) => {
  if (file.size > MAX_GZIP_BYTES) {
    throw new FileTooLargeError(
      `This compressed VCF is ${formatBytes(file.size)}, larger than the ` +
      `${formatBytes(MAX_GZIP_BYTES)} this tool can handle in the browser.`
    )
  }
  if (typeof DecompressionStream !== 'undefined') {
    await streamGzipNative(file, onText, onProgress)
  } else {
    await streamGzipPako(file, onText, onProgress)
  }
}

/** Native path: File.stream() → DecompressionStream('gzip') → TextDecoder. */
const streamGzipNative = async (file, onText, onProgress) => {
  const decoder = new TextDecoder('utf-8')
  const reader = file
    .stream()
    .pipeThrough(new DecompressionStream('gzip'))
    .getReader()
  let loaded = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) { break }
    onText(decoder.decode(value, { stream: true }))
    // `value` is decompressed bytes; progress is approximate but monotonic.
    loaded += value.byteLength
    if (onProgress) { onProgress(Math.min(loaded, file.size), file.size) }
  }
  const tail = decoder.decode()
  if (tail) { onText(tail) }
}

/**
 * Fallback path: read compressed slices and feed a pako `Inflate`.
 *
 * Concatenated gzip members (bgzf) are handled at two levels:
 *   - WITHIN a single push buffer, pako v2 itself restarts on each member
 *     boundary (it calls `inflateReset` on `Z_STREAM_END` while input remains).
 *   - ACROSS slice boundaries, when a member ends exactly at a buffer end pako
 *     marks the inflator `ended`; we then spin up a fresh `Inflate` for the
 *     next member's bytes. We also carry any trailing unconsumed bytes forward.
 */
const streamGzipPako = async (file, onText, onProgress) => {
  const decoder = new TextDecoder('utf-8')
  let errored = null

  const makeInflator = () => {
    const inf = new pako.Inflate()
    inf.onData = (chunk) => onText(decoder.decode(chunk, { stream: true }))
    inf.onEnd = (status) => { if (status !== 0) { errored = inf.msg || 'inflate error' } }
    return inf
  }

  let inflator = makeInflator()

  // Feed one compressed buffer; `final` true on the very last slice.
  const feed = (bytes, final) => {
    let input = bytes
    // Loop so a buffer spanning multiple members is fully consumed.
    for (;;) {
      // A previous slice may have exhausted the inflator at a member boundary.
      if (inflator.ended) { inflator = makeInflator() }

      inflator.push(input, final && true)
      if (errored) { throw new Error(`Problem decompressing file: ${errored}`) }

      const consumed = inflator.strm.next_in
      if (inflator.ended && consumed < input.length) {
        // A member finished mid-buffer → remaining bytes start a new member.
        input = input.subarray(consumed)
        continue
      }
      break
    }
  }

  let offset = 0
  while (offset < file.size) {
    const end = Math.min(offset + SLICE_SIZE, file.size)
    const buf = await readSlice(file.slice(offset, end))
    feed(new Uint8Array(buf), end >= file.size)
    offset = end
    if (onProgress) { onProgress(offset, file.size) }
  }
  if (errored) { throw new Error(`Problem decompressing file: ${errored}`) }
  const tail = decoder.decode()
  if (tail) { onText(tail) }
}

/** Human-readable byte size for error messages. */
export const formatBytes = (n) => {
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let i = 0
  let v = n
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
