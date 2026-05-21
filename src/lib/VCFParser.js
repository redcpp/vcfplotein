/**
 * VCFParser.js — public, store-facing VCF API.
 *
 * Performance design (see perf audit)
 * -----------------------------------
 *   - The file is parsed exactly ONCE, in a Web Worker, off the main thread.
 *   - Parsing is fully streaming: the file is read in slices and decompressed
 *     incrementally, so we never hold the whole file (or the whole decoded
 *     string, or the whole line array) in memory. This removes both the V8
 *     ~1 GB `RangeError: Invalid string length` crash and the OOM from
 *     `split()`-ing every line into one array.
 *   - `.vcf.gz` is decoded with streaming gunzip that correctly handles bgzf
 *     (concatenated gzip members), not just the first block.
 *   - The parsed variant index stays RESIDENT IN THE WORKER. The worker is kept
 *     alive after parsing; `readVCFVariants` sends it a small `query` message
 *     and gets back only the variants for one gene. The index is never cloned
 *     across the worker boundary — that `structuredClone` OOM'd on multi-sample
 *     VCFs (a 250-sample file has tens of millions of nested sample objects).
 *
 * Public contract (unchanged for callers):
 *   readVCFGenes(file[, onProgress]) -> Promise<{ genes, version }>
 *   readVCFVariants(file, gene)      -> Promise<Array<{ chr, pos, ref, alt, samples }>>
 *   readFileAsText(file)             -> Promise<string>  (small .json bookmarks only)
 *
 * The pure line->record logic lives in `./vcfCore.js` (unit-testable in Node);
 * streaming I/O lives in `./vcfStream.js` and `../workers/vcfWorker.js`.
 */

/**
 * A live VCF worker bound to one `File`. It owns the worker, parses the file
 * once, and then answers per-gene `query` messages while the worker keeps the
 * variant index resident in its own memory.
 */
class WorkerSession {
  constructor (file) {
    this.file = file
    this.worker = new Worker(
      new URL('../workers/vcfWorker.js', import.meta.url),
      { type: 'module' }
    )
    this._nextQueryId = 0
    this._pending = new Map() // queryId -> { resolve, reject }
    this._parse = null        // { resolve, reject, onProgress }
    this.worker.onmessage = (event) => this._onMessage(event.data)
    this.worker.onerror = (event) =>
      this._fail(new Error(event.message || 'VCF worker failed.'))
  }

  _onMessage (msg) {
    if (!msg) { return }
    switch (msg.type) {
      case 'progress':
        if (this._parse && this._parse.onProgress) {
          this._parse.onProgress(msg.loaded, msg.total)
        }
        break
      case 'done':
        if (this._parse) {
          this._parse.resolve({
            version: msg.version,
            genes: msg.genes,
            lineCount: msg.lineCount
          })
          this._parse = null
        }
        break
      case 'variants': {
        const p = this._pending.get(msg.queryId)
        if (p) { this._pending.delete(msg.queryId); p.resolve(msg.variants) }
        break
      }
      case 'error': {
        const err = new Error(msg.message)
        err.name = msg.name || 'Error'
        if (msg.queryId != null) {
          // A per-query failure must not tear down the whole session.
          const p = this._pending.get(msg.queryId)
          if (p) { this._pending.delete(msg.queryId); p.reject(err) }
        } else {
          this._fail(err)
        }
        break
      }
    }
  }

  /** Reject the parse and every in-flight query with `err`. */
  _fail (err) {
    if (this._parse) { this._parse.reject(err); this._parse = null }
    for (const p of this._pending.values()) { p.reject(err) }
    this._pending.clear()
  }

  /** Parse the bound file once. Resolves with `{ version, genes, lineCount }`. */
  parse (onProgress) {
    return new Promise((resolve, reject) => {
      this._parse = { resolve, reject, onProgress }
      this.worker.postMessage({ type: 'parse', file: this.file })
    })
  }

  /**
   * Ask the worker for the variants overlapping `gene`.
   *
   * Only the numeric region bounds cross the boundary. `gene` from the store is
   * a Vue reactive Proxy with nested objects (GO terms etc.); posting it whole
   * throws `DataCloneError`. `variantsInGene` only ever reads start/end anyway.
   */
  query (gene) {
    const region = { start: Number(gene.start), end: Number(gene.end) }
    return new Promise((resolve, reject) => {
      const queryId = ++this._nextQueryId
      this._pending.set(queryId, { resolve, reject })
      this.worker.postMessage({ type: 'query', queryId, gene: region })
    })
  }

  terminate () {
    this._fail(new Error('VCF worker session terminated.'))
    this.worker.onmessage = null
    this.worker.onerror = null
    this.worker.terminate()
  }
}

/**
 * The single active session. Keyed by file identity so a second gene click on
 * the same file reuses the already-parsed, worker-resident index.
 */
let session = null // { file, ws: WorkerSession, parsed: Promise<{version,genes,lineCount}> }

/** Invalidate the session and free the worker (call when a new file is chosen). */
export const clearCache = () => {
  if (session) {
    session.ws.terminate()
    session = null
  }
}

/**
 * Ensure `file` has been parsed by a live worker session. Returns the parse
 * promise (`{ version, genes, lineCount }`). The file is parsed at most once.
 */
const ensureParsed = (file, onProgress) => {
  if (session && session.file === file) { return session.parsed }
  clearCache()
  const ws = new WorkerSession(file)
  const parsed = ws.parse(onProgress)
  const current = { file, ws, parsed }
  session = current
  // If parsing fails, drop the session so a later attempt re-parses cleanly.
  parsed.catch(() => {
    if (session === current) { clearCache() }
  })
  return parsed
}

/**
 * Read a VCF and return the coding genes it touches + reference version.
 *
 * Gene mapping runs inside the worker, so `parsed.genes` is already the mapped
 * gene list (a few hundred entries). Shape for callers: `{ genes, version }`.
 *
 * `onProgress(loaded, total)` is optional — callers wanting a progress bar
 * pass one; the worker streams real byte progress through it.
 */
export const readVCFGenes = async (file, onProgress) => {
  const parsed = await ensureParsed(file, onProgress)
  return { genes: parsed.genes, version: parsed.version }
}

/**
 * Return the variants overlapping `gene`. The worker holds the parsed index
 * resident in its own memory; this is a small message round-trip, never a
 * file re-read and never a clone of the whole index.
 *
 * Shape unchanged: `Array<{ chr, pos, ref, alt, samples }>`.
 */
export const readVCFVariants = async (file, gene) => {
  await ensureParsed(file)
  if (!session || session.file !== file) {
    // The session was invalidated between the await and here (new file chosen).
    throw new Error('VCF session is no longer available for this file.')
  }
  return session.ws.query(gene)
}

/**
 * Read a SMALL text file fully into a string.
 *
 * This path is intentionally NOT streaming: it exists only for `.json`
 * bookmark files (a few KB) loaded by `setBookmarkContents`. It must not be
 * used for VCFs — `readVCFGenes` / `readVCFVariants` handle those.
 */
export const readFileAsText = (inputFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => {
      reader.abort()
      reject(new DOMException('Problem parsing input file.'))
    }
    reader.onload = () => resolve(reader.result)
    reader.readAsText(inputFile)
  })
}
