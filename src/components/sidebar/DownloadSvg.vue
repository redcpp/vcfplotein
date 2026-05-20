<template>
  <span
    class="p-0"
    title="Download as SVG"
    data-toggle="tooltip"
    data-placement="right"
  >
    <i class="fa fa-file-code"></i>
  </span>
</template>

<script setup>
// Ported from components/sidebar/DownloadSvg.vue.
// Serializes the chart rendered by another cluster (<svg id="SvgGrouper">) and
// saves it via file-saver. `downloadSvg` is exposed so Navbar can call it.
import { computed } from 'vue'
import { saveAs } from 'file-saver'

import { useMainStore } from '@/stores/main'

const main = useMainStore()
const myInfo = computed(() => main.getInfo)

function saveSvg (svgEl, name) {
  svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  const svgData = svgEl.outerHTML
  const preface = '<?xml version="1.0" standalone="no"?>\r\n'
  const svgBlob = new Blob([preface, svgData], {
    type: 'image/svg+xml;charset=utf-8'
  })
  saveAs(svgBlob, name)
}

function downloadSvg () {
  const svg = document.getElementById('SvgGrouper')
  if (!svg) {
    console.error('DownloadSvg: #SvgGrouper not found')
    return
  }
  saveSvg(svg, `plotein_${myInfo.value.name}.svg`)
}

defineExpose({ downloadSvg })
</script>
