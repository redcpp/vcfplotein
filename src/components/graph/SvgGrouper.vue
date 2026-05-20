<template>
  <!--
    The root <svg> KEEPS id="SvgGrouper" — download components in another
    cluster locate it by that id. The renderless D3 children below render
    nothing of their own; they draw into `container` (the d3 selection of this
    same <svg>).
  -->
  <svg id="SvgGrouper" ref="svgRef" :height="grouperHeight">
    <lollipops
      v-if="container"
      :y="0"
      :data="data"
      :width="width"
      :radius="radius"
      :cons="consequences"
      :container="container"
      :left-margin="leftMargin"
    />
    <domains-expanded
      v-if="container"
      :groups="groups"
      :y="lollipopsHeight"
      :spacing="domainSpacing"
      :data="data"
      :width="width"
      :mainvar="main.getVariant"
      :container="container"
      :left-margin="leftMargin"
      :domain-scale="domainScale"
      :domains="domains"
    />
    <protein-bar
      v-if="container"
      :y="proteinBarY"
      :data="data"
      :container="container"
      :left-margin="leftMargin"
      :right-margin="rightMargin"
      :domain-scale="domainScale"
      :protein-a-a-size="proteinAASize"
      :width="width"
    />
    <Metadata
      v-if="container"
      :y="metadataY"
      :data="data"
      :width="width"
      :radius="radius"
      :version="main.getVersion"
      :mainvar="main.getVariant"
      :container="container"
      :left-margin="leftMargin"
    />
  </svg>
</template>

<script setup>
import * as d3 from 'd3'
import { ref, computed, markRaw, onMounted, onUnmounted, watch } from 'vue'

import { useMainStore } from '@/stores/main'
import { useSidebarStore } from '@/stores/sidebar'

import Lollipops from '@/components/graph/Lollipops.vue'
import DomainsExpanded from '@/components/graph/DomainsExpanded.vue'
import ProteinBar from '@/components/graph/ProteinBar.vue'
import Metadata from '@/components/graph/Metadata.vue'

import calculatePositions from '@/lib/HandleMutations'
import intervalPartition from '@/lib/intervalPartition'

const props = defineProps({
  mutations: { type: Array, required: true },
  domains: { type: Array, required: true },
  consequences: { type: Array, required: true },
  proteinAASize: { type: Number, required: true },
  rightMargin: { type: Number, required: true },
  leftMargin: { type: Number, required: true },
  radius: { type: Number, required: true }
})

const main = useMainStore()
const sidebar = useSidebarStore()

// Template ref to this component's own <svg> — preferred over d3.select('#id').
const svgRef = ref(null)

// `container` holds the d3 selection of the root <svg>. It is markRaw'd so
// Vue's reactivity proxy never wraps D3's internal `_groups`/`_parents` arrays.
const container = ref(null)

const data = ref([])
const width = ref(0)
const domainScale = ref(() => {})

const lollipopsHeight = 130
const proteinHeight = 13
const domainSpacing = 8

const groups = computed(() => intervalPartition(props.domains))
const domainsHeight = computed(() => groups.value.num * domainSpacing)
const proteinBarY = computed(() => lollipopsHeight + domainsHeight.value)
const metadataY = computed(() => proteinBarY.value + proteinHeight)
const grouperHeight = computed(() => metadataY.value + 180)

function recalculate () {
  const mainCard = document.getElementById('main-card')
  if (!mainCard && !svgRef.value) return

  let parentWidth = mainCard
    ? mainCard.getBoundingClientRect().width
    : svgRef.value.getBoundingClientRect().width
  parentWidth += (sidebar.isActive ? 350 : 0)

  const minimumMutationsWidth = (
    4 * props.radius * props.mutations.length + props.leftMargin + props.rightMargin
  )
  width.value = Math.max(parentWidth, minimumMutationsWidth)

  if (container.value) {
    container.value.style('width', width.value)
  }

  domainScale.value = d3.scaleLinear()
    .domain([0, props.proteinAASize])
    .range([props.leftMargin, width.value - props.rightMargin])

  data.value = calculatePositions({
    width: width.value - props.rightMargin - props.leftMargin,
    transAASize: props.proteinAASize,
    leftMargin: props.leftMargin,
    data: props.mutations,
    radius: props.radius
  })
}

onMounted(() => {
  // markRaw the D3 selection so Vue never proxies D3's internal arrays.
  container.value = markRaw(d3.select(svgRef.value))
  recalculate()
  window.addEventListener('resize', recalculate)
})

// The OLD mounted() added a resize listener with NO cleanup — fixed here.
onUnmounted(() => {
  window.removeEventListener('resize', recalculate)
})

watch(
  [
    () => main.getInfo,
    () => props.mutations,
    () => props.domains
  ],
  recalculate,
  { deep: true }
)
</script>

<style>
#SvgGrouper {
  width: 100%;
  display: block;
  overflow-x: auto;
}
#SvgGrouper > svg {
  display: block;
}
</style>
