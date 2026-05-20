import { defineStore } from 'pinia'

export const useGenefilterStore = defineStore('genefilter', {
  state: () => ({
    filter: null,
    type: null
  }),

  getters: {
    getFilter: (state) => state.filter,
    getType: (state) => state.type
  },

  actions: {
    setFilterValue (filter) { this.filter = filter },
    setType (type) { this.type = type },

    clearFilter () {
      this.setFilterValue(null)
      this.setType(null)
    },
    setFilter ({ filter, type }) {
      if (this.type === type && this.filter === filter) {
        this.clearFilter()
      } else {
        this.setFilterValue(filter)
        this.setType(type)
      }
    }
  }
})
