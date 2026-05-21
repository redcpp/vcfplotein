<template>
  <!--
    Variant navigator — a permanent master-detail column.

    The variant-detail column used to mount/unmount with a `v-if`, which made
    the plot reflow and caused missclicks. The column is now always present:
    it shows a clickable variant LIST when nothing is selected, and the variant
    DETAIL (VariantInfo + DatabasesInfo) when a variant is selected.

    Height-bounded + sticky so a gene with hundreds of variants scrolls WITHIN
    the column instead of stretching the page.
  -->
  <div
    class="card sticky top-[4.5rem] flex max-h-[calc(100vh-6.5rem)]
           flex-col overflow-hidden"
  >
    <!-- ---------------------------------------------------- DETAIL mode -->
    <template v-if="variantSelected">
      <div
        class="flex shrink-0 items-center justify-between gap-2 border-b
               border-border px-3 py-2.5"
      >
        <button
          type="button"
          class="t-base inline-flex items-center gap-1.5 rounded-md px-2 py-1
                 text-xs font-semibold text-ink-3 hover:bg-surface-2
                 hover:text-ink"
          @click="main.clearVariant()"
        >
          <i class="fa fa-angle-left text-sm"></i>
          Variants
        </button>
        <button
          type="button"
          class="t-base flex h-7 w-7 items-center justify-center rounded-md
                 text-ink-3 hover:bg-surface-2 hover:text-ink"
          aria-label="Close variant detail"
          @click="main.clearVariant()"
        >
          <i class="fa fa-xmark text-sm"></i>
        </button>
      </div>
      <div class="min-h-0 flex-1 overflow-y-auto">
        <VariantInfo />
        <DatabasesInfo />
      </div>
    </template>

    <!-- ------------------------------------------------------ LIST mode -->
    <template v-else>
      <div
        class="flex shrink-0 items-center justify-between gap-2 border-b
               border-border px-4 py-3"
      >
        <span class="eyebrow">Variants</span>
        <span
          class="inline-flex min-w-[1.5rem] items-center justify-center
                 rounded-full bg-surface-2 px-1.5 py-0.5 text-xs font-semibold
                 text-ink-2"
        >
          {{ mutations.length }}
        </span>
      </div>

      <div
        v-if="mutations.length"
        ref="listRef"
        class="min-h-0 flex-1 overflow-y-auto p-1.5"
      >
        <button
          v-for="variant in mutations"
          :key="variant.id"
          :ref="el => setRowRef(el, variant.id)"
          type="button"
          class="t-base flex w-full items-center gap-2.5 rounded-card px-2.5
                 py-2 text-left hover:bg-surface-2"
          :class="variant.id === selectedId
            ? 'bg-surface-2 ring-1 ring-border'
            : ''"
          @click="main.setVariant(variant)"
        >
          <span
            class="h-2.5 w-2.5 shrink-0 rounded-full"
            :style="`background-color:${primaryColor(variant)};`"
          />
          <span class="min-w-0 flex-1">
            <span class="block font-mono text-sm font-semibold text-ink">
              {{ aaChangeLabel(variant) }}
            </span>
            <span class="block truncate text-xs text-ink-3">
              {{ primaryConsequence(variant) }}
            </span>
          </span>
          <span
            v-if="inClinicalDb(variant)"
            class="h-2 w-2 shrink-0 rounded-full bg-pathogenic"
            :title="clinicalDbTitle(variant)"
          />
        </button>
      </div>

      <div
        v-else
        class="flex min-h-0 flex-1 items-center justify-center p-6 text-center"
      >
        <p class="text-sm text-ink-3">
          No variants match the current filters.
        </p>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { useMainStore } from '@/stores/main'

import VariantInfo from '@/components/graph/VariantInfo.vue'
import DatabasesInfo from '@/components/graph/DatabasesInfo.vue'

const main = useMainStore()

// --- selection -------------------------------------------------------------
// "Selected" test — mirrors the original Graph.vue `variantSelected` computed:
// a variant is selected when `getVariant` is a non-empty object.
const variantSelected = computed(() => {
  const v = main.getVariant
  if (!v) return false
  for (const key in v) {
    if (Object.prototype.hasOwnProperty.call(v, key)) return true
  }
  return false
})

const selectedId = computed(() =>
  main.getVariant && main.getVariant.id != null ? main.getVariant.id : null
)

// The plot-filtered, protein-position-sorted variant set the plot also draws.
const mutations = computed(() => main.getMutations)

// --- consequence color / labels (same logic as SvgGrouper.vue) -------------
const consequenceColor = computed(() => {
  const dict = {}
  for (const c of main.getConsequences) dict[c.name] = c.color
  return dict
})

const consequenceNames = computed(() => main.getConsequences.map(c => c.name))

function aaChangeLabel (d) {
  const letters = (d.aa_change || '').split('/')
  return `${letters[0] || ''}${d.aa_pos}${letters[1] || ''}`
}

function variantConsequences (d) {
  return (d.consequences || []).filter(c => consequenceNames.value.includes(c))
}

function primaryColor (d) {
  const cs = variantConsequences(d)
  return cs.length ? consequenceColor.value[cs[0]] : '#7a8499'
}

function primaryConsequence (d) {
  const cs = variantConsequences(d)
  return cs.length ? cs[0].replace(/_/g, ' ') : '—'
}

// --- clinical-database flag (right-edge dot) -------------------------------
function inClinvar (d) {
  return !!d[`clinvar_${main.getVersion}`]
}

function inCosmic (d) {
  return !!d[`cosmic_${main.getVersion}`]
}

function inClinicalDb (d) {
  return inClinvar(d) || inCosmic(d)
}

function clinicalDbTitle (d) {
  const dbs = []
  if (inClinvar(d)) dbs.push('ClinVar')
  if (inCosmic(d)) dbs.push('COSMIC')
  return `In ${dbs.join('/')}`
}

// --- polish: scroll the last-selected row back into view -------------------
const listRef = ref(null)
const rowRefs = new Map()
let lastSelectedId = null

function setRowRef (el, id) {
  if (el) rowRefs.set(id, el)
  else rowRefs.delete(id)
}

// Remember which variant was selected; when we return to LIST mode, bring
// that row into view so the user keeps their place in a long list.
watch(selectedId, (id) => {
  if (id != null) lastSelectedId = id
})

watch(variantSelected, (isSelected) => {
  if (isSelected || lastSelectedId == null) return
  nextTick(() => {
    const row = rowRefs.get(lastSelectedId)
    if (row && typeof row.scrollIntoView === 'function') {
      row.scrollIntoView({ block: 'nearest' })
    }
  })
})
</script>
