<template>
  <base-titled-section title="Variant filter">
    <div
      v-for="(item, key) in list"
      :key="key"
      class="mb-1 rounded border border-gray-300"
    >
      <!-- The old b-card accordion headers were `disabled` (no real collapse);
           ported as plain non-collapsing panel headers. -->
      <div class="p-1">
        <div
          class="cursor-default rounded bg-go-primary px-3 py-2 text-center
                 font-medium text-white opacity-90"
        >
          {{ item.title }}
        </div>
      </div>
      <div class="p-0">
        <FilterConsequences v-if="item.key === 'consequences'" />
        <FilterClinical v-else-if="item.key === 'clinical'" />
      </div>
    </div>
  </base-titled-section>
</template>

<script setup>
// Ported from components/sidebar/FilterVariants.vue.
// The old bootstrap-vue b-card "accordion" had `disabled` headers — there was no
// real collapse behaviour — so this is a plain stacked-panel wrapper.
import FilterConsequences from '@/components/sidebar/FilterConsequences.vue'
import FilterClinical from '@/components/sidebar/FilterClinical.vue'

const list = [
  { title: 'Filter by consequences', key: 'consequences' },
  { title: 'Filter by clinical', key: 'clinical' }
]
</script>
