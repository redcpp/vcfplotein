import { defineStore } from 'pinia'

// Drives the persistent inspector sidebar in the workspace shell.
export const useSidebarStore = defineStore('sidebar', {
  state: () => ({
    collapsed: false
  }),

  getters: {
    isCollapsed: (state) => state.collapsed,
    // Kept so the plot's width calculation can still ask whether the
    // sidebar is taking up horizontal space.
    isActive: (state) => !state.collapsed
  },

  actions: {
    setCollapsed (value) { this.collapsed = value },
    toggleCollapsed () { this.collapsed = !this.collapsed }
  }
})
