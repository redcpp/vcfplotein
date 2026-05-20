<template>
  <base-titled-section title="Samples">
    <div>
      <input
        v-model.trim="search"
        type="text"
        placeholder="Filter by sample"
        class="mb-0 w-full rounded border border-gray-300 px-2 py-1 text-sm"
      />
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
            <th class="border border-gray-300 px-2 py-1 text-left">Sample</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="sample in options"
            :key="sample.id"
            class="odd:bg-white even:bg-gray-50"
          >
            <td class="border border-gray-300 px-2 py-1 text-center">
              <input
                v-model="selected"
                type="checkbox"
                :value="sample.id"
                class="align-middle"
              />
            </td>
            <td class="border border-gray-300 px-2 py-1">{{ sample.name }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </base-titled-section>
</template>

<script setup>
// Ported from components/sidebar/FilterSamples.vue.
// b-form-group/b-form-input -> plain Tailwind input; Vuex -> Pinia main store.
import { ref, computed } from 'vue'

import { useMainStore } from '@/stores/main'

const main = useMainStore()

const search = ref('')

const myPlottedSamples = computed(() => main.getPlottedSamples)
const myStatusSamples = computed(() => main.getStatusSamples)

const options = computed(() =>
  myPlottedSamples.value.filter(sample => sample.name.includes(search.value))
)

const selected = computed({
  get () {
    return myStatusSamples.value.map(s => s.id)
  },
  set (newList) {
    main.setSelectedSamples(newList)
  }
})

const selectAll = computed({
  get () {
    return selected.value.length === myPlottedSamples.value.length
  },
  set (value) {
    if (value) {
      selected.value = myPlottedSamples.value.map(s => s.id)
      search.value = ''
    } else {
      selected.value = []
    }
  }
})
</script>
