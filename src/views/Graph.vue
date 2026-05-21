<template>
  <div class="min-h-full">
    <!-- No dataset -->
    <div
      v-if="!main.getFile"
      class="flex min-h-[70vh] items-center justify-center p-6"
    >
      <div class="card max-w-md p-8 text-center">
        <div class="mx-auto flex h-12 w-12 items-center justify-center
                    rounded-xl bg-surface-2 text-ink-3">
          <i class="fa fa-dna text-lg"></i>
        </div>
        <h2 class="mt-4 text-lg font-bold text-ink">No dataset loaded</h2>
        <p class="mt-1.5 text-sm text-ink-2">
          Open a VCF or bookmark and pick a gene to see its variant map.
        </p>
        <router-link
          to="/wizard"
          class="t-base mt-5 inline-flex items-center gap-2 rounded-xl
                 bg-primary px-4 py-2.5 text-sm font-semibold text-white
                 hover:bg-primary-hover"
        >
          <i class="fa fa-arrow-up-from-bracket text-xs"></i>
          Open a dataset
        </router-link>
      </div>
    </div>

    <!-- Workspace -->
    <fullscreen
      v-else
      ref="fullscreenRef"
      class="bg-canvas"
    >
      <div
        id="page-content-wrapper"
        class="flex min-h-full flex-col gap-4 p-4 lg:gap-5 lg:p-6"
      >
        <GeneInfo />

        <div class="flex min-h-0 flex-1 items-start gap-4 lg:gap-5">
          <!-- Plot / table -->
          <div class="min-w-0 flex-1">
            <div
              v-if="main.getSpinner"
              class="card flex min-h-[420px] flex-col items-center
                     justify-center gap-5"
            >
              <Spinner />
              <p class="text-sm font-medium text-ink-2">
                Annotating variants…
              </p>
            </div>

            <MainCard v-else-if="main.getVariants.length" />

            <div
              v-else-if="main.getError"
              class="card flex min-h-[420px] flex-col items-center
                     justify-center p-8 text-center"
            >
              <div class="flex h-12 w-12 items-center justify-center
                          rounded-xl bg-pathogenic-soft text-pathogenic">
                <i class="fa fa-triangle-exclamation text-lg"></i>
              </div>
              <h3 class="mt-4 text-base font-bold text-ink">
                Couldn't load variants
              </h3>
              <p class="mt-1.5 max-w-sm text-sm text-ink-2">
                {{ main.getError }}
              </p>
            </div>

            <div
              v-else
              class="card flex min-h-[420px] flex-col items-center
                     justify-center p-8 text-center"
            >
              <div class="flex h-12 w-12 items-center justify-center
                          rounded-xl bg-surface-2 text-ink-3">
                <i class="fa fa-wave-square text-lg"></i>
              </div>
              <h3 class="mt-4 text-base font-bold text-ink">
                No variants to display
              </h3>
              <p class="mt-1.5 max-w-sm text-sm text-ink-2">
                This transcript has no variants matching the current filters.
                Adjust the consequence, domain or sample filters in the panel.
              </p>
            </div>
          </div>

          <!-- Variant detail dock -->
          <transition name="dock">
            <aside
              v-if="variantSelected"
              class="w-[20rem] shrink-0
                     max-xl:fixed max-xl:bottom-0 max-xl:right-0 max-xl:top-14
                     max-xl:z-30 max-xl:w-[22rem] max-xl:overflow-y-auto
                     max-xl:p-4 max-xl:shadow-lg max-xl:bg-canvas"
            >
              <div class="card overflow-hidden">
                <div class="flex items-center justify-between border-b
                            border-border px-4 py-3">
                  <span class="eyebrow">Variant detail</span>
                  <button
                    type="button"
                    class="t-base flex h-7 w-7 items-center justify-center
                           rounded-md text-ink-3 hover:bg-surface-2
                           hover:text-ink"
                    aria-label="Close variant detail"
                    @click="main.clearVariant()"
                  >
                    <i class="fa fa-xmark text-sm"></i>
                  </button>
                </div>
                <VariantInfo />
                <DatabasesInfo />
              </div>
            </aside>
          </transition>
        </div>
      </div>
    </fullscreen>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { component as Fullscreen } from 'vue-fullscreen'
import { useNotification } from '@kyvg/vue3-notification'

import emitter from '@/eventBus'
import { useMainStore } from '@/stores/main'
import { useGenefilterStore } from '@/stores/genefilter'

import Spinner from '@/components/Spinner.vue'
import MainCard from '@/components/graph/MainCard.vue'
import GeneInfo from '@/components/graph/GeneInfo.vue'
import VariantInfo from '@/components/graph/VariantInfo.vue'
import DatabasesInfo from '@/components/graph/DatabasesInfo.vue'

const main = useMainStore()
const genefilter = useGenefilterStore()
const { notify } = useNotification()

const fullscreenRef = ref(null)

const variantSelected = computed(() => {
  const v = main.getVariant
  if (!v) return false
  for (const key in v) {
    if (Object.prototype.hasOwnProperty.call(v, key)) return true
  }
  return false
})

function fetchingError (err) {
  console.warn(err)
  notify({
    title: 'Network error.',
    text: 'Problem retrieving data from external databases.',
    type: 'error'
  })
}

// Load whenever a gene is selected in the store. Bookmarks already hold the
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

function handleFullscreen () {
  if (fullscreenRef.value && typeof fullscreenRef.value.toggle === 'function') {
    // The Fullscreen API can throw synchronously or reject asynchronously
    // ("Permissions check failed"); swallow both so the click never errors.
    try {
      Promise.resolve(fullscreenRef.value.toggle()).catch(() => {})
    } catch {
      /* fullscreen unavailable — ignore */
    }
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

watch(() => main.getSelectedGene, () => {
  if (main.getFile) {
    loadSelectedGene()
  }
})
</script>

<style scoped>
.dock-enter-active,
.dock-leave-active {
  transition: opacity 0.22s ease, transform 0.22s ease;
}
.dock-enter-from,
.dock-leave-to {
  opacity: 0;
  transform: translateX(12px);
}
</style>
