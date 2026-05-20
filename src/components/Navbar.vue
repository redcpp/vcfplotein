<template>
  <nav
    class="sticky top-0 z-50 flex items-center bg-go-primary-dark px-4 text-sm text-white"
  >
    <!-- Mobile hamburger (replaces b-navbar-toggle / b-collapse) -->
    <button
      type="button"
      class="mr-2 rounded p-2 hover:bg-white/10 sm:hidden"
      aria-label="Toggle navigation"
      @click="menuOpen = !menuOpen"
    >
      <i class="fa fa-bars"></i>
    </button>

    <!-- Brand -->
    <router-link
      to="/"
      class="flex items-center py-3 font-semibold uppercase text-white"
    >
      <img src="/Plotein.png" width="32" class="mr-2" alt="VCF/Plotein" />
      VCF/Plotein
      <span class="ml-2 text-go-primary-light normal-case">Beta</span>
    </router-link>

    <!-- Nav items: inline on desktop, collapsible panel on mobile -->
    <div
      class="ml-auto items-center gap-1 sm:flex"
      :class="menuOpen
        ? 'absolute left-0 right-0 top-full flex flex-col bg-go-primary-dark p-2 sm:static sm:flex-row sm:bg-transparent sm:p-0'
        : 'hidden'"
    >
      <template v-if="showOptions">
        <template v-if="!myFlipped">
          <button
            type="button"
            class="ml-2 cursor-pointer px-2 py-2 text-[#eee] hover:text-white"
            @click="pngButtonRef.downloadPng()"
          >
            <DownloadPng ref="pngButtonRef" />
          </button>
          <button
            type="button"
            class="ml-2 cursor-pointer px-2 py-2 text-[#eee] hover:text-white"
            @click="svgButtonRef.downloadSvg()"
          >
            <DownloadSvg ref="svgButtonRef" />
          </button>
        </template>

        <button
          type="button"
          class="ml-2 cursor-pointer px-2 py-2 text-[#eee] hover:text-white"
          @click="csvButtonRef.downloadCsv()"
        >
          <DownloadCsv ref="csvButtonRef" />
        </button>

        <button
          type="button"
          class="ml-2 cursor-pointer px-2 py-2 text-[#eee] hover:text-white"
          @click="printPage"
        >
          <Print />
        </button>

        <button
          type="button"
          class="ml-2 cursor-pointer px-2 py-2 text-[#eee] hover:text-white"
          @click="toggleFlipped"
        >
          <i
            v-if="myFlipped"
            class="fa fa-code-branch"
            title="Change to table view"
            data-toggle="tooltip"
          ></i>
          <i v-else class="fa fa-table"></i>
        </button>

        <button
          type="button"
          class="ml-2 cursor-pointer px-2 py-2 text-[#eee] hover:text-white"
          @click="toggleFullscreen"
        >
          <i class="fa fa-compress"></i>
        </button>
      </template>
    </div>
  </nav>
</template>

<script setup>
// Ported from components/Navbar.vue.
// - bootstrap-vue b-navbar / b-collapse hamburger -> a plain Tailwind navbar
//   with a `menuOpen` boolean toggling a responsive panel.
// - Vuex mapGetters/mapActions -> Pinia stores.
// - The download children used to be invoked via `this.$refs.pngButton.downloadPng()`.
//   In <script setup> the children `defineExpose` their methods and Navbar holds
//   template refs (`pngButtonRef` etc.) to call them.
// - The old `this.$bus.$emit('fullscreen')` -> `emitter.emit('fullscreen')`.
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

import emitter from '@/eventBus'
import { useMainStore } from '@/stores/main'
import { useInteractionsStore } from '@/stores/interactions'

import Print from '@/components/sidebar/Print.vue'
import DownloadCsv from '@/components/sidebar/DownloadCsv.vue'
import DownloadPng from '@/components/sidebar/DownloadPng.vue'
import DownloadSvg from '@/components/sidebar/DownloadSvg.vue'

const route = useRoute()
const main = useMainStore()
const interactions = useInteractionsStore()

const menuOpen = ref(false)

// Template refs to the download children (they defineExpose their methods).
const pngButtonRef = ref(null)
const svgButtonRef = ref(null)
const csvButtonRef = ref(null)

const myFile = computed(() => main.getFile)
const myFlipped = computed(() => interactions.getFlipped)

const showOptions = computed(() => route.name === 'graph' && !!myFile.value)

function toggleFlipped () {
  interactions.toggleFlipped()
}

function toggleFullscreen () {
  emitter.emit('fullscreen', 'ok')
}

function printPage () {
  window.print()
}
</script>
