<template>
  <table class="mb-0 w-full border border-gray-300 text-sm">
    <thead>
      <tr class="bg-gray-100">
        <th class="w-[50px] border border-gray-300 px-2 py-1 text-center">
          <input
            v-model="selectAll"
            type="checkbox"
            class="align-middle"
          />
        </th>
        <th class="border border-gray-300 px-2 py-1 text-left">Database</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="option in options"
        :key="option"
        class="odd:bg-white even:bg-gray-50"
      >
        <th class="border border-gray-300 px-2 py-1 text-center">
          <input
            v-model="selected"
            type="checkbox"
            :value="option"
            class="align-middle"
          />
        </th>
        <td class="border border-gray-300 px-2 py-1">{{ option }}</td>
      </tr>
    </tbody>
  </table>
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

const options = ['clinvar', 'cosmic', 'dbSnp', 'gnomAD']
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
    selected.value = value ? [...options] : []
  }
})
</script>
