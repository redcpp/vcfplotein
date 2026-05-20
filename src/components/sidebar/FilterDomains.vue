<template>
  <div class="space-y-2">
    <input
      v-model.trim="search"
      type="text"
      placeholder="Filter by domain"
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
      Select all domains
    </label>

    <ul
      v-if="options.length"
      class="divide-y divide-border overflow-hidden rounded-lg border border-border"
    >
      <li
        v-for="dom in options"
        :key="dom.id"
        class="t-base flex items-center gap-2 bg-surface px-3 py-2 hover:bg-surface-2"
      >
        <input
          v-model="selected"
          type="checkbox"
          :value="dom.id"
          class="accent-primary"
        />
        <span
          :title="dom.name"
          class="min-w-0 flex-1"
        >
          <span class="block truncate text-sm text-ink">{{ dom.family }}</span>
          <span class="block font-mono text-[11px] text-ink-3">{{ dom.start }}&ndash;{{ dom.end }}</span>
        </span>
        <label
          class="relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden
                 rounded-md border border-border ring-1 ring-inset ring-black/5"
          :style="{ backgroundColor: dom.color }"
        >
          <input
            :id="dom.id"
            :value="dom.color"
            type="color"
            class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            @change="changeColor"
          />
        </label>
      </li>
    </ul>

    <p
      v-else
      class="px-1 py-2 text-xs text-ink-3"
    >
      No domains match your search
    </p>
  </div>
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
