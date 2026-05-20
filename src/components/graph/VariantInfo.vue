<template>
  <section>
    <p class="eyebrow">Variant</p>

    <dl class="mt-2 divide-y divide-border">
      <div class="flex items-baseline justify-between gap-3 py-1.5">
        <dt class="text-xs text-ink-3">Chromosome</dt>
        <dd class="font-mono text-sm text-ink">{{ main.getVariant.chr }}</dd>
      </div>
      <div class="flex items-baseline justify-between gap-3 py-1.5">
        <dt class="text-xs text-ink-3">Genomic position</dt>
        <dd class="font-mono text-sm text-ink">{{ main.getVariant.pos }}</dd>
      </div>
      <div class="flex items-baseline justify-between gap-3 py-1.5">
        <dt class="text-xs text-ink-3">Protein position</dt>
        <dd class="font-mono text-sm text-ink">{{ main.getVariant.aa_pos }}</dd>
      </div>
      <div class="flex items-baseline justify-between gap-3 py-1.5">
        <dt class="text-xs text-ink-3">Allele change</dt>
        <dd class="font-mono text-sm text-ink">
          {{ main.getVariant.ref }}
          <span class="text-ink-4">&rarr;</span>
          {{ main.getVariant.alt }}
        </dd>
      </div>
      <div class="flex items-baseline justify-between gap-3 py-1.5">
        <dt class="text-xs text-ink-3">Aminoacid change</dt>
        <dd class="font-mono text-sm text-ink">{{ main.getVariant.aa_change }}</dd>
      </div>
    </dl>

    <div class="mt-3">
      <p class="eyebrow">Consequences</p>
      <ul class="mt-1.5 flex flex-wrap gap-1.5">
        <li
          v-for="con in main.getVariant.consequences"
          :key="con"
          class="inline-flex items-center gap-1.5 rounded-full border border-border
                 bg-surface-2 px-2 py-0.5 text-xs capitalize text-ink-2"
        >
          <span
            class="h-2 w-2 shrink-0 rounded-full"
            :style="`background-color:${colorcons[con]};`"
          />
          {{ con.replace(/_/g, ' ') }}
        </li>
      </ul>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { useMainStore } from '@/stores/main'

const main = useMainStore()

const colorcons = computed(() => {
  const dict = {}
  for (const con of main.getConsequences) {
    dict[con.name] = con.color
  }
  return dict
})
</script>
