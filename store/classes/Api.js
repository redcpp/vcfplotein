import axios from 'axios'
import assert from 'assert'

import Extractor from '~/store/classes/Extractor'

const URL_API = (process.env.URL_API|| 'https://vcfplotein.liigh.unam.mx') + ':8181'
console.log('API URL:', URL_API)
const URL_37 = '//grch37.rest.ensembl.org'
const URL_38 = '//rest.ensembl.org'

const DUMMY_INSERTION = {
  id: 10000,
  chr: '7',
  pos: '124532327',
  ref: 'G',
  alt: 'C',
  aa_pos: 30,
  aa_change: 'R/D',
  consequences: ['missense_variant'],
  samples: [],
  gnomAD: false,
  dbSNP: false,
  clinvar: false,
  cosmic: false,
  type: 'insertion'
}

const DUMMY_DELETION = {
  id: 9999,
  chr: '7',
  pos: '124532327',
  ref: 'G',
  alt: 'C',
  aa_pos: 55,
  aa_change: 'D/R',
  consequences: ['missense_variant'],
  samples: [],
  gnomAD: false,
  dbSNP: false,
  clinvar: false,
  cosmic: false,
  type: 'deletion'
}

export default class Api {
  constructor (version) {
    assert([37,38].includes(version), `Version received is not 37 nor 38: (${version})`)
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
    console.log('cur version', this._version)
    return this._version
  }

  set version (version) {
    this._version = version
    console.log('new version', this._version)
  }

  // FETCH

  fetchDemo (gene) {
    return new Promise(async (resolve, reject) => {
      let url = `${this.api_url}/demo`
      let {data} = await axios.get(url, {responseType: 'json', crossdomain: true})
      resolve(data)
    })
  }

  fetchInfo (gene) {
    return new Promise(async (resolve, reject) => {
      let url = `${this.ensembl_url}/lookup/id/${gene.id}?content-type=application/json;expand=1`
      let {data} = await axios.get(url, {responseType: 'json', crossdomain: true})
      let info = this.extractor.parseInfo(data, gene.transcript_id)
      resolve(Object.assign({}, gene, info))
    })
  }

  fetchDomains (info) {
    return new Promise(async (resolve, reject) => {
      let url = `${this.ensembl_url}/overlap/translation/${info.protein_id}?content-type=application/json`
      let {data} = await axios.get(url, {responseType: 'json', crossdomain: true})
      let domains = this.extractor.parseDomains(data)
      resolve(domains)
    })
  }

  fetchTranscripts (info) {
    return new Promise(async (resolve, reject) => {
      let url = `${this.api_url}/transcripts/37/${info.name}`
      let {data} = await axios.get(url, {responseType: 'json', crossdomain: true})
      resolve(data)
    })
  }

  fetchGoterms (genes) {
    return new Promise(async (resolve, reject) => {
      let url = `${this.api_url}/goterm-filters`
      let {data} = await axios.post(url, genes, {responseType: 'json', crossdomain: true})
      resolve(data)
    })
  }

  fetchVariantsAndConsequences (info, vcf_vars) {
    return new Promise(async (resolve, reject) => {
      let lines = this._formatLines(vcf_vars)
      console.log('format lines ready')
      let rest_vars = await this._fetchChunks(info, lines)
      console.log('fetch chunks ready')
      // Important to extract samples info from vcf_vars
      // as rest_vars comes without samples
      this.extractor.sampledict = vcf_vars
      let obj = this._obtainVarsConsInsDels(rest_vars)
      resolve(obj)
    })
  }

  _fetchChunks (info, lines) {
    return new Promise(async (resolve, reject) => {
      let newList = []
      while (lines.length > 0) {
        let chunk = lines.splice(0, this.chunk_size)
        let post_content = {
          variants: chunk,
          transcript_id: info.transcript_id
        }
        let data = await this._fetchChunk(chunk, post_content)
        newList.push(...data)
      }
      resolve(newList)
    })
  }

  _fetchChunk (chunk, post_content) {
    return new Promise(async (resolve, reject) => {
      let url = `${this.ensembl_url}/vep/homo_sapiens/region`
      let {data} = await axios.post(url, post_content, {responseType: 'json', crossdomain: true})
      resolve(data)
    })
  }

  _fetchDBPresence (variants) {
    return new Promise(async (resolve, reject) => {
      let url = `${this.api_url}/variant-information`
      let {data} = await axios.post(url, variants, {responseType: 'json', crossdomain: true})
      console.log('data', data[0])
      resolve(data)
    })
  }

  // HELPERS

  async _obtainVarsConsInsDels (rest_vars) {
    let variants = []
    let deletions = []
    let insertions = []
    let consequences = []

    for (const v of rest_vars) {
      if (!v.transcript_consequences) {continue}
      for (const t of v.transcript_consequences) {
        let original_var = this._obtainVariantFromInput(v.input)
        let newVariant = this.extractor.parseVariant(original_var, t)
        if (newVariant.ref.length < newVariant.alt.length) {
          newVariant.type = 'insertion'
        } else if (newVariant.ref.length > newVariant.alt.length) {
          newVariant.type = 'deletion'
        }
        if (newVariant.aa_pos && newVariant.aa_change) {
          variants.push(newVariant)
          consequences.push(...t.consequence_terms)
          consequences = [... new Set(consequences)]
        }
      }
    }

    let non_confidential = this.extractor.nonConfidentialInfo(variants)
    let db_presence = await this._fetchDBPresence(non_confidential)
    variants = this.extractor.mergeVariantsAndDb(variants, db_presence)

    consequences = this.extractor.parseConsequences(consequences)
    return {variants, deletions, insertions, consequences }
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
