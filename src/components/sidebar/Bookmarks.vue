<template>
  <div class="space-y-3">
    <ul
      v-if="bookmarkTranscripts.length"
      class="divide-y divide-border overflow-hidden rounded-lg border border-border"
    >
      <li
        v-for="t in bookmarkTranscripts"
        :key="t.info.transcript_id"
        class="flex items-center gap-2 bg-surface px-3 py-2"
      >
        <i class="fa fa-bookmark shrink-0 text-xs text-primary"></i>
        <span class="min-w-0 flex-1">
          <span class="block truncate text-sm font-medium text-ink">{{ t.info.name }}</span>
          <span class="block truncate font-mono text-[11px] text-ink-3">
            {{ t.info.transcript_id }}
          </span>
        </span>
      </li>
    </ul>

    <div
      v-else
      class="rounded-lg border border-dashed border-border px-3 py-4
             text-center text-xs text-ink-3"
    >
      No genes added yet
    </div>

    <div class="flex flex-col gap-2">
      <button
        type="button"
        class="t-base flex items-center justify-center gap-2 rounded-xl
               bg-primary px-4 py-2.5 text-sm font-semibold text-white
               hover:bg-primary-hover"
        @click="addTranscriptToBookmark"
      >
        <i class="fa fa-plus"></i>
        Add to bookmarks
      </button>
      <button
        v-if="bookmarkTranscripts.length"
        type="button"
        class="t-base flex items-center justify-center gap-2 rounded-xl
               border border-border bg-surface px-4 py-2 text-sm
               font-semibold text-ink-2 hover:border-border-strong hover:text-ink"
        @click="downloadBookmark"
      >
        <i class="fa fa-download"></i>
        Export bookmarks
      </button>
    </div>
  </div>
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
