<template>
  <span
    class="p-0"
    title="Download as CSV"
    data-toggle="tooltip"
    data-placement="right"
  >
    <i class="fa fa-file-excel"></i>
  </span>
</template>

<script setup>
// Ported from components/sidebar/DownloadCsv.vue.
// The old code used the legacy `json2csv` package (`require('json2csv').parse`);
// migrated to `@json2csv/plainjs` (`new Parser({ fields }).parse(data)`).
// `downloadCsv` is exposed so Navbar can call it through a ref.
import { computed } from 'vue'
import { saveAs } from 'file-saver'
import { Parser } from '@json2csv/plainjs'

import { useMainStore } from '@/stores/main'

const main = useMainStore()

const myInfo = computed(() => main.getInfo)
const myVariants = computed(() => main.getVariants)
const myVersion = computed(() => main.getVersion)

const fields = computed(() => [
  'chr',
  'pos',
  'ref',
  'alt',
  'aa_pos',
  'aa_change',
  'consequences',
  `gnomad_${myVersion.value}`,
  `dbSnp_${myVersion.value}`,
  `clinvar_${myVersion.value}`,
  `cosmic_${myVersion.value}`,
  'samples'
])

function downloadCsv () {
  try {
    const parser = new Parser({ fields: fields.value })
    const csv = parser.parse(myVariants.value)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    saveAs(blob, `table_${myInfo.value.name}_${myInfo.value.transcript_id}.csv`)
  } catch (err) {
    console.error('wat', err)
  }
}

defineExpose({ downloadCsv })
</script>
