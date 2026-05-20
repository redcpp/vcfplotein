<template>
  <div>
    <input
      id="inputLive"
      v-model.trim="search"
      type="text"
      placeholder="Search a chromosome"
      aria-describedby="inputLiveHelp inputLiveFeedback"
      class="t-base w-full rounded-lg border border-border bg-surface px-3 py-2
             text-sm text-ink placeholder:text-ink-4 focus:border-primary
             focus:outline-none focus:ring-2 focus:ring-primary/20"
    />

    <div class="chip-list mt-2 flex flex-wrap gap-1.5">
      <button
        v-for="item in filteredList"
        :key="item"
        type="button"
        class="t-base rounded-lg border px-2.5 py-1 font-mono text-xs font-semibold"
        :class="item === myFilter
          ? 'border-primary bg-primary-soft text-primary-ink'
          : 'border-border bg-surface text-ink-2 hover:border-border-strong hover:text-ink'"
        @click="setFilter(item)"
      >
        {{ item }}
      </button>
      <p
        v-if="!filteredList.length"
        class="w-full py-3 text-center text-xs text-ink-3"
      >
        No chromosomes found
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

import { useMainStore } from '@/stores/main'
import { useGenefilterStore } from '@/stores/genefilter'

const main = useMainStore()
const genefilter = useGenefilterStore()

const search = ref('')

const myGenes = computed(() => main.getGenes)
const myFilter = computed(() => genefilter.getFilter)

const chromosomesInFile = computed(() => {
  const list = myGenes.value.filter((g) => g.chr).map((g) => g.chr.toString())
  return [...new Set(list)]
})

const filteredList = computed(() => (
  chromosomesInFile.value.filter((d) => d.includes(search.value))
))

function setFilter (chromosome) {
  genefilter.setFilter({ filter: chromosome, type: 'chromosome' })
}
</script>

<style scoped>
.chip-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
