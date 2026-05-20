<template>
  <span
    class="p-0"
    title="Download as PNG"
    data-toggle="tooltip"
    data-placement="right"
  >
    <i class="fa fa-file-image"></i>
  </span>
</template>

<script setup>
// Ported from components/sidebar/DownloadPng.vue.
// Grabs the chart rendered by another cluster as <svg id="SvgGrouper">.
// `downloadPng` is exposed via defineExpose so Navbar can call it through a ref.
import { computed } from 'vue'
import { saveSvgAsPng } from 'save-svg-as-png'

import { useMainStore } from '@/stores/main'

const main = useMainStore()
const myInfo = computed(() => main.getInfo)

function downloadPng () {
  const filename = `plotein_${myInfo.value.name}.png`
  const svg = document.getElementById('SvgGrouper')
  if (!svg) {
    console.error('DownloadPng: #SvgGrouper not found')
    return
  }
  saveSvgAsPng(svg, filename)
}

defineExpose({ downloadPng })
</script>
