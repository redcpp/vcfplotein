<template>
  <div class="card p-4">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div class="relative min-w-[14rem] flex-1">
        <i
          class="fas fa-search pointer-events-none absolute left-3 top-1/2
                 -translate-y-1/2 text-sm text-ink-4"
          aria-hidden="true"
        ></i>
        <input
          v-model.trim="search"
          type="text"
          placeholder="Search a gene"
          aria-describedby="inputLiveHelp inputLiveFeedback"
          class="t-base w-full rounded-lg border border-border bg-surface py-2 pl-9
                 pr-3 text-sm text-ink placeholder:text-ink-4 focus:border-primary
                 focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div class="flex items-center gap-2">
        <span
          v-if="myFilter"
          class="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-2.5
                 py-1 text-xs font-medium text-primary-ink"
        >
          {{ myFilterType }}
          <span class="font-mono">{{ myFilter }}</span>
        </span>
        <span class="text-xs font-medium text-ink-3">
          {{ filteredGeneList.length }} genes
        </span>
      </div>
    </div>

    <DataTable
      id="tabla"
      class="mt-3"
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
          class="t-base cursor-pointer font-mono font-semibold text-primary
                 hover:text-primary-hover hover:underline"
          @click.prevent="goToGraph(item)"
        >
          {{ value }}
        </a>
      </template>
    </DataTable>

    <div
      v-show="filteredGeneList.length > props.perPage"
      class="flex justify-center pt-3"
    >
      <Pagination
        v-model="currentPage"
        :total-rows="filteredGeneList.length"
        :per-page="props.perPage"
      />
    </div>
  </div>
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
