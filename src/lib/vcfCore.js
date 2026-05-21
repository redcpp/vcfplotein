/**
 * vcfCore.js — pure VCF line/record parsing logic.
 *
 * This module is intentionally I/O-free: no `FileReader`, no `Worker`, no
 * `fetch`. It only knows how to turn already-decoded VCF text (chunk by chunk
 * or line by line) into the records the rest of the app consumes. That makes
 * it directly unit-testable in plain Node — see the exports below.
 *
 * The streaming I/O / decompression lives in `src/workers/vcfWorker.js`; the
 * public store-facing API lives in `src/lib/VCFParser.js`.
 */

// Column names that are NOT per-sample genotype columns.
const NONSAMPLES = [
  'ALT',
  'CHROM',
  'FILTER',
  'FORMAT',
  'ID',
  'INFO',
  'POS',
  'QUAL',
  'REF'
]

/**
 * Parse the `#CHROM ...` header line into an array of column names.
 * The leading `#` is stripped from the first column.
 */
export const parseColumnNames = (line) => {
  const cols = line.trim().split('\t')
  cols[0] = cols[0].substr(1, cols[0].length)
  return cols
}

/**
 * Build the list of sample objects from a raw record object (column->value).
 * Same shape consumers already expect: `{ name, value, status, id }`.
 */
const getSamples = (raw, keys) => {
  const samples = []
  let id = 0
  for (const key of keys) {
    if (NONSAMPLES.includes(key)) { continue }
    samples.push({
      name: key,
      value: raw[key] !== undefined ? raw[key].slice(0, 3) : '',
      status: true,
      id: id++
    })
  }
  return samples
}

/**
 * Extract `version` from a `##reference` meta line, or null if not a version
 * line. Mirrors the legacy heuristic: any reference mentioning 38 → 38, else 37.
 */
export const parseReferenceVersion = (line) => {
  if (!line.startsWith('##reference')) { return null }
  const matches = line.match(/\d+/g)
  if (!matches) { return null }
  const x = parseInt(matches[matches.length - 1])
  return x !== 38 ? 37 : 38
}

/**
 * A streaming, single-pass VCF parser.
 *
 * Feed it text incrementally with `pushChunk(text)`, then `end()`. It never
 * holds the whole file or the whole line array — only a small carry buffer for
 * the final partial line of each chunk.
 *
 * It builds, in one pass:
 *   - `version`            : detected reference build (37/38)
 *   - `genePositions`      : `[{ chrom, pos }]` — every variant position, used
 *                            by GeneTree to map positions to gene names.
 *   - `variantsByChrom`    : `Map<chrom, sorted [{ chr, pos, posNum, ... }]>` —
 *                            an index so a per-gene lookup is O(variants-in-
 *                            region) instead of a full re-parse.
 *
 * `chrom` keys are normalised the same way the legacy code did: numeric when
 * the CHROM field contains digits, otherwise the raw CHROM string.
 */
export class VCFStreamParser {
  constructor () {
    this._carry = ''
    this._keys = null
    this._sawHeader = false
    this.version = 37
    this.genePositions = []
    this.variantsByChrom = new Map()
    this.bytesProcessed = 0
    this.lineCount = 0
  }

  /** Feed one decoded text chunk. Splits on newlines, carrying the remainder. */
  pushChunk (text) {
    let buf = this._carry + text
    let start = 0
    let nl = buf.indexOf('\n', start)
    while (nl !== -1) {
      let line = buf.slice(start, nl)
      // Tolerate CRLF without an extra regex pass.
      if (line.endsWith('\r')) { line = line.slice(0, -1) }
      this._handleLine(line)
      start = nl + 1
      nl = buf.indexOf('\n', start)
    }
    this._carry = buf.slice(start)
  }

  /** Flush any trailing line that had no terminating newline. */
  end () {
    if (this._carry.length > 0) {
      const line = this._carry.endsWith('\r')
        ? this._carry.slice(0, -1)
        : this._carry
      this._handleLine(line)
      this._carry = ''
    }
  }

  _handleLine (line) {
    if (line.length === 0) { return }
    this.lineCount++

    if (line.startsWith('##')) {
      const v = parseReferenceVersion(line)
      if (v !== null) { this.version = v }
      return
    }
    if (line[0] === '#') {
      this._keys = parseColumnNames(line)
      this._sawHeader = true
      return
    }
    if (line.startsWith('./.')) { return }

    // Data line. Split once; map columns to values.
    const values = line.split('\t')
    if (values.length < 2) { return }

    const keys = this._keys
    // `keys` may be missing if the header was malformed/absent; fall back to a
    // minimal positional read so gene mapping still works.
    const chromRaw = keys ? this._field(keys, values, 'CHROM') : values[0]
    const posRaw = keys ? this._field(keys, values, 'POS') : values[1]
    if (posRaw === undefined || posRaw === '') { return }

    const posNum = parseInt(posRaw)
    if (Number.isNaN(posNum)) { return }

    const chromMatch = String(chromRaw).match(/\d+/g)
    const chrom = chromMatch ? parseInt(chromMatch) : chromRaw

    this.genePositions.push({ chrom, pos: posNum })

    // Build the per-chromosome variant index. We keep the full record so a
    // later per-gene lookup can build the consumer shape without re-reading.
    const raw = {}
    if (keys) {
      const n = Math.min(keys.length, values.length)
      for (let i = 0; i < n; i++) { raw[keys[i]] = values[i] }
    } else {
      raw.CHROM = values[0]
      raw.POS = values[1]
      raw.REF = values[3]
      raw.ALT = values[4]
    }

    const record = {
      chr: chromMatch ? parseInt(chromMatch) : NaN,
      pos: raw.POS,
      posNum,
      ref: raw.REF,
      alt: raw.ALT,
      samples: keys ? getSamples(raw, keys) : []
    }

    let bucket = this.variantsByChrom.get(chrom)
    if (!bucket) {
      bucket = []
      this.variantsByChrom.set(chrom, bucket)
    }
    bucket.push(record)
  }

  _field (keys, values, name) {
    const idx = keys.indexOf(name)
    return idx === -1 ? undefined : values[idx]
  }

  /**
   * Finalise the index: sort each chromosome bucket by position so per-gene
   * lookups can binary-search the start of a region. Returns a plain
   * serialisable result object (safe to `postMessage` from a worker).
   */
  finalize () {
    for (const bucket of this.variantsByChrom.values()) {
      bucket.sort((a, b) => a.posNum - b.posNum)
    }
    return {
      version: this.version,
      genePositions: this.genePositions,
      variantsByChrom: this.variantsByChrom
    }
  }
}

/** Lower-bound binary search: first index in `arr` with `posNum >= target`. */
const lowerBound = (arr, target) => {
  let lo = 0
  let hi = arr.length
  while (lo < hi) {
    const mid = (lo + hi) >>> 1
    if (arr[mid].posNum < target) { lo = mid + 1 } else { hi = mid }
  }
  return lo
}

/**
 * Look up the variants overlapping a gene region from a prebuilt index.
 *
 * `index` is the object returned by `VCFStreamParser.finalize()` (or an
 * equivalent reconstructed in the main thread after `postMessage`).
 *
 * Returns variant objects in the SAME shape consumers already expect:
 * `{ chr, pos, ref, alt, samples }`. Single pass, no map+filter, O(log n +
 * variants-in-region) per gene.
 */
export const variantsInGene = (index, gene) => {
  const result = []
  // The legacy filter matched purely on `gene.start <= pos <= gene.end` and
  // ignored the chromosome, so positions are unique enough in practice. We
  // scan every chromosome bucket to preserve that exact behaviour.
  for (const bucket of index.variantsByChrom.values()) {
    let i = lowerBound(bucket, gene.start)
    for (; i < bucket.length; i++) {
      const v = bucket[i]
      if (v.posNum > gene.end) { break }
      result.push({
        chr: v.chr,
        pos: v.pos,
        ref: v.ref,
        alt: v.alt,
        samples: v.samples
      })
    }
  }
  return result
}
