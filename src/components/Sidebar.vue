<template>
  <aside
    v-show="!sidebar.isCollapsed"
    id="sidebar-wrapper"
    class="z-40 flex w-80 shrink-0 flex-col border-r border-border bg-surface
           max-lg:fixed max-lg:bottom-0 max-lg:left-0 max-lg:top-14"
  >
    <!-- Sidebar header -->
    <div class="flex h-11 shrink-0 items-center justify-between border-b
                border-border px-4">
      <span class="eyebrow">{{ browseMode ? 'Dataset' : 'Inspector' }}</span>
      <button
        type="button"
        class="t-base flex h-7 w-7 items-center justify-center rounded-md
               text-ink-3 hover:bg-surface-2 hover:text-ink lg:hidden"
        aria-label="Close panel"
        @click="sidebar.setCollapsed(true)"
      >
        <i class="fa fa-xmark text-sm"></i>
      </button>
    </div>

    <!-- Sections -->
    <div class="min-h-0 flex-1 overflow-y-auto">
      <template v-if="browseMode">
        <AccordionSection title="Open dataset">
          <SelectFile />
        </AccordionSection>
        <AccordionSection
          v-if="hasGenes"
          title="Filter genes"
          :badge="geneCount"
        >
          <GenesFilter />
        </AccordionSection>
      </template>

      <template v-else>
        <AccordionSection
          title="Dataset"
          :default-open="false"
        >
          <SelectFile />
        </AccordionSection>
        <AccordionSection
          v-if="hasTranscripts"
          title="Transcript"
          :badge="transcriptCount"
        >
          <SelectTranscript />
        </AccordionSection>
        <AccordionSection
          v-if="hasGeneLoaded"
          title="Consequences"
          :badge="consequenceCount"
        >
          <FilterConsequences />
        </AccordionSection>
        <AccordionSection
          v-if="hasGeneLoaded"
          title="Protein domains"
          :badge="domainCount"
        >
          <FilterDomains />
        </AccordionSection>
        <AccordionSection
          v-if="hasGeneLoaded"
          title="Clinical databases"
          :default-open="false"
        >
          <FilterClinical />
        </AccordionSection>
        <AccordionSection
          v-if="hasGeneLoaded"
          title="Samples"
          :badge="sampleCount"
          :default-open="false"
        >
          <FilterSamples />
        </AccordionSection>
        <AccordionSection
          title="Bookmarks"
          :default-open="false"
        >
          <Bookmarks />
        </AccordionSection>
      </template>
    </div>
  </aside>
</template>

<script setup>
// Persistent inspector sidebar. Shows dataset + gene-filter tools while
// browsing genes, and the full variant inspector once a gene is open.
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { useMainStore } from '@/stores/main'
import { useSidebarStore } from '@/stores/sidebar'

import AccordionSection from '@/components/layout/AccordionSection.vue'
import SelectFile from '@/components/wizard/SelectFile.vue'
import GenesFilter from '@/components/wizard/GenesFilter.vue'
import SelectTranscript from '@/components/sidebar/SelectTranscript.vue'
import FilterConsequences from '@/components/sidebar/FilterConsequences.vue'
import FilterDomains from '@/components/sidebar/FilterDomains.vue'
import FilterClinical from '@/components/sidebar/FilterClinical.vue'
import FilterSamples from '@/components/sidebar/FilterSamples.vue'
import Bookmarks from '@/components/sidebar/Bookmarks.vue'

const route = useRoute()
const main = useMainStore()
const sidebar = useSidebarStore()

const browseMode = computed(() => route.name === 'wizard')

const hasGenes = computed(() => main.getGenes.length > 0)
const hasTranscripts = computed(() => main.getTranscripts.length > 0)
const hasGeneLoaded = computed(() => !!(main.getInfo && main.getInfo.name))

const geneCount = computed(() => main.getGenes.length)
const transcriptCount = computed(() => main.getTranscripts.length)
const consequenceCount = computed(() => main.getConsequences.length)
const domainCount = computed(() => main.getDomains.length)
const sampleCount = computed(() => main.getSamples.length)
</script>
