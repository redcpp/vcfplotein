/**
 * vcfWorker.js — off-main-thread VCF parsing AND per-gene querying.
 *
 * Instantiated by `src/lib/VCFParser.js` with Vite's native worker syntax:
 *   new Worker(new URL('../workers/vcfWorker.js', import.meta.url), { type: 'module' })
 * (No vite.config.js change needed.)
 *
 * Protocol
 * --------
 * Main → worker:
 *   { type: 'parse', file: File }
 *   { type: 'query', queryId: number, gene: {...} }
 * Worker → main:
 *   { type: 'progress', loaded, total }
 *   { type: 'done', version, genes, lineCount }
 *   { type: 'variants', queryId, variants }
 *   { type: 'error', name, message, queryId? }
 *
 * Design (see perf audit + cohort-VCF fix)
 * ----------------------------------------
 * The file is parsed exactly ONCE. The resulting per-chromosome variant index
 * stays RESIDENT HERE — it is never `postMessage`'d to the main thread. An
 * earlier design cloned the whole index across the worker boundary, which
 * `structuredClone`-OOM'd on multi-sample VCFs (a 250-sample file has ~30M
 * nested sample objects). Instead the main thread sends small `query` messages
 * and gets back only the variants for one gene. Gene mapping (`positionToName`)
 * also runs here, so the millions of interval-tree point queries never block
 * the UI.
 */

import { VCFStreamParser, variantsInGene } from '../lib/vcfCore.js'
import { streamPlainText, streamGzipText, FileTooLargeError } from '../lib/vcfStream.js'
import { positionToName } from '../lib/GeneTree.js'

// The parsed index for the current file. Held in worker memory for the life of
// the worker (the main thread terminates the worker when a new file is chosen).
let parsedIndex = null

const errorName = (err) =>
  err instanceof FileTooLargeError ? 'FileTooLargeError' : (err.name || 'Error')

async function handleParse (file) {
  parsedIndex = null
  const parser = new VCFStreamParser()
  const isCompressed = file.name.endsWith('.vcf.gz') || file.name.endsWith('.gz')

  // Throttle progress posts: at most ~one per 250 ms.
  let lastPost = 0
  const onProgress = (loaded, total) => {
    const now = Date.now()
    if (now - lastPost > 250) {
      lastPost = now
      self.postMessage({ type: 'progress', loaded, total })
    }
  }
  const onText = (text) => parser.pushChunk(text)

  if (isCompressed) {
    await streamGzipText(file, onText, onProgress)
  } else {
    await streamPlainText(file, onText, onProgress)
  }
  parser.end()

  const index = parser.finalize()

  // Map variant positions → gene regions HERE, off the main thread.
  const genes = await positionToName({
    genes: index.genePositions,
    version: index.version
  })
  // The raw position list is only needed for the mapping above — drop it so it
  // can be garbage-collected (millions of entries for a WGS VCF).
  index.genePositions = null

  parsedIndex = index
  self.postMessage({
    type: 'done',
    version: index.version,
    genes,
    lineCount: parser.lineCount
  })
}

function handleQuery (queryId, gene) {
  if (!parsedIndex) {
    self.postMessage({
      type: 'error',
      queryId,
      name: 'Error',
      message: 'VCF has not been parsed yet.'
    })
    return
  }
  // Only this gene's variants cross the boundary — small and cloneable even
  // for a wide multi-sample VCF.
  const variants = variantsInGene(parsedIndex, gene)
  self.postMessage({ type: 'variants', queryId, variants })
}

self.onmessage = async (event) => {
  const msg = event.data
  if (!msg) { return }

  if (msg.type === 'parse') {
    try {
      await handleParse(msg.file)
    } catch (err) {
      self.postMessage({
        type: 'error',
        name: errorName(err),
        message: err.message || String(err)
      })
    }
  } else if (msg.type === 'query') {
    try {
      handleQuery(msg.queryId, msg.gene)
    } catch (err) {
      self.postMessage({
        type: 'error',
        queryId: msg.queryId,
        name: err.name || 'Error',
        message: err.message || String(err)
      })
    }
  }
}
