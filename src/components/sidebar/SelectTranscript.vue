<template>
  <div class="space-y-1">
    <button
      v-for="transcript_id in myTranscripts"
      :key="transcript_id"
      type="button"
      class="t-base flex w-full items-center justify-between gap-2 rounded-lg
             border px-3 py-2 text-left"
      :class="transcript_id === myInfo.transcript_id
        ? 'border-primary bg-primary-soft text-primary-ink'
        : 'border-border bg-surface text-ink-2 hover:border-border-strong hover:bg-surface-2 hover:text-ink'"
      @click="main.setSelectedGene(createInfo(transcript_id))"
    >
      <span class="truncate font-mono text-xs">{{ transcript_id }}</span>
      <span class="flex shrink-0 items-center gap-1.5">
        <span
          v-if="transcript_id === myInfo.canonical"
          class="rounded bg-accent-soft px-1.5 py-0.5 text-[10px]
                 font-semibold uppercase tracking-wide text-accent"
        >
          Canonical
        </span>
        <i
          v-if="transcript_id === myInfo.transcript_id"
          class="fa fa-check text-xs text-primary"
        ></i>
      </span>
    </button>

    <p
      v-if="myTranscripts.length === 0"
      class="px-1 py-2 text-xs text-ink-3"
    >
      No transcripts available
    </p>
  </div>
</template>

<script setup>
// Ported from components/sidebar/SelectTranscript.vue.
// b-list-group(-item) + `:to` -> <router-link>; Vuex getters -> Pinia main store.
import { computed } from 'vue'

import { useMainStore } from '@/stores/main'

const main = useMainStore()

const myInfo = computed(() => main.getInfo)
const myTranscripts = computed(() => main.getTranscripts)

function createInfo (transcript_id) {
  const newInfo = Object.assign({}, myInfo.value)
  newInfo.transcript_id = transcript_id
  return newInfo
}
</script>
