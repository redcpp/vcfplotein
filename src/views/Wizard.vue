<template>
  <div class="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 lg:py-10">
    <!-- No dataset: upload hero -->
    <div
      v-if="!main.getFile"
      class="flex min-h-[60vh] items-center justify-center"
    >
      <div class="card anim-rise w-full max-w-xl p-7 lg:p-9">
        <p class="eyebrow">Step 1 of 2</p>
        <h1 class="mt-1.5 text-2xl font-bold tracking-tight text-ink">
          Open a dataset
        </h1>
        <p class="mt-2 text-sm leading-relaxed text-ink-2">
          Load an exome <span class="font-mono text-ink">.vcf</span> /
          <span class="font-mono text-ink">.vcf.gz</span> file, or a saved
          <span class="font-mono text-ink">.json</span> bookmark. Raw genomic
          data is parsed entirely in your browser — nothing is uploaded.
        </p>

        <div class="mt-5">
          <SelectFile />
        </div>

        <div class="my-5 flex items-center gap-3 text-xs text-ink-3">
          <span class="h-px flex-1 bg-border"></span>
          or try it instantly
          <span class="h-px flex-1 bg-border"></span>
        </div>

        <button
          type="button"
          class="t-base flex w-full items-center justify-center gap-2 rounded-xl
                 border border-border bg-surface px-4 py-3 text-sm font-semibold
                 text-ink-2 hover:border-primary hover:bg-primary-soft
                 hover:text-primary-ink"
          @click="loadDemo"
        >
          <i class="fa fa-flask text-primary"></i>
          Load demo dataset — BAP1
        </button>
      </div>
    </div>

    <!-- Parse failed: surface the reason instead of a silent empty state -->
    <div
      v-else-if="main.getError"
      class="flex min-h-[60vh] items-center justify-center"
    >
      <div class="card anim-rise w-full max-w-xl p-7 lg:p-9">
        <div
          class="flex h-12 w-12 items-center justify-center rounded-xl
                 bg-pathogenic-soft text-pathogenic"
        >
          <i class="fa fa-triangle-exclamation text-lg"></i>
        </div>
        <h1 class="mt-4 text-2xl font-bold tracking-tight text-ink">
          Couldn't read this dataset
        </h1>
        <p class="mt-2 text-sm leading-relaxed text-ink-2">
          {{ main.getError }}
        </p>

        <div class="mt-5">
          <SelectFile />
        </div>

        <div class="my-5 flex items-center gap-3 text-xs text-ink-3">
          <span class="h-px flex-1 bg-border"></span>
          or
          <span class="h-px flex-1 bg-border"></span>
        </div>

        <button
          type="button"
          class="t-base flex w-full items-center justify-center gap-2 rounded-xl
                 border border-border bg-surface px-4 py-3 text-sm font-semibold
                 text-ink-2 hover:border-primary hover:bg-primary-soft
                 hover:text-primary-ink"
          @click="loadDemo"
        >
          <i class="fa fa-flask text-primary"></i>
          Load demo dataset — BAP1
        </button>
      </div>
    </div>

    <!-- Parsing -->
    <div
      v-else-if="main.getSpinner && !hasGenes"
      class="flex min-h-[60vh] flex-col items-center justify-center gap-5"
    >
      <Spinner />
      <p class="text-sm font-medium text-ink-2">Parsing dataset…</p>
      <!-- Real streaming progress — the parse runs in a Web Worker, so this
           bar advances smoothly instead of the tab freezing. -->
      <div v-if="parsePercent !== null" class="w-full max-w-xs">
        <div
          class="h-2 w-full overflow-hidden rounded-full bg-surface-2"
          role="progressbar"
          :aria-valuenow="parsePercent"
          aria-valuemin="0"
          aria-valuemax="100"
        >
          <div
            class="h-full rounded-full bg-primary transition-[width]
                   duration-200 ease-out"
            :style="{ width: parsePercent + '%' }"
          ></div>
        </div>
        <p class="mt-1.5 text-center font-mono text-xs text-ink-3">
          {{ parsePercent }}%
        </p>
      </div>
    </div>

    <!-- Gene browser -->
    <div v-else class="anim-fade">
      <header class="mb-5">
        <p class="eyebrow">Step 2 of 2</p>
        <h1 class="mt-1.5 text-2xl font-bold tracking-tight text-ink">
          Select a gene
        </h1>
        <p class="mt-1 text-sm text-ink-2">
          <span class="font-mono font-semibold text-ink">{{ geneCount }}</span>
          coding {{ geneCount === 1 ? 'gene' : 'genes' }} found in this dataset.
          Choose one to map its variants onto the protein.
        </p>
      </header>

      <GenesTable :per-page="12" />
    </div>
  </div>
</template>

<script setup>
// Gene browser — the workspace's "no gene selected" main content.
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { useMainStore } from '@/stores/main'

import SelectFile from '@/components/wizard/SelectFile.vue'
import GenesTable from '@/components/wizard/GenesTable.vue'
import Spinner from '@/components/Spinner.vue'

const main = useMainStore()
const route = useRoute()

const hasGenes = computed(() => main.getGenes.length > 0)
const geneCount = computed(() => main.getGenes.length)

// Streaming parse progress (0..1 from the worker) as a whole percent, or null
// when progress is indeterminate (e.g. the post-stream gene-mapping phase).
const parsePercent = computed(() => {
  const p = main.getParseProgress
  return p === null || p === undefined ? null : Math.round(p * 100)
})

function loadDemo () {
  main.clearAllData()
  main.setDemoState()
}

// Only reset state for an explicit demo request; otherwise keep whatever
// dataset is loaded so navigating back here from the plot does not wipe it.
onMounted(() => {
  if (route.query && route.query.demo) {
    main.clearAllData()
    main.setDemoState()
  }
})
</script>
