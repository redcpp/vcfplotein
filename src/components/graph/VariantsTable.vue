<template>
  <div class="card p-5">
    <div class="overflow-x-auto">
      <data-table
        id="tabla"
        striped
        hover
        sort-by="pos"
        :fields="fields"
        :items="variants"
        :current-page="currentPage"
        :per-page="perPage"
      >
        <template #table-caption>
          Variants in graph
        </template>

        <template #consequences="{ value }">
          {{ value.join(', ') }}
        </template>

        <template #samples="{ value }">
          {{ value.map((d) => d.name).join(', ') }}
        </template>
      </data-table>
    </div>

    <div class="mt-4 flex justify-center">
      <pagination
        v-model="currentPage"
        :total-rows="variants.length"
        :per-page="perPage"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

import { useMainStore } from '@/stores/main'
import DataTable from '@/components/ui/DataTable.vue'
import Pagination from '@/components/ui/Pagination.vue'

defineProps({
  variants: { type: Array, required: true }
})

const main = useMainStore()

const currentPage = ref(1)
const perPage = ref(10)

const fields = computed(() => {
  const version = main.getVersion
  return [
    { key: 'chr', label: 'Chr', sortable: false },
    { key: 'pos', label: 'Pos', sortable: true },
    { key: 'ref', label: 'Ref', sortable: true },
    { key: 'alt', label: 'Alt', sortable: true },
    { key: 'aa_pos', label: 'AA pos', sortable: true },
    { key: 'aa_change', label: 'AA change', sortable: true },
    { key: 'consequences', label: 'Consequences', sortable: false },
    { key: `gnomad_${version}`, label: `gnomAD ${version}`, sortable: false },
    { key: `dbSnp_${version}`, label: `dbSNP ${version}`, sortable: false },
    { key: `clinvar_${version}`, label: `ClinVar ${version}`, sortable: false },
    { key: `cosmic_${version}`, label: `COSMIC ${version}`, sortable: false },
    { key: 'samples', label: 'Samples', sortable: false }
  ]
})
</script>
