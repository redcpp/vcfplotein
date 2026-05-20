import { defineStore } from 'pinia'

export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    active: false,
    option: null
  }),

  getters: {
    isActive: (state) => state.active,
    getOption: (state) => state.option
  },

  actions: {
    setActive (value) { this.active = value },
    setOption (value) { this.option = value },

    toggle ({ active, option }) {
      if (this.active && option === this.option) {
        this.setActive(false)
        this.setOption(null)
        return
      }
      this.setActive(active)
      this.setOption(option)
    }
  }
})
