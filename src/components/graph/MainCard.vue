<template>
  <div class="card overflow-hidden">
    <div id="main-card" class="overflow-x-auto">
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
      <variants-table
        v-else-if="main.getVariants"
        :variants="main.getStatusVariants"
      />
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
