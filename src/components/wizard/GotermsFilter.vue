<template>
  <div>
    <input
      id="inputLive"
      v-model.trim="search"
      type="text"
      :placeholder="`Search ${title.toLowerCase()}`"
      aria-describedby="inputLiveHelp inputLiveFeedback"
      class="t-base w-full rounded-lg border border-border bg-surface px-3 py-2
             text-sm text-ink placeholder:text-ink-4 focus:border-primary
             focus:outline-none focus:ring-2 focus:ring-primary/20"
    />

    <div class="goterms-list mt-2 space-y-1">
      <button
        v-for="item in filteredList"
        :key="item.id"
        type="button"
        class="t-base flex w-full items-start gap-2 rounded-lg border px-2.5 py-2
               text-left text-sm"
        :class="item.id === myFilter
          ? 'border-primary bg-primary-soft text-primary-ink'
          : 'border-transparent text-ink-2 hover:bg-surface-2 hover:text-ink'"
        @click="setFilter(item)"
      >
        <span
          class="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
          :class="item.id === myFilter ? 'bg-primary' : 'bg-border-strong'"
          aria-hidden="true"
        ></span>
        <span>{{ item.name }}</span>
      </button>
      <p
        v-if="!filteredList.length"
        class="py-3 text-center text-xs text-ink-3"
      >
        No terms found
      </p>
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
