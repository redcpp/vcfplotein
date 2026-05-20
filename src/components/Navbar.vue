<template>
  <nav
    class="relative z-40 flex h-14 shrink-0 items-center gap-3 border-b
           border-border bg-surface px-3 sm:px-4"
  >
    <!-- Sidebar toggle -->
    <button
      type="button"
      class="t-base flex h-9 w-9 items-center justify-center rounded-lg
             text-ink-2 hover:bg-surface-2 hover:text-ink"
      :aria-label="sidebar.isCollapsed ? 'Show panel' : 'Hide panel'"
      @click="sidebar.toggleCollapsed()"
    >
      <i class="fa fa-bars text-sm"></i>
    </button>

    <!-- Wordmark -->
    <router-link
      to="/"
      class="flex shrink-0 items-center gap-2"
    >
      <img src="/Plotein.png" width="26" height="26" alt="" />
      <span class="text-[15px] font-bold tracking-tight text-ink">
        VCF<span class="text-primary">/</span>Plotein
      </span>
    </router-link>

    <!-- Breadcrumb -->
    <div
      v-if="myFile"
      class="ml-1 hidden min-w-0 items-center gap-2 sm:flex"
    >
      <span class="text-border-strong">/</span>
      <button
        type="button"
        class="t-base max-w-[14rem] truncate rounded-md px-2 py-1 font-mono
               text-xs text-ink-2 hover:bg-surface-2 hover:text-ink"
        @click="goToBrowser"
      >
        {{ myFile.name }}
      </button>
      <template v-if="route.name === 'graph' && myGeneName">
        <span class="text-border-strong">/</span>
        <span class="rounded-md bg-primary-soft px-2 py-1 font-mono text-xs
                     font-semibold text-primary-ink">
          {{ myGeneName }}
        </span>
      </template>
    </div>

    <!-- Right-side actions -->
    <div class="ml-auto flex items-center gap-2">
      <template v-if="showOptions">
        <!-- Plot / Table toggle -->
        <div class="flex items-center rounded-lg bg-surface-2 p-0.5">
          <button
            type="button"
            class="t-base flex items-center gap-1.5 rounded-md px-2.5 py-1.5
                   text-xs font-semibold"
            :class="!myFlipped
              ? 'bg-surface text-ink shadow-xs'
              : 'text-ink-3 hover:text-ink'"
            @click="myFlipped && toggleFlipped()"
          >
            <i class="fa fa-chart-column text-[11px]"></i>
            <span class="hidden md:inline">Plot</span>
          </button>
          <button
            type="button"
            class="t-base flex items-center gap-1.5 rounded-md px-2.5 py-1.5
                   text-xs font-semibold"
            :class="myFlipped
              ? 'bg-surface text-ink shadow-xs'
              : 'text-ink-3 hover:text-ink'"
            @click="!myFlipped && toggleFlipped()"
          >
            <i class="fa fa-table-list text-[11px]"></i>
            <span class="hidden md:inline">Table</span>
          </button>
        </div>

        <!-- Export menu -->
        <div class="relative">
          <button
            type="button"
            class="t-base flex items-center gap-2 rounded-lg border border-border
                   bg-surface px-3 py-1.5 text-xs font-semibold text-ink-2
                   hover:border-border-strong hover:text-ink"
            @click="exportOpen = !exportOpen"
          >
            <i class="fa fa-arrow-up-from-bracket text-[11px]"></i>
            <span class="hidden sm:inline">Export</span>
            <i class="fa fa-chevron-down text-[9px] text-ink-3"></i>
          </button>

          <div
            v-if="exportOpen"
            class="fixed inset-0 z-40"
            @click="exportOpen = false"
          ></div>

          <transition name="menu">
            <div
              v-if="exportOpen"
              class="absolute right-0 top-full z-50 mt-1.5 w-48 overflow-hidden
                     rounded-xl border border-border bg-surface py-1 shadow-pop"
            >
              <p class="eyebrow px-3 pb-1 pt-1.5">Download</p>
              <button
                v-if="!myFlipped"
                type="button"
                class="export-item"
                @click="runExport(() => pngButtonRef.downloadPng())"
              >
                <DownloadPng ref="pngButtonRef" />
                <span>PNG image</span>
              </button>
              <button
                v-if="!myFlipped"
                type="button"
                class="export-item"
                @click="runExport(() => svgButtonRef.downloadSvg())"
              >
                <DownloadSvg ref="svgButtonRef" />
                <span>SVG vector</span>
              </button>
              <button
                type="button"
                class="export-item"
                @click="runExport(() => csvButtonRef.downloadCsv())"
              >
                <DownloadCsv ref="csvButtonRef" />
                <span>CSV table</span>
              </button>
              <div class="my-1 border-t border-border"></div>
              <button
                type="button"
                class="export-item"
                @click="runExport(printPage)"
              >
                <Print />
                <span>Print view</span>
              </button>
            </div>
          </transition>
        </div>

        <!-- Fullscreen -->
        <button
          type="button"
          class="t-base flex h-9 w-9 items-center justify-center rounded-lg
                 text-ink-2 hover:bg-surface-2 hover:text-ink"
          aria-label="Toggle fullscreen"
          @click="toggleFullscreen"
        >
          <i class="fa fa-expand text-sm"></i>
        </button>
      </template>
    </div>
  </nav>
</template>

<script setup>
// Workspace top bar: identity, dataset/gene breadcrumb, and the
// export / view / fullscreen actions for the plot.
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import emitter from '@/eventBus'
import { useMainStore } from '@/stores/main'
import { useSidebarStore } from '@/stores/sidebar'
import { useInteractionsStore } from '@/stores/interactions'

import Print from '@/components/sidebar/Print.vue'
import DownloadCsv from '@/components/sidebar/DownloadCsv.vue'
import DownloadPng from '@/components/sidebar/DownloadPng.vue'
import DownloadSvg from '@/components/sidebar/DownloadSvg.vue'

const route = useRoute()
const router = useRouter()
const main = useMainStore()
const sidebar = useSidebarStore()
const interactions = useInteractionsStore()

const exportOpen = ref(false)

const pngButtonRef = ref(null)
const svgButtonRef = ref(null)
const csvButtonRef = ref(null)

const myFile = computed(() => main.getFile)
const myGeneName = computed(() => main.getInfo && main.getInfo.name)
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

function runExport (fn) {
  exportOpen.value = false
  fn()
}

function goToBrowser () {
  if (route.name !== 'wizard') router.push('/wizard')
}
</script>

<style scoped>
.export-item {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 0.625rem;
  padding: 0.5rem 0.75rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--color-ink-2);
  transition: background-color 0.14s ease, color 0.14s ease;
}
.export-item:hover {
  background-color: var(--color-surface-2);
  color: var(--color-ink);
}
.menu-enter-active,
.menu-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.menu-enter-from,
.menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
