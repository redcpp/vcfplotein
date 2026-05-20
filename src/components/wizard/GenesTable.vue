<template>
  <base-titled-section :title="`Genes (${filteredGeneList.length})`">
    <p v-if="myFilter" class="mb-0 text-go-primary-light">
      Filtered by {{ myFilterType }} ({{ myFilter }})
    </p>

    <input
      v-model.trim="search"
      type="text"
      placeholder="Search a gene"
      aria-describedby="inputLiveHelp inputLiveFeedback"
      class="mt-2 w-full rounded border border-gray-300 px-3 py-1.5 text-sm
             focus:border-go-secondary focus:outline-none"
    />

    <DataTable
      id="tabla"
      class="mt-2"
      striped
      hover
      :fields="fields"
      :items="filteredGeneList"
      :current-page="currentPage"
      :per-page="props.perPage"
      sort-by="name"
    >
      <template #name="{ value, item }">
        <a
          href="#"
          class="cursor-pointer text-go-secondary hover:underline"
          @click.prevent="goToGraph(item)"
        >
          {{ value }}
        </a>
      </template>
    </DataTable>

    <div
      v-show="filteredGeneList.length > props.perPage"
      class="flex justify-center pb-5 pt-2"
    >
      <Pagination
        v-model="currentPage"
        :total-rows="filteredGeneList.length"
        :per-page="props.perPage"
      />
    </div>
  </base-titled-section>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useMainStore } from '@/stores/main'
import { useGenefilterStore } from '@/stores/genefilter'
import DataTable from '@/components/ui/DataTable.vue'
import Pagination from '@/components/ui/Pagination.vue'

const props = defineProps({
  perPage: { type: Number, required: true }
})

const main = useMainStore()
const genefilter = useGenefilterStore()
const router = useRouter()

const search = ref('')
const currentPage = ref(1)

const fields = [
  { key: 'name', label: 'name', sortable: true },
  { key: 'id', label: 'id', sortable: true }
]

const myGenes = computed(() => main.getGenes)
const myFilter = computed(() => genefilter.getFilter)
const myFilterType = computed(() => genefilter.getType)

const filteredGeneList = computed(() => {
  let geneList = myGenes.value.filter((gene) => (
    gene.name.toLowerCase().includes(search.value.toLowerCase()) ||
    gene.id.toLowerCase().includes(search.value.toLowerCase())
  ))
  if (myFilterType.value === 'goterm') {
    geneList = geneList.filter((gene) => (
      gene.go && gene.go.includes(myFilter.value)
    ))
  }
  if (myFilterType.value === 'chromosome') {
    geneList = geneList.filter((gene) => (
      gene.chr.toString() === myFilter.value
    ))
  }
  return geneList
})

// CRITICAL router fix: the old component navigated with
// `:to="{ path: '/graph', query: { gene: data.item } }"`, passing a whole gene
// OBJECT through a query param — that does not survive Vue Router 4. Instead we
// stash the gene in the Pinia store and push a plain route.
function goToGraph (gene) {
  main.setSelectedGene(gene)
  router.push('/graph')
}
</script>
