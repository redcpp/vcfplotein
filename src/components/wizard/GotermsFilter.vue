<template>
  <div>
    <h6 class="text-center font-semibold">{{ title }}</h6>

    <input
      id="inputLive"
      v-model.trim="search"
      type="text"
      placeholder="Search a Go-term"
      aria-describedby="inputLiveHelp inputLiveFeedback"
      class="mt-2 w-full rounded border border-gray-300 px-3 py-1.5 text-sm
             focus:border-go-secondary focus:outline-none"
    />

    <div class="goterms-list mt-2">
      <button
        v-for="item in filteredList"
        :key="item.id"
        type="button"
        class="block w-full border-b border-gray-200 px-3 py-2 text-left text-sm
               transition-colors last:border-b-0"
        :class="item.id === myFilter
          ? 'bg-go-secondary text-white'
          : 'text-go-charcoal hover:bg-gray-100'"
        @click="setFilter(item)"
      >
        {{ item.name }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

import { useGenefilterStore } from '@/stores/genefilter'

const props = defineProps({
  list: { type: Array, required: true },
  title: { type: String, required: true }
})

const genefilter = useGenefilterStore()

const search = ref('')

const myFilter = computed(() => genefilter.getFilter)

const filteredList = computed(() => (
  props.list.filter((d) => d.name.includes(search.value))
))

function setFilter (filter) {
  genefilter.setFilter({ filter: filter.id, type: 'goterm' })
}
</script>

<style scoped>
.goterms-list {
  max-height: 300px;
  overflow-y: auto;
}
</style>
