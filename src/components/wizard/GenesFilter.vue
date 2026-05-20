<template>
  <div>
    <div class="grid grid-cols-2 gap-1 rounded-xl bg-surface-2 p-1" role="tablist">
      <button
        v-for="item in list"
        :key="item.key"
        type="button"
        role="tab"
        :aria-selected="cur.key === item.key"
        class="t-base rounded-lg px-2 py-1.5 text-xs font-semibold"
        :class="cur.key === item.key
          ? 'bg-primary-soft text-primary-ink shadow-xs'
          : 'text-ink-3 hover:bg-surface-3 hover:text-ink'"
        @click="setCurrent(item)"
      >
        {{ item.title }}
      </button>
    </div>

    <div class="pt-3">
      <ChromosomeFilter v-if="cur.key === 'chr'" />
      <div v-else-if="mySpinner" class="flex justify-center py-6">
        <span class="inline-block h-7 w-7 animate-spin rounded-full
                     border-2 border-primary border-t-transparent"></span>
      </div>
      <GotermsFilter v-else-if="cur.key === 'bio'" :list="bio" :title="cur.title" />
      <GotermsFilter v-else-if="cur.key === 'mol'" :list="mol" :title="cur.title" />
      <GotermsFilter v-else-if="cur.key === 'cel'" :list="cel" :title="cur.title" />
      <p v-else class="py-4 text-center text-sm text-ink-3">Error</p>
    </div>
  </div>
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
