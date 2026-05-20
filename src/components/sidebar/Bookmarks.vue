<template>
  <base-titled-section title="Bookmarks">
    <div class="rounded border border-gray-200">
      <div
        v-for="t in bookmarkTranscripts"
        :key="t.info.transcript_id"
        class="border-b border-gray-200 px-3 py-2 text-sm last:border-b-0"
      >
        {{ t.info.name }}: {{ t.info.transcript_id }}
      </div>

      <div
        v-if="bookmarkTranscripts.length === 0"
        class="px-3 py-2 text-sm text-go-primary-light"
      >
        No genes added yet
      </div>
    </div>

    <div class="mt-3 flex">
      <button
        type="button"
        class="rounded-l bg-go-primary-light px-3 py-2 text-sm font-medium
               text-white hover:bg-go-primary"
        @click="addTranscriptToBookmark"
      >
        Add to bookmarks
      </button>
      <button
        v-if="bookmarkTranscripts.length"
        type="button"
        class="rounded-r bg-green-600 px-3 py-2 text-sm font-medium
               text-white hover:bg-green-700"
        @click="downloadBookmark"
      >
        Export bookmarks
      </button>
    </div>
  </base-titled-section>
</template>

<script setup>
// Ported from components/sidebar/Bookmarks.vue.
// b-list-group / b-button-group -> Tailwind elements; Vuex -> Pinia main store.
import { computed } from 'vue'
import { saveAs } from 'file-saver'

import { useMainStore } from '@/stores/main'

const main = useMainStore()

const myBookmark = computed(() => main.getBookmark)

const bookmarkTranscripts = computed(() => {
  const transcripts = []
  for (const geneTranscripts of Object.values(myBookmark.value.genes)) {
    transcripts.push(...geneTranscripts)
  }
  return transcripts
})

function addTranscriptToBookmark () {
  main.addTranscriptToBookmark()
}

function downloadBookmark () {
  try {
    const blob = new Blob([JSON.stringify(myBookmark.value)], {
      type: 'application/json'
    })
    const names = Object.keys(myBookmark.value.genes)
    saveAs(blob, `bookmark_${names.join('_')}.json`)
  } catch (err) {
    console.error(err)
  }
}
</script>
