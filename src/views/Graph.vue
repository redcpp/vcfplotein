<template>
  <div id="wrapper" :class="{ flex: main.getFile, toggle: sidebar.isActive }">
    <template v-if="main.getFile">
      <Sidebar class="no-print" />
      <fullscreen ref="fullscreenRef" class="flex min-w-0 flex-1 flex-col">
        <div id="page-content-wrapper" class="flex min-h-[calc(100vh-56px)] flex-1 flex-col">
          <div class="row1 order-1">
            <variant-info v-if="objIsNotEmpty(main.getVariant)" class="gene-info" />
            <gene-info v-else class="gene-info" />
          </div>
          <div class="row3 order-3">
            <databases-info
              v-if="objIsNotEmpty(main.getVariant)"
              class="gene-info"
              style="border-top: solid 2px #ccc; border-bottom: none;"
            />
          </div>
          <div class="row2 order-2 flex flex-1 items-center justify-center">
            <spinner v-if="main.getSpinner" class="mt-4 pt-4" />
            <main-card v-else-if="main.getVariants.length" />
            <h4 v-else class="text-center">No data to display</h4>
          </div>
        </div>
      </fullscreen>
    </template>
    <template v-else>
      <div class="text-center">
        <h3 class="mt-5">No file was found</h3>
        <h4>
          Please go back to the
          <span class="font-bold"><router-link to="/wizard">Wizard</router-link></span>
        </h4>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { component as Fullscreen } from 'vue-fullscreen'
import { useNotification } from '@kyvg/vue3-notification'

import emitter from '@/eventBus'
import { useMainStore } from '@/stores/main'
import { useSidebarStore } from '@/stores/sidebar'
import { useGenefilterStore } from '@/stores/genefilter'

import Sidebar from '@/components/Sidebar.vue'
import Spinner from '@/components/Spinner.vue'
import MainCard from '@/components/graph/MainCard.vue'
import GeneInfo from '@/components/graph/GeneInfo.vue'
import VariantInfo from '@/components/graph/VariantInfo.vue'
import DatabasesInfo from '@/components/graph/DatabasesInfo.vue'

const main = useMainStore()
const sidebar = useSidebarStore()
const genefilter = useGenefilterStore()
const { notify } = useNotification()

const fullscreenRef = ref(null)

function objIsNotEmpty (obj) {
  if (!obj) return false
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      return true
    }
  }
  return false
}

function fetchingError (err) {
  console.warn(err)
  notify({
    title: 'Network error.',
    text: 'Problem retrieving data from external databases.',
    type: 'error'
  })
}

// NEW approach (replaces the OLD `$route.query.gene` read + `beforeRouteUpdate`):
// load whenever a gene is selected in the store. Bookmarks already hold the
// computed transcripts, so they use `chooseGene`; a raw VCF needs `fetchAllData`.
function loadSelectedGene () {
  const gene = main.getSelectedGene
  if (!gene) return
  if (main.isBookmark) {
    main.chooseGene(gene)
  } else {
    Promise.resolve(main.fetchAllData(gene)).catch(fetchingError)
  }
}

// Fullscreen toggle, driven by the shared event bus.
function handleFullscreen () {
  if (fullscreenRef.value && typeof fullscreenRef.value.toggle === 'function') {
    fullscreenRef.value.toggle()
  }
}

onMounted(() => {
  genefilter.clearFilter()
  emitter.on('fullscreen', handleFullscreen)
  if (main.getFile) {
    loadSelectedGene()
  }
})

onUnmounted(() => {
  emitter.off('fullscreen', handleFullscreen)
})

// Re-fetch when the selected gene changes (replaces OLD `beforeRouteUpdate`).
watch(() => main.getSelectedGene, () => {
  if (main.getFile) {
    loadSelectedGene()
  }
})
</script>
