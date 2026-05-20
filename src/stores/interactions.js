import { defineStore } from 'pinia'

export const useInteractionsStore = defineStore('interactions', {
  state: () => ({
    flipped: false
  }),

  getters: {
    getFlipped: (state) => state.flipped
  },

  actions: {
    setFlipped (value) { this.flipped = value },

    toggleFlipped () {
      this.setFlipped(!this.flipped)
    }
  }
})
