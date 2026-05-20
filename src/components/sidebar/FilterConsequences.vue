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
        <th class="border border-gray-300 px-2 py-1 text-left">Consequence</th>
        <th class="w-[20px] border border-gray-300 px-2 py-1 text-left">Color</th>
      </tr>
    </thead>
    <tbody>
      <tr
        v-for="con in myConsequences"
        :key="con.id"
        class="odd:bg-white even:bg-gray-50"
      >
        <th class="border border-gray-300 px-2 py-1 text-center">
          <input
            v-model="selected"
            type="checkbox"
            :value="con.id"
            class="align-middle"
          />
        </th>
        <td class="border border-gray-300 px-2 py-1">{{ con.name }}</td>
        <td class="border border-gray-300 px-1 py-1">
          <input
            :id="con.id"
            :value="con.color"
            type="color"
            class="h-6 w-full cursor-pointer border-0 p-0"
            @change="changeColor"
          />
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
// Ported from components/sidebar/FilterConsequences.vue.
// Vuex mapGetters/mapActions + `$store.commit('setConsequenceColor')` ->
// Pinia getters/actions on the main store.
import { computed } from 'vue'

import { useMainStore } from '@/stores/main'

const main = useMainStore()

const myConsequences = computed(() => main.getConsequences)
const myStatusConsequences = computed(() => main.getStatusConsequences)

const selected = computed({
  get () {
    const ids = myStatusConsequences.value.map(c => c.id)
    return [...new Set(ids)]
  },
  set (newList) {
    main.setSelectedConsequences(newList)
  }
})

const selectAll = computed({
  get () {
    return selected.value.length === myConsequences.value.length
  },
  set (value) {
    selected.value = value ? myConsequences.value.map(c => c.id) : []
  }
})

function changeColor (event) {
  const index = event.target.id
  const val = event.target.value
  main.setConsequenceColor({ index, val })
}
</script>
