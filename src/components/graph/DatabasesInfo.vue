<template>
  <section class="space-y-4 border-t border-border px-4 py-4">
    <!-- Pathogenicity prediction -->
    <div>
      <p class="eyebrow">Prediction</p>
      <div class="mt-2 grid grid-cols-2 gap-2">
        <div class="rounded-card border border-border bg-surface-2 px-2.5 py-2">
          <p class="eyebrow">SIFT</p>
          <p class="mt-0.5 font-mono text-sm font-semibold text-ink">
            {{ variant.sift_score || '—' }}
          </p>
          <span
            v-if="variant.sift_prediction"
            class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs capitalize"
            :class="predTone(variant.sift_prediction, 'deleterious')"
          >
            {{ variant.sift_prediction.replace(/_/g, ' ') }}
          </span>
          <p v-else class="mt-1 text-xs text-ink-4">Not available</p>
        </div>

        <div class="rounded-card border border-border bg-surface-2 px-2.5 py-2">
          <p class="eyebrow">PolyPhen</p>
          <p class="mt-0.5 font-mono text-sm font-semibold text-ink">
            {{ variant.polyphen_score || '—' }}
          </p>
          <span
            v-if="variant.polyphen_prediction"
            class="mt-1 inline-block rounded-full px-2 py-0.5 text-xs capitalize"
            :class="predTone(variant.polyphen_prediction, 'damaging')"
          >
            {{ variant.polyphen_prediction.replace(/_/g, ' ') }}
          </span>
          <p v-else class="mt-1 text-xs text-ink-4">Not available</p>
        </div>
      </div>
    </div>

    <!-- Clinical databases -->
    <div>
      <p class="eyebrow">Clinical</p>
      <div class="mt-2 space-y-1.5">
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs text-ink-3">{{ dbFormat('Clinvar') }}</span>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="presenceTone(variant[`clinvar_${version}`])"
          >
            {{ variant[`clinvar_${version}`] ? 'Present' : 'Absent' }}
          </span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs text-ink-3">{{ dbFormat('Cosmic') }}</span>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="presenceTone(variant[`cosmic_${version}`])"
          >
            {{ variant[`cosmic_${version}`] ? 'Present' : 'Absent' }}
          </span>
        </div>
      </div>
      <div class="mt-2.5">
        <p class="text-xs text-ink-3">Clinical significance</p>
        <p
          v-if="hasSignificance"
          class="mt-0.5 break-words text-sm capitalize text-ink"
        >
          {{ significance }}
        </p>
        <p v-else class="mt-0.5 text-sm text-ink-4">Not available</p>
      </div>
    </div>

    <!-- Population databases -->
    <div>
      <p class="eyebrow">Population</p>
      <div class="mt-2 space-y-1.5">
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs text-ink-3">{{ dbFormat('gnomAD') }}</span>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="presenceTone(variant[`gnomad_${version}`])"
          >
            {{ variant[`gnomad_${version}`] ? 'Present' : 'Absent' }}
          </span>
        </div>
        <div class="flex items-center justify-between gap-3">
          <span class="text-xs text-ink-3">{{ dbFormat('dbSnp') }}</span>
          <span
            class="rounded-full px-2 py-0.5 text-xs font-medium"
            :class="presenceTone(variant[`dbSnp_${version}`])"
          >
            {{ variant[`dbSnp_${version}`] ? 'Present' : 'Absent' }}
          </span>
        </div>
      </div>
      <div class="mt-2.5 flex items-baseline justify-between gap-3">
        <span class="text-xs text-ink-3">Total population frequency</span>
        <span
          v-if="hasPopulation"
          class="shrink-0 font-mono text-sm font-semibold text-ink"
        >
          {{ population }}
        </span>
        <span v-else class="shrink-0 text-sm text-ink-4">Not available</span>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import dbNameFormat from '@/lib/dbNameFormat'
import { useMainStore } from '@/stores/main'

const GROUP_POSITION = 1

const main = useMainStore()

const version = computed(() => main.getVersion)
const variant = computed(() => main.getVariant)

function dbFormat (dbName) {
  return dbNameFormat(dbName)
}

// Presence badge: present is clinically notable (uncertain tone), absent neutral.
function presenceTone (present) {
  return present
    ? 'bg-uncertain-soft text-uncertain'
    : 'bg-surface-3 text-ink-3'
}

// Prediction badge: a deleterious/damaging keyword reads pathogenic, else benign.
function predTone (prediction, harmfulKeyword) {
  return prediction.toLowerCase().includes(harmfulKeyword)
    ? 'bg-pathogenic-soft text-pathogenic'
    : 'bg-benign-soft text-benign'
}

const significance = computed(() => {
  const clinvarInfo = variant.value[`clinvar_${version.value}_info`]
  if (!clinvarInfo) {
    return '-'
  }
  const cs = clinvarInfo.match(/CLNDN=([^;]+)/)[GROUP_POSITION]
  // cs == 'Melanoma,_cutaneous_malignant,_susceptibility_to,_10'
  const arr = cs.split(',').reverse()
  const noTenArr = arr.slice(1)
  return noTenArr.map((w) => w.replace(/_/g, ' ').trim()).join(' ')
})

const population = computed(() => {
  const gnomadInfo = variant.value[`gnomad_${version.value}_info`]
  if (!gnomadInfo) {
    return '-'
  }
  const tp = gnomadInfo.match(/AF=([^;]+)/)[GROUP_POSITION]
  return parseFloat(tp)
})

const hasSignificance = computed(() => {
  const s = significance.value
  return !!s && s !== '-'
})

const hasPopulation = computed(() => population.value !== '-')
</script>
