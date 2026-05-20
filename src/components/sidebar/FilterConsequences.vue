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
      Select all consequences
    </label>

    <ul class="divide-y divide-border overflow-hidden rounded-lg border border-border">
      <li
        v-for="con in myConsequences"
        :key="con.id"
        class="t-base flex items-center gap-2 bg-surface px-3 py-2 hover:bg-surface-2"
      >
        <input
          v-model="selected"
          type="checkbox"
          :value="con.id"
          class="accent-primary"
        />
        <span class="min-w-0 flex-1 truncate text-sm text-ink">{{ con.name }}</span>
        <label
          class="relative h-6 w-6 shrink-0 cursor-pointer overflow-hidden
                 rounded-md border border-border ring-1 ring-inset ring-black/5"
          :style="{ backgroundColor: con.color }"
        >
          <input
            :id="con.id"
            :value="con.color"
            type="color"
            class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            @change="changeColor"
          />
        </label>
      </li>
    </ul>
  </div>
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
