<template>
  <div id="main-card">
    <svg-grouper
      v-if="!interactions.getFlipped"
      :protein-a-a-size="main.getInfo.length"
      :left-margin="100"
      :right-margin="10"
      :mutations="main.getStatusVariants"
      :domains="main.getStatusDomains"
      :consequences="main.getStatusConsequences"
      :radius="6"
    />
    <div v-else-if="main.getVariants">
      <variants-table :variants="main.getStatusVariants" />
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '@/stores/main'
import { useInteractionsStore } from '@/stores/interactions'

import SvgGrouper from '@/components/graph/SvgGrouper.vue'
import VariantsTable from '@/components/graph/VariantsTable.vue'

const main = useMainStore()
const interactions = useInteractionsStore()
</script>

<style scoped>
#main-card {
  overflow-x: auto;
  width: 100%;
}
.card-header.small-header {
  padding: 3px 1em;
}
.flip-content {
  padding: 0px;
}
</style>
