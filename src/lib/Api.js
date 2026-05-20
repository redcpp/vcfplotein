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
    return (this._version === 37 ? 300 : 200)
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

  _fetchChunks (info, lines) {
    return new Promise(async (resolve, reject) => {
      try {
        let requests = []
        while (lines.length > 0) {
          let chunk = lines.splice(0, this.chunk_size)
          let post_content = {
            variants: chunk,
            transcript_id: info.transcript_id
          }
          let req = this._fetchChunk(chunk, post_content)
          requests.push(req)
        }
        requests = await Promise.all(requests)
        const merge = [].concat(...requests)
        resolve(merge)
      } catch (err) {
        reject(err)
      }
    })
  }

  _fetchChunk (chunk, post_content) {
    return new Promise(async (resolve, reject) => {
      try {
        let url = `${this.ensembl_url}/vep/homo_sapiens/region`
        let { data } = await axios.post(url, post_content, { responseType: 'json', crossdomain: true })
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
  }

  _fetchDBPresence (variants) {
    return new Promise(async (resolve, reject) => {
      try {
        let url = `${this.api_url}/variant-information`
        let post_content = {
          variants: variants,
          version: this.version
        }
        let { data } = await axios.post(url, post_content, { responseType: 'json', crossdomain: true })
        resolve(data)
      } catch (err) {
        reject(err)
      }
    })
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
    let consequences = []
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
          consequences.push(...t.consequence_terms)
          consequences = [...new Set(consequences)]
        }
      }
    }

    splice_variants = await this._fetchSplice(info, splice_variants)
    console.log('splice variants:', splice_variants)
    variants.push(...splice_variants)
    splice_variants.forEach(v => {
      v.aa_change = ''
      consequences.push(...v.consequences)
      consequences = [...new Set(consequences)]
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

    consequences = this.extractor.parseConsequences(consequences)
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
