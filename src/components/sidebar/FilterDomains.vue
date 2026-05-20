<template>
  <base-titled-section title="Domains">
    <div>
      <input
        v-model.trim="search"
        type="text"
        placeholder="Filter by domain"
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
            <th class="border border-gray-300 px-2 py-1 text-left">Domain</th>
            <th class="w-[20px] border border-gray-300 px-2 py-1 text-left">Color</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="dom in options"
            :key="dom.id"
            class="odd:bg-white even:bg-gray-50"
          >
            <td class="border border-gray-300 px-2 py-1 text-center">
              <input
                v-model="selected"
                type="checkbox"
                :value="dom.id"
                class="align-middle"
              />
            </td>
            <td
              :title="dom.name"
              data-toggle="tooltip"
              data-placement="top"
              class="border border-gray-300 px-2 py-1"
            >
              {{ dom.family }}
              <span class="text-go-primary-light">({{ dom.start }}, {{ dom.end }})</span>
            </td>
            <td class="border border-gray-300 px-1 py-1">
              <input
                :id="dom.id"
                :value="dom.color"
                type="color"
                class="h-6 w-full cursor-pointer border-0 p-0"
                @change="changeColor"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </base-titled-section>
</template>

<script setup>
// Ported from components/sidebar/FilterDomains.vue.
// b-form-group/b-form-input -> plain Tailwind input; Vuex -> Pinia main store.
import { ref, computed } from 'vue'

import { useMainStore } from '@/stores/main'

const main = useMainStore()

const search = ref('')

const myDomains = computed(() => main.getDomains)
const myStatusDomains = computed(() => main.getStatusDomains)

const options = computed(() =>
  myDomains.value.filter(domain => domain.family.includes(search.value))
)

const selected = computed({
  get () {
    const ids = myStatusDomains.value.map(d => d.id)
    return [...new Set(ids)]
  },
  set (newList) {
    main.setSelectedDomains(newList)
  }
})

const selectAll = computed({
  get () {
    return selected.value.length === myDomains.value.length
  },
  set (value) {
    if (value) {
      selected.value = myDomains.value.map(d => d.id)
      search.value = ''
    } else {
      selected.value = []
    }
  }
})

function changeColor (event) {
  const index = event.target.id
  const val = event.target.value
  main.setDomainColor({ index, val })
}
</script>
