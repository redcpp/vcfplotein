<template>
  <div class="space-y-2">
    <label
      class="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2
             text-xs font-semibold text-ink-2"
    >
      <input
        v-model="selectAll"
        type="checkbox"
        class="accent-primary"
      />
      Require all databases
    </label>

    <ul class="divide-y divide-border overflow-hidden rounded-lg border border-border">
      <li
        v-for="option in options"
        :key="option.id"
        class="t-base bg-surface hover:bg-surface-2"
      >
        <label class="flex cursor-pointer items-center gap-2 px-3 py-2">
          <input
            v-model="selected"
            type="checkbox"
            :value="option.id"
            class="accent-primary"
          />
          <span class="text-sm text-ink">{{ option.label }}</span>
        </label>
      </li>
    </ul>
  </div>
</template>

<script setup>
// Ported from components/sidebar/FilterClinical.vue.
// Vuex `$store.commit('setFilter*')` -> Pinia actions on the main store.
// Note: the old code passed `newList.includes('gnomad')` while the option label
// is `gnomAD` — that mismatch meant the gnomAD filter never toggled. Fixed here
// to use the actual option string.
import { ref, computed } from 'vue'

import { useMainStore } from '@/stores/main'

const main = useMainStore()

const options = [
  { id: 'clinvar', label: 'ClinVar' },
  { id: 'cosmic', label: 'COSMIC' },
  { id: 'dbSnp', label: 'dbSNP' },
  { id: 'gnomAD', label: 'gnomAD' }
]
const list = ref([])

const selected = computed({
  get () {
    return list.value
  },
  set (newList) {
    main.setFilterClinvar(newList.includes('clinvar'))
    main.setFilterCosmic(newList.includes('cosmic'))
    main.setFilterDbsnp(newList.includes('dbSnp'))
    main.setFilterGnomad(newList.includes('gnomAD'))
    list.value = newList
  }
})

const selectAll = computed({
  get () {
    return selected.value.length === options.length
  },
  set (value) {
    selected.value = value ? options.map(o => o.id) : []
  }
})
</script>
