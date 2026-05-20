import { defineStore } from 'pinia'
import { markRaw } from 'vue'

import Api from '@/lib/Api'
import * as VCFParser from '@/lib/VCFParser'

// Single Api instance shared across the app. Wrapped in `markRaw` when assigned
// to store state so Vue's reactivity proxy never wraps the class instance and
// its internal arrays (it manages its own mutable state).
const API = markRaw(new Api(37))

const BASE_FILTERS = {
  clinvar: false,
  cosmic: false,
  dbSnp: false,
  gnomad: false
}

const baseState = () => ({
  // Main
  file: null,
  version: 37,
  bookmark: { genes: {} },
  info: {},
  genes: [],
  goterms: {},
  transcripts: [],
  // Variants, domains and consequences
  variants: [],
  domains: [],
  consequences: [],
  // Extra
  variant: {},
  selectedGene: null,
  spinner: false,
  v_filters: Object.assign({}, BASE_FILTERS)
})

const sortByProteinPos = (a, b) => {
  return (a.aa_pos > b.aa_pos) - (a.aa_pos < b.aa_pos)
}

const uniqueArrBy = (arr, key) => {
  let set = new Set()
  let result = arr.filter(s => !set.has(s[key]) ? set.add(s[key]) : false)
  return result
}

export const useMainStore = defineStore('main', {
  state: baseState,

  getters: {
    // Basic
    getApi: () => API.api_url,
    getEnsembl: () => API.ensembl_url,
    getFile: (state) => state.file,
    getVersion: (state) => state.version,
    getBookmark: (state) => state.bookmark,
    getInfo: (state) => state.info,
    getGenes: (state) => state.genes,
    getGoterms: (state) => state.goterms,
    getTranscripts: (state) => state.transcripts,
    getVariants: (state) => state.variants,
    getDomains: (state) => state.domains,
    getConsequences: (state) => state.consequences,
    getSpinner: (state) => state.spinner,
    getVariant: (state) => state.variant,
    getSelectedGene: (state) => state.selectedGene,
    // Filter
    isBookmark: (state) => (state.file && state.file.name.endsWith('.json')),
    getStatusDomains: (state) => state.domains.filter(d => d.status),
    getPlottedVariants () {
      return this.variants.filter(v => (
        v.consequences.some(vc => this.getStatusConsequencesNames.includes(vc))
        && (this.getFilterClinvar ? v[`clinvar_${this.version}`] : true)
        && (this.getFilterCosmic ? v[`cosmic_${this.version}`] : true)
        && (this.getFilterDbsnp ? v[`dbSnp_${this.version}`] : true)
        && (this.getFilterGnomad ? v[`gnomad_${this.version}`] : true)
      ))
    },
    getStatusVariants () {
      return this.getPlottedVariants.filter(v => (
        (this.getSamples.length
          ? v.samples.some(s => this.getStatusSamples.map(d => d.id).includes(s.id))
          : true
        )
      ))
    },
    getStatusConsequences: (state) => state.consequences.filter(c => c.status),
    getStatusConsequencesNames () {
      return this.getStatusConsequences.map(c => c.name)
    },
    getAllTranscript () {
      return {
        info: this.getInfo,
        variants: this.getVariants,
        domains: this.getDomains,
        consequences: this.getConsequences
      }
    },
    getMutations () {
      return [...this.getStatusVariants].sort(sortByProteinPos)
    },
    getSamples () {
      let samples = []
      for (const v of this.getVariants) {
        samples.push(...v.samples)
      }
      return uniqueArrBy(samples, 'id')
    },
    getPlottedSamples () {
      let samples = []
      for (const v of this.getPlottedVariants) {
        samples.push(...v.samples)
      }
      return uniqueArrBy(samples, 'id')
    },
    getStatusSamples () {
      return this.getPlottedSamples.filter(s => s.status)
    },
    getFilterClinvar: (state) => state.v_filters.clinvar,
    getFilterCosmic: (state) => state.v_filters.cosmic,
    getFilterDbsnp: (state) => state.v_filters.dbSnp,
    getFilterGnomad: (state) => state.v_filters.gnomad,
    getBaseCount () {
      let dict = {
        A: { C: 0, G: 0, T: 0 },
        G: { A: 0, C: 0, T: 0 },
        C: { A: 0, G: 0, T: 0 },
        T: { A: 0, C: 0, G: 0 }
      }
      for (const v of this.getPlottedVariants) {
        if (v.ref in dict && v.alt in dict) {
          dict[v.ref][v.alt] += 1
        }
      }
      return dict
    }
  },

  actions: {
    // --- Mutations folded into actions ---
    setFile (file) { this.file = file },
    setVersion (version) {
      console.log('VERSION:', version)
      this.version = version
      this.bookmark.version = version
      API.version = version
    },
    setBookmark (bookmark) { this.bookmark = bookmark },
    setInfo (info) { this.info = info },
    setGenes (genes) { this.genes = genes },
    setGoterms (goterms) { this.goterms = goterms },
    setTranscripts (transcripts) { this.transcripts = transcripts },
    setVariants (variants) { this.variants = variants.sort(sortByProteinPos) },
    setDomains (domains) { this.domains = domains },
    setConsequences (consequences) { this.consequences = consequences },
    setSpinner (spinner) { this.spinner = spinner },
    setVariant (variant) { this.variant = variant },
    setSelectedGene (gene) { this.selectedGene = gene },
    setNumVcfVars (num_vcf_vars) { this.info.num_vcf_vars = num_vcf_vars },
    setNumVcfSamples (num_vcf_samples) { this.info.num_vcf_samples = num_vcf_samples },
    pushVariant (variant) { this.variants.push(variant) },
    setDomainStatus ({ index, val }) { this.domains[index].status = val },
    setDomainColor ({ index, val }) { this.domains[index].color = val },
    setConsequenceStatus ({ index, val }) { this.consequences[index].status = val },
    setConsequenceColor ({ index, val }) { this.consequences[index].color = val },
    setSampleStatus ({ sample, val }) { sample.status = val },
    setFilterClinvar (value) { this.v_filters.clinvar = value },
    setFilterCosmic (value) { this.v_filters.cosmic = value },
    setFilterDbsnp (value) { this.v_filters.dbSnp = value },
    setFilterGnomad (value) { this.v_filters.gnomad = value },
    clearFilters () { this.v_filters = Object.assign({}, BASE_FILTERS) },
    mergeBookmark (newB) { this.bookmark = Object.assign({}, this.bookmark, newB) },

    // --- Clear ---
    clearAllData () {
      this.setFile(null)
      this.setVersion(37)
      this.setBookmark({ genes: {} })
      this.setGenes([])
      this.setGoterms({})
      this.setInfo({})
      this.setTranscripts([])

      this.clearAllGene()
    },
    clearAllGene () {
      this.setVariants([])
      this.setDomains([])
      this.setConsequences([])
      this.setVariant({})
      this.setSpinner(false)
      this.clearFilters()
    },
    clearVariant () {
      this.setVariant({})
    },

    // --- Fetch ---
    async fetchAllData (gene) {
      this.clearAllGene()
      this.setSpinner(true)
      console.time('fetchAllData')

      let info
      try {
        info = await API.fetchInfo(gene)
      } catch {
        console.log('WTF')
      }
      if (this.transcripts.length === 0 || this.info.id !== gene.id) {
        this.setTranscripts(await API.fetchTranscripts(info))
      }
      this.setInfo(info)
      this.setDomains(await API.fetchDomains(info))

      VCFParser.readVCFVariants(this.file, gene).then(async (vcf_vars) => {
        if (vcf_vars.length === 0) {
          console.log('vcf_vars length is 0')
          return
        }
        this.setNumVcfVars(vcf_vars.length)
        this.setNumVcfSamples(Object.keys(vcf_vars[0].samples).length)

        try {
          console.time('fetchVarsAndCons')
          let obj = await API.fetchVariantsAndConsequences(info, vcf_vars)
          console.timeEnd('fetchVarsAndCons')

          this.setVariants(obj.variants)
          this.setConsequences(obj.consequences)
        } catch (error) {
          console.error('Error fetching variants', error)
        }

        this.setSpinner(false)
        console.timeEnd('fetchAllData')
      })
    },

    // --- Setters / orchestration ---
    chooseFile (file) {
      // Vuex `setFile` action — renamed to avoid clashing with the
      // `setFile` mutation-action above (which only assigns `state.file`).
      this.clearAllData()
      this.setFile(file)

      if (this.isBookmark) this.setBookmarkContents()
      else this.setVcfContents()
    },
    async setVcfContents () {
      this.setSpinner(true)

      console.time('parsefile')
      let res = await VCFParser.readVCFGenes(this.file)
      let genes = res.genes
      let version = res.version
      console.timeEnd('parsefile')

      console.time('getintersection')
      // Lazy-loaded: the gene reference data is ~14 MB — keep it out of the
      // main bundle and only fetch it when a VCF actually needs gene mapping.
      const GeneTree = await import('@/lib/GeneTree')
      genes = await GeneTree.positionToName({ genes, version })
      console.timeEnd('getintersection')

      this.setVersion(version)
      this.setGenes(genes)
      this.setSpinner(false)
    },
    setSelectedDomains (selected) {
      for (const [index, domain] of this.domains.entries()) {
        let val = selected.includes(domain.id)
        if (domain.status !== val) {
          this.setDomainStatus({ index, val })
        }
      }
    },
    setSelectedConsequences (selected) {
      for (const [index, cons] of this.consequences.entries()) {
        let val = selected.includes(cons.id)
        if (cons.status !== val) {
          this.setConsequenceStatus({ index, val })
        }
      }
    },
    setSelectedSamples (selected) {
      for (const sample of this.getSamples) {
        let val = selected.includes(sample.id)
        if (sample.status !== val) {
          this.setSampleStatus({ sample, val })
        }
      }
    },
    async fetchGoterms () {
      // Vuex `setGoterms` action — renamed to avoid clashing with the
      // `setGoterms` mutation-action above.
      this.setSpinner(true)

      console.time('goterms')
      let goterms = await API.fetchGoterms(this.genes.map(g => g.name))
      console.timeEnd('goterms')

      this.setGoterms(goterms)
      this.setSpinner(false)
    },

    // --- Bookmark ---
    async setBookmarkContents (rawContents) {
      let contents = rawContents
      if (!rawContents) {
        rawContents = await VCFParser.readFileAsText(this.file)
        contents = JSON.parse(rawContents)
      }
      let genes = []
      for (const [geneName, geneTranscripts] of Object.entries(contents.genes)) {
        let canonicalInfo = geneTranscripts[0].info // fallback
        for (const t of geneTranscripts) {
          if (t.info.canonical) {
            canonicalInfo = t.info
            break
          }
        }
        genes.push({
          name: geneName,
          id: canonicalInfo.id,
          go: canonicalInfo.go,
          chr: canonicalInfo.chr,
          transcript_id: canonicalInfo.transcript_id
        })
      }
      console.log('gen: ', genes)
      console.log('boo: ', contents)

      this.setVersion(contents.version)
      this.setBookmark(contents)
      this.setGenes(genes)
    },
    addTranscriptToBookmark () {
      let newTranscript = this.getAllTranscript
      let geneTranscripts = this.bookmark.genes[newTranscript.info.name] || []
      geneTranscripts = JSON.parse(JSON.stringify(geneTranscripts))

      let flagReplaced = false
      for (const [index, t] of geneTranscripts.entries()) {
        if (t.info.transcript_id === newTranscript.info.transcript_id) {
          geneTranscripts[index] = newTranscript
          flagReplaced = true
          break
        }
      }
      if (!flagReplaced) {
        geneTranscripts.push(newTranscript)
      }

      let newBookmark = {
        genes: {
          [newTranscript.info.name]: geneTranscripts
        }
      }
      this.mergeBookmark(newBookmark)
    },
    chooseGene (currentGene) {
      console.log('Current gene:', currentGene)
      let transcripts = this.bookmark.genes[currentGene.name]

      this.setTranscripts(transcripts.map(t => t.info.transcript_id))
      for (const t of transcripts) {
        if (t.info.transcript_id === currentGene.transcript_id) {
          this.chooseTranscript(t)
          break
        }
      }
    },
    chooseTranscript (currentTranscript) {
      console.log('selectedTranscript:', currentTranscript)
      this.setInfo(currentTranscript.info)
      this.setVariants(currentTranscript.variants)
      this.setDomains(currentTranscript.domains)
      this.setConsequences(currentTranscript.consequences)
    },
    async setDemoState () {
      this.setSpinner(true)
      const demoContents = await API.fetchDemo()
      this.setFile({ name: 'bookmark_BAP1.json' })
      this.setVersion(demoContents.version)
      this.setBookmarkContents(demoContents)
      this.setSpinner(false)
    }
  }
})
