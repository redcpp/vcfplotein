import axios from 'axios'
import assert from '@/lib/assert'

import Extractor from '@/lib/Extractor'

// Companion API base. This is a RELATIVE path: the dev-server proxy
// (vite.config.js) and the production server (server/index.js) both forward
// `/api/*` to the UNAM backend (https://vcfplotein.liigh.unam.mx:8181),
// transparently bypassing the expired upstream TLS certificate.
//
// `VITE_URL_API` may override the base if you need to skip the proxy.
const URL_API = import.meta.env.VITE_URL_API || '/api'
console.log('API URL:', URL_API)

// Ensembl REST endpoints stay absolute — they have valid certs of their own.
const URL_37 = '//grch37.rest.ensembl.org'
const URL_38 = '//rest.ensembl.org'

// Maximum number of HTTP POSTs in flight at once. Ensembl REST throttles at
// roughly 15 req/s; keeping this small (and well under that ceiling) avoids
// HTTP 429 storms while still pipelining work. The same cap is reused for the
// companion UNAM backend, whose `/variant-information` endpoint is fragile.
const MAX_CONCURRENCY = 5

// Retry policy for transient HTTP failures (429 throttling, 5xx upstream
// errors). Backoff is exponential with jitter; a `Retry-After` response
// header — when present — overrides the computed delay.
const MAX_RETRIES = 4
const BASE_BACKOFF_MS = 500
const MAX_BACKOFF_MS = 8000

// Largest batch of variants sent to the companion `/variant-information`
// endpoint in a single POST. The backend chokes on very large payloads, so
// requests are split into bounded batches and run through the same limiter.
const DB_PRESENCE_BATCH_SIZE = 200

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Run an array of task factories with a bounded number in flight at once.
 * Uses `Promise.allSettled` semantics: every task is awaited and the per-task
 * outcome ({ status, value | reason }) is returned in input order, so a single
 * failure never discards the work that succeeded.
 *
 * @param {Array<() => Promise>} tasks - thunks; each returns a promise.
 * @param {number} limit - max concurrent in-flight tasks.
 * @returns {Promise<Array<{status:'fulfilled',value:*}|{status:'rejected',reason:*}>>}
 */
async function runWithConcurrency (tasks, limit) {
  const results = new Array(tasks.length)
  let next = 0

  const worker = async () => {
    while (true) {
      const index = next++
      if (index >= tasks.length) { return }
      try {
        results[index] = { status: 'fulfilled', value: await tasks[index]() }
      } catch (err) {
        results[index] = { status: 'rejected', reason: err }
      }
    }
  }

  const workers = []
  const poolSize = Math.max(1, Math.min(limit, tasks.length))
  for (let i = 0; i < poolSize; i++) {
    workers.push(worker())
  }
  await Promise.all(workers)
  return results
}

/**
 * Decide whether an axios error is worth retrying: network errors with no
 * response, HTTP 429 (throttled), and any 5xx (transient upstream failure).
 */
function isRetryable (err) {
  const status = err && err.response && err.response.status
  if (status === undefined) { return true }
  return status === 429 || (status >= 500 && status < 600)
}

/**
 * Compute the delay before the next retry. Honors a numeric `Retry-After`
 * header (seconds) when the server provides one; otherwise falls back to
 * exponential backoff with jitter, clamped to MAX_BACKOFF_MS.
 */
function backoffDelay (err, attempt) {
  const header = err && err.response && err.response.headers &&
    (err.response.headers['retry-after'] || err.response.headers['Retry-After'])
  if (header !== undefined && header !== null && header !== '') {
    const seconds = Number(header)
    if (Number.isFinite(seconds) && seconds >= 0) {
      return Math.min(seconds * 1000, MAX_BACKOFF_MS)
    }
  }
  const exponential = BASE_BACKOFF_MS * Math.pow(2, attempt)
  const jitter = Math.random() * BASE_BACKOFF_MS
  return Math.min(exponential + jitter, MAX_BACKOFF_MS)
}

/**
 * Issue an axios request with retry-on-transient-failure. Non-retryable errors
 * (4xx other than 429) reject immediately; retryable ones back off and retry
 * up to MAX_RETRIES times before giving up.
 *
 * @param {() => Promise} doRequest - thunk performing one axios call.
 * @param {string} label - used in log messages for diagnostics.
 */
async function requestWithRetry (doRequest, label) {
  let attempt = 0
  while (true) {
    try {
      return await doRequest()
    } catch (err) {
      if (!isRetryable(err) || attempt >= MAX_RETRIES) {
        throw err
      }
      const delay = backoffDelay(err, attempt)
      const status = err && err.response && err.response.status
      console.warn(
        `${label}: transient failure (status ${status === undefined ? 'network' : status}), ` +
        `retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay)}ms`
      )
      await sleep(delay)
      attempt++
    }
  }
}

export default class Api {
  constructor (version) {
    assert([37, 38].includes(version), `Version received is not 37 nor 38: (${version})`)
    this._version = version
    this.extractor = new Extractor()
  }

  // GETTERS & SETTERS

  get ensembl_url () {
    return (this._version === 37 ? URL_37 : URL_38)
  }

  get api_url () {
    return URL_API
  }

  get chunk_size () {
    // Ensembl VEP `region` POST is documented at a hard cap of 200 variants
    // per request — exceeding it returns HTTP 400. Cap both genome versions.
    return 200
  }

  get version () {
    return this._version
  }

  set version (version) {
    this._version = version
    console.log('new version', this._version)
  }

  // FETCH

  fetchDemo () {
    return new Promise(async (resolve, reject) => {
      try {
        let url = `${this.api_url}/demo`
        let { data } = await axios.get(url, { responseType: 'json', crossdomain: true })
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
  }

  fetchInfo (gene) {
    return new Promise(async (resolve, reject) => {
      try {
        let url = `${this.ensembl_url}/lookup/id/${gene.id}?content-type=application/json;expand=1`
        let { data } = await axios.get(url, { responseType: 'json', crossdomain: true })
        let info = this.extractor.parseInfo(data, gene.transcript_id)
        resolve(Object.assign({}, gene, info))
      } catch (err) {
        reject(err)
      }
    })
  }

  fetchDomains (info) {
    return new Promise(async (resolve, reject) => {
      try {
        let url = `${this.ensembl_url}/overlap/translation/${info.protein_id}?content-type=application/json`
        let { data } = await axios.get(url, { responseType: 'json', crossdomain: true })
        let domains = this.extractor.parseDomains(data)
        resolve(domains)
      } catch (err) {
        reject(err)
      }
    })
  }

  fetchTranscripts (info) {
    return new Promise(async (resolve, reject) => {
      try {
        let url = `${this.api_url}/transcripts/37/${info.name}`
        let { data } = await axios.get(url, { responseType: 'json', crossdomain: true })
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
  }

  fetchGoterms (genes) {
    return new Promise(async (resolve, reject) => {
      try {
        let url = `${this.api_url}/goterm-filters`
        let { data } = await axios.post(url, genes, { responseType: 'json', crossdomain: true })
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
  }

  fetchVariantsAndConsequences (info, vcf_vars) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log('Formating lines')
        let lines = this._formatLines(vcf_vars)
        console.log('Fetching ensembl in chunks')
        let rest_vars = await this._fetchChunks(info, lines)
        // Important to extract samples info from vcf_vars
        // as rest_vars comes without samples
        this.extractor.sampledict = vcf_vars
        console.log('Extracting vars and cons')
        let obj = this._obtainVarsConsInsDels(info, rest_vars)
        resolve(obj)
      } catch (err) {
        reject(err)
      }
    })
  }

  async _fetchChunks (info, lines) {
    // Split the variant lines into VEP-sized chunks, then run the POSTs
    // through a concurrency limiter (instead of firing every chunk at once
    // with `Promise.all`). This keeps in-flight requests under the Ensembl
    // throttling ceiling and — thanks to `allSettled` semantics — preserves
    // whatever chunks succeed even if some fail.
    const chunks = []
    for (let i = 0; i < lines.length; i += this.chunk_size) {
      chunks.push(lines.slice(i, i + this.chunk_size))
    }

    const tasks = chunks.map((chunk) => () => this._fetchChunk(chunk, {
      variants: chunk,
      transcript_id: info.transcript_id
    }))

    const settled = await runWithConcurrency(tasks, MAX_CONCURRENCY)

    const merged = []
    let failed = 0
    for (const outcome of settled) {
      if (outcome.status === 'fulfilled') {
        merged.push(...outcome.value)
      } else {
        failed++
        console.warn('VEP chunk failed (skipped):', outcome.reason && outcome.reason.message)
      }
    }

    if (failed === chunks.length && chunks.length > 0) {
      // Every chunk failed — there is no usable annotation to continue with.
      throw new Error('All VEP requests failed; no consequence annotations could be retrieved.')
    }
    if (failed > 0) {
      console.warn(`VEP: ${failed}/${chunks.length} chunk(s) failed; continuing with partial results.`)
    }
    return merged
  }

  _fetchChunk (chunk, post_content) {
    const url = `${this.ensembl_url}/vep/homo_sapiens/region`
    return requestWithRetry(async () => {
      const { data } = await axios.post(url, post_content, { responseType: 'json', crossdomain: true })
      return data
    }, 'VEP /vep/homo_sapiens/region')
  }

  async _fetchDBPresence (variants) {
    // The companion `/variant-information` endpoint is fragile and chokes on
    // very large payloads, so split the variants into bounded batches and run
    // them through the same concurrency limiter used for VEP. Partial failure
    // is tolerated: successful batches are merged and returned, and the caller
    // in `stores/main.js` already degrades gracefully if this rejects.
    if (!variants || variants.length === 0) { return [] }

    const url = `${this.api_url}/variant-information`
    const batches = []
    for (let i = 0; i < variants.length; i += DB_PRESENCE_BATCH_SIZE) {
      batches.push(variants.slice(i, i + DB_PRESENCE_BATCH_SIZE))
    }

    const tasks = batches.map((batch) => () => requestWithRetry(async () => {
      const { data } = await axios.post(url, {
        variants: batch,
        version: this.version
      }, { responseType: 'json', crossdomain: true })
      return data
    }, 'UNAM /variant-information'))

    const settled = await runWithConcurrency(tasks, MAX_CONCURRENCY)

    const merged = []
    let failed = 0
    for (const outcome of settled) {
      if (outcome.status === 'fulfilled' && Array.isArray(outcome.value)) {
        merged.push(...outcome.value)
      } else if (outcome.status === 'fulfilled' && outcome.value) {
        // Defensive: tolerate a non-array payload shape without crashing.
        merged.push(outcome.value)
      } else if (outcome.status === 'rejected') {
        failed++
        console.warn('variant-information batch failed (skipped):', outcome.reason && outcome.reason.message)
      }
    }

    if (failed === batches.length && batches.length > 0) {
      // Every batch failed — surface it so the caller's catch can log it.
      throw new Error('All variant-information requests failed; no database-presence annotations retrieved.')
    }
    if (failed > 0) {
      console.warn(`variant-information: ${failed}/${batches.length} batch(es) failed; continuing with partial results.`)
    }
    return merged
  }

  _fetchSplice () {
    // DISABLED: the companion /splice-variants endpoint crashes the upstream
    // backend process on every call. That crash also takes down the request
    // issued right after it (/variant-information) with ECONNREFUSED, so
    // calling it is actively harmful — not just an isolated failure. Splice-
    // acceptor annotation is an optional enrichment; skip the call until the
    // upstream endpoint is fixed. (Original implementation is in git history.)
    return Promise.resolve([])
  }

  // HELPERS

  async _obtainVarsConsInsDels (info, rest_vars) {
    let variants = []
    // Accumulate consequence terms in a Set throughout so deduplication is
    // O(1) per insertion. The previous code rebuilt a fresh Set on every
    // iteration (`[...new Set(consequences)]` inside the loop) — O(k²) in the
    // number of accumulated terms.
    const consequenceSet = new Set()
    let splice_variants = []

    for (const v of rest_vars) {
      if (!v.transcript_consequences) { continue }
      for (const t of v.transcript_consequences) {
        let original_var = this._obtainVariantFromInput(v.input)
        let newVariant = this.extractor.parseVariant(original_var, t)
        if (newVariant.ref.length < newVariant.alt.length) {
          newVariant.type = 'insertion'
        } else if (newVariant.ref.length > newVariant.alt.length) {
          newVariant.type = 'deletion'
        } else if (!newVariant.aa_pos
            && newVariant.consequences.includes('splice_acceptor_variant')) {
          splice_variants.push(newVariant)
        }

        if (newVariant.aa_pos && newVariant.aa_change) {
          variants.push(newVariant)
          for (const term of t.consequence_terms) {
            consequenceSet.add(term)
          }
        }
      }
    }

    splice_variants = await this._fetchSplice(info, splice_variants)
    console.log('splice variants:', splice_variants)
    variants.push(...splice_variants)
    splice_variants.forEach(v => {
      v.aa_change = ''
      for (const term of v.consequences) {
        consequenceSet.add(term)
      }
    })

    let non_confidential = this.extractor.nonConfidentialInfo(variants)
    try {
      let db_presence = await this._fetchDBPresence(non_confidential)
      variants = this.extractor.mergeVariantsAndDb(variants, db_presence)
    } catch (err) {
      // Database-presence flags (ClinVar/COSMIC/dbSNP/gnomAD) are an optional
      // enrichment; an unreliable backend must not blank out the whole graph.
      console.warn('variant-information unavailable; continuing without database-presence annotations:', err.message)
    }

    // Dedupe exactly once, at the end, when handing the terms to the parser.
    const consequences = this.extractor.parseConsequences([...consequenceSet])
    return { variants, consequences }
  }

  _formatLines (vcf_vars) {
    let lines = []
    for (const v of vcf_vars) {
      for (const alt of v.alt.split(',')) {
        let line = `${v.chr} ${v.pos} . ${v.ref} ${alt} . . .`
        lines.push(line)
      }
    }
    return lines
  }

  _obtainVariantFromInput (input) {
    let arr = input.split(' ')
    return {
      chr: arr[0],
      pos: arr[1],
      ref: arr[3],
      alt: arr[4]
    }
  }
}
