<template>
  <base-titled-section title="Transcripts">
    <div
      v-for="transcript_id in myTranscripts"
      :key="transcript_id"
      class="flex flex-col"
    >
      <router-link
        :to="{
          path: 'graph',
          query: { gene: createInfo(transcript_id) }
        }"
        class="block border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
        :class="{
          'bg-go-primary text-white hover:bg-go-primary':
            transcript_id === myInfo.transcript_id,
          'font-bold': transcript_id === myInfo.canonical
        }"
      >
        {{ transcript_id }}
      </router-link>
    </div>
  </base-titled-section>
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
