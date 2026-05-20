<template>
  <div class="container mx-auto px-4 text-left">
    <div class="mt-3 flex flex-wrap gap-4">
      <div class="flex-1 min-w-[18rem]">
        <SelectFile />
      </div>

      <template v-if="myGenes.length">
        <div class="flex-1 min-w-[18rem]">
          <GenesFilter />
        </div>
        <div class="flex-1 min-w-[18rem]">
          <GenesTable :per-page="7" />
        </div>
      </template>

      <template v-else>
        <div class="w-2/3 min-w-[18rem]">
          <div v-if="mySpinner" class="mt-4 pt-4 flex justify-center">
            <span class="inline-block h-10 w-10 animate-spin rounded-full
                         border-4 border-go-secondary border-t-transparent"></span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import { useMainStore } from '@/stores/main'

import SelectFile from '@/components/wizard/SelectFile.vue'
import GenesFilter from '@/components/wizard/GenesFilter.vue'
import GenesTable from '@/components/wizard/GenesTable.vue'

const main = useMainStore()
const route = useRoute()

const myGenes = computed(() => main.getGenes)
const mySpinner = computed(() => main.getSpinner)

// Before the app is fully loaded the old page cleared all data and, when the
// `demo` query param was present, triggered the demo bookmark.
onMounted(() => {
  main.clearAllData()
  if (route.query && route.query.demo) {
    main.setDemoState()
  }
})
</script>
