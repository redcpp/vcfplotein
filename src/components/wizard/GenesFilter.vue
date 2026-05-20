<template>
  <base-titled-section title="Filter genes">
    <ul class="mt-2 flex flex-wrap gap-1" role="tablist">
      <li v-for="item in list" :key="item.key" role="presentation">
        <button
          type="button"
          role="tab"
          :aria-selected="cur.key === item.key"
          class="rounded px-3 py-1.5 text-sm transition-colors"
          :class="cur.key === item.key
            ? 'bg-go-secondary text-white'
            : 'text-go-primary hover:bg-gray-100'"
          @click="setCurrent(item)"
        >
          {{ item.title }}
        </button>
      </li>
    </ul>

    <div class="pt-3">
      <ChromosomeFilter v-if="cur.key === 'chr'" />
      <div v-else-if="mySpinner" class="flex justify-center py-4">
        <span class="inline-block h-8 w-8 animate-spin rounded-full
                     border-4 border-go-secondary border-t-transparent"></span>
      </div>
      <GotermsFilter v-else-if="cur.key === 'bio'" :list="bio" :title="cur.title" />
      <GotermsFilter v-else-if="cur.key === 'mol'" :list="mol" :title="cur.title" />
      <GotermsFilter v-else-if="cur.key === 'cel'" :list="cel" :title="cur.title" />
      <p v-else>Error</p>
    </div>
  </base-titled-section>
</template>

<script setup>
import { computed, ref } from 'vue'

import { useMainStore } from '@/stores/main'
import ChromosomeFilter from '@/components/wizard/ChromosomeFilter.vue'
import GotermsFilter from '@/components/wizard/GotermsFilter.vue'

const main = useMainStore()

const list = [
  { title: 'Chromosome', key: 'chr' },
  { title: 'Biological process', key: 'bio' },
  { title: 'Molecular function', key: 'mol' },
  { title: 'Cellular component', key: 'cel' }
]

const cur = ref(list[0])
const fetchedGoterms = ref(false)

const myGoterms = computed(() => main.getGoterms)
const mySpinner = computed(() => main.getSpinner)

const bio = computed(() => myGoterms.value['biological_process'] || [])
const mol = computed(() => myGoterms.value['molecular_function'] || [])
const cel = computed(() => myGoterms.value['cellular_component'] || [])

function setCurrent (item) {
  cur.value = item
  if (!fetchedGoterms.value) {
    fetchedGoterms.value = true
    main.fetchGoterms()
  }
}
</script>
