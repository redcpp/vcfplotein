<template>
  <div class="flex h-screen flex-col overflow-hidden bg-canvas">
    <Navbar />

    <div class="flex min-h-0 flex-1">
      <Sidebar />

      <!-- Mobile drawer backdrop. -->
      <transition name="fade">
        <div
          v-if="!sidebar.isCollapsed && isNarrow"
          class="fixed inset-0 top-14 z-30 bg-ink/30 lg:hidden"
          @click="sidebar.setCollapsed(true)"
        ></div>
      </transition>

      <main class="relative min-w-0 flex-1 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>

<script setup>
// Workspace frame: top bar + persistent inspector sidebar + scrollable main.
// On narrow viewports the sidebar becomes an overlay drawer.
import { ref, onMounted, onUnmounted } from 'vue'

import { useSidebarStore } from '@/stores/sidebar'
import Navbar from '@/components/Navbar.vue'
import Sidebar from '@/components/Sidebar.vue'

const sidebar = useSidebarStore()
const isNarrow = ref(false)

function syncViewport () {
  isNarrow.value = window.innerWidth < 1024
}

onMounted(() => {
  syncViewport()
  if (isNarrow.value) sidebar.setCollapsed(true)
  window.addEventListener('resize', syncViewport)
})

onUnmounted(() => {
  window.removeEventListener('resize', syncViewport)
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
