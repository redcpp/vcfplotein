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
        <p class="eyebrow">Base changes <span class="normal-case text-ink-4">(ref → alt)</span></p>
        <div class="mt-2 overflow-hidden rounded-card border border-border bg-surface-2">
          <table class="w-full border-collapse text-center font-mono text-xs">
            <thead>
              <tr class="text-ink-4">
                <th class="px-2 py-1.5 font-medium"></th>
                <th
                  v-for="b in bases"
                  :key="`h-${b}`"
                  class="px-2 py-1.5 font-semibold text-ink-3"
                >
                  {{ b }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in baseMatrix"
                :key="row.ref"
                class="border-t border-border"
              >
                <th class="px-2 py-1.5 font-semibold text-ink-3">{{ row.ref }}</th>
                <td
                  v-for="cell in row.cells"
                  :key="`${row.ref}-${cell.alt}`"
                  class="px-2 py-1.5 tabular-nums"
                  :class="cell.alt === row.ref
                    ? 'text-ink-4'
                    : cell.count > 0 ? 'font-semibold text-ink' : 'text-ink-4'"
                >
                  {{ cell.alt === row.ref ? '—' : cell.count }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useMainStore } from '@/stores/main'

const main = useMainStore()

const bases = ['A', 'G', 'C', 'T']

const baseMatrix = computed(() => {
  const counts = main.getBaseCount
  return bases.map((ref) => ({
    ref,
    cells: bases.map((alt) => ({
      alt,
      count: alt === ref ? 0 : counts[ref][alt]
    }))
  }))
})
</script>
