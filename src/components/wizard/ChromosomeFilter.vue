<template>
  <div>
    <h6 class="text-center font-semibold">Chromosome</h6>

    <input
      id="inputLive"
      v-model.trim="search"
      type="text"
      placeholder="Search a chromosome"
      aria-describedby="inputLiveHelp inputLiveFeedback"
      class="mt-2 w-full rounded border border-gray-300 px-3 py-1.5 text-sm
             focus:border-go-secondary focus:outline-none"
    />

    <div class="goterms-list mt-2">
      <button
        v-for="item in filteredList"
        :key="item"
        type="button"
        class="block w-full border-b border-gray-200 px-3 py-2 text-left text-sm
               transition-colors last:border-b-0"
        :class="item === myFilter
          ? 'bg-go-secondary text-white'
          : 'text-go-charcoal hover:bg-gray-100'"
        @click="setFilter(item)"
      >
        {{ item }}
      </button>
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
.goterms-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
