<template>
  <div class="space-y-2">
    <input
      v-model.trim="search"
      type="text"
      placeholder="Filter by sample"
      class="t-base w-full rounded-lg border border-border bg-surface px-3 py-2
             text-sm text-ink placeholder:text-ink-4 focus:border-primary
             focus:outline-none focus:ring-2 focus:ring-primary/20"
    />

    <label
      class="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-2
             text-xs font-semibold text-ink-2"
    >
      <input
        v-model="selectAll"
        type="checkbox"
        class="accent-primary"
      />
      Select all samples
    </label>

    <ul
      v-if="options.length"
      class="divide-y divide-border overflow-hidden rounded-lg border border-border"
    >
      <li
        v-for="sample in options"
        :key="sample.id"
        class="t-base bg-surface hover:bg-surface-2"
      >
        <label class="flex cursor-pointer items-center gap-2 px-3 py-2">
          <input
            v-model="selected"
            type="checkbox"
            :value="sample.id"
            class="accent-primary"
          />
          <span class="min-w-0 flex-1 truncate font-mono text-xs text-ink">
            {{ sample.name }}
          </span>
        </label>
      </li>
    </ul>

    <p
      v-else
      class="px-1 py-2 text-xs text-ink-3"
    >
      No samples match your search
    </p>
  </div>
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
