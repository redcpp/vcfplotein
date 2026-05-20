<template>
  <div class="card p-5">
    <!-- Gene identity -->
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">Gene</p>
        <h2 class="text-3xl font-bold italic leading-tight text-ink">
          {{ main.getInfo.name }}
        </h2>
        <div class="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
          <span class="text-xs text-ink-3">
            Ensembl
            <span class="ml-1 font-mono text-ink-2">{{ main.getInfo.id }}</span>
          </span>
          <span class="text-xs text-ink-3">
            Transcript
            <span class="ml-1 font-mono text-ink-2">{{ main.getInfo.transcript_id }}</span>
          </span>
        </div>
      </div>
    </div>

    <!-- Stat tiles -->
    <div class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div class="rounded-card border border-border bg-surface-2 px-3 py-2.5">
        <p class="eyebrow">Total gene variants</p>
        <p class="mt-1 font-mono text-xl font-semibold text-ink">
          {{ main.getInfo.num_vcf_vars }}
        </p>
      </div>
      <div class="rounded-card border border-border bg-surface-2 px-3 py-2.5">
        <p class="eyebrow">Variants in transcript</p>
        <p class="mt-1 font-mono text-xl font-semibold text-ink">
          {{ main.getVariants.length }}
        </p>
      </div>
      <div class="rounded-card border border-border bg-surface-2 px-3 py-2.5">
        <p class="eyebrow">Variants in graph</p>
        <p class="mt-1 font-mono text-xl font-semibold text-primary-ink">
          {{ main.getStatusVariants.length }}
        </p>
      </div>
      <div class="rounded-card border border-border bg-surface-2 px-3 py-2.5">
        <p class="eyebrow">Samples in graph</p>
        <p class="mt-1 font-mono text-xl font-semibold text-ink">
          {{ main.getStatusSamples.length }}
        </p>
      </div>
    </div>

    <!-- Consequences legend + base changes -->
    <div class="mt-4 grid gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <p class="eyebrow">Consequences in graph</p>
        <ul class="mt-2 flex flex-wrap gap-1.5">
          <li
            v-for="con in main.getStatusConsequences"
            :key="con.id"
            class="inline-flex items-center gap-1.5 rounded-full border border-border
                   bg-surface-2 px-2 py-0.5 text-xs capitalize text-ink-2"
          >
            <span
              class="h-2 w-2 shrink-0 rounded-full"
              :style="`background-color:${con.color};`"
            />
            {{ con.name.replace(/_/g, ' ') }}
          </li>
          <li v-if="main.getStatusConsequences.length === 0" class="text-xs text-ink-4">
            None
          </li>
        </ul>
      </div>

      <div>
        <p class="eyebrow">Base changes <span class="normal-case text-ink-4">(in graph)</span></p>
        <div class="mt-2 grid grid-cols-4 gap-2">
          <div
            v-for="ref in baseRefs"
            :key="ref.ref"
            class="rounded-card border border-border bg-surface-2 px-2 py-1.5"
          >
            <p class="font-mono text-sm font-semibold text-ink">{{ ref.ref }}</p>
            <p
              v-for="alt in ref.alts"
              :key="alt.base"
              class="font-mono text-[0.6875rem] leading-tight text-ink-3"
            >
              {{ alt.base }} {{ alt.count }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMainStore } from '@/stores/main'

const main = useMainStore()

const baseRefs = computed(() => {
  const counts = main.getBaseCount
  return [
    { ref: 'A', alts: ['G', 'C', 'T'].map((b) => ({ base: b, count: counts.A[b] })) },
    { ref: 'G', alts: ['A', 'C', 'T'].map((b) => ({ base: b, count: counts.G[b] })) },
    { ref: 'C', alts: ['A', 'G', 'T'].map((b) => ({ base: b, count: counts.C[b] })) },
    { ref: 'T', alts: ['A', 'C', 'G'].map((b) => ({ base: b, count: counts.T[b] })) }
  ]
})
</script>
