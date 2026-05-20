<template>
  <div
    id="sidebar-wrapper"
    class="flex h-full"
  >
    <!-- Icon rail -->
    <ul class="sidebar-nav m-0 list-none bg-go-primary p-0">
      <li
        v-for="item in items"
        :key="item.fa"
        class="leading-10"
      >
        <button
          type="button"
          data-toggle="tooltip"
          data-placement="right"
          :title="item.title"
          class="block w-full cursor-pointer px-4 py-2 text-white
                 hover:bg-go-primary-light"
          :class="{
            'border-l-[3px] border-go-secondary bg-go-primary-light':
              myActive && item.fa === myOption
          }"
          @click="myToggle({ active: true, option: item.fa })"
        >
          <i :class="`fa fa-${item.fa}`"></i>
        </button>
      </li>
    </ul>

    <!-- Switchable panel -->
    <div
      v-show="myActive"
      class="sidebar-extra relative h-full w-72 overflow-y-auto bg-gray-100 pb-12"
    >
      <div class="btn-close-sidebar absolute right-0 top-0">
        <button
          type="button"
          tabindex="-1"
          class="mr-[2px] mt-1 inline-flex h-7 w-7 items-center justify-center
                 rounded-full bg-go-primary-light text-white hover:bg-go-primary"
          @click="myToggle({ active: false })"
        >
          <i class="fa fa-chevron-left"></i>
        </button>
      </div>

      <div class="pl-[0.35rem] text-left">
        <!-- Top nav -->
        <div v-show="myOption === 'upload'">
          <SelectFile />
          <Spinner v-if="mySpinner" class="mt-4 pt-4" />
        </div>
        <GenesTable v-show="myOption === 'dna'" :per-page="9" />
        <SelectTranscript v-show="myOption === 'microscope'" />
        <FilterDomains v-show="myOption === 'layer-group'" />
        <FilterVariants v-show="myOption === 'filter'" />
        <div v-show="myOption === 'plus-square'">
          <h1>Insertions</h1>
        </div>
        <div v-show="myOption === 'minus-square'">
          <h1>Deletions</h1>
        </div>
        <FilterSamples v-show="myOption === 'users'" />
        <Bookmarks v-show="myOption === 'bookmark'" />
        <!-- Bottom nav -->
        <div v-show="myOption === 'cog'">
          <h1>Cog</h1>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Ported from components/Sidebar.vue.
// Hand-rolled icon rail + switchable panel (NOT bootstrap-vue b-sidebar).
// b-btn -> Tailwind <button>; Vuex mapGetters/mapActions -> Pinia stores.
// The old watcher that auto-opened the `dna` panel once genes loaded is kept.
import { computed, watch } from 'vue'

import { useMainStore } from '@/stores/main'
import { useSidebarStore } from '@/stores/sidebar'

import Spinner from '@/components/Spinner.vue'
import SelectFile from '@/components/wizard/SelectFile.vue'
import GenesTable from '@/components/wizard/GenesTable.vue'
import SelectTranscript from '@/components/sidebar/SelectTranscript.vue'
import FilterDomains from '@/components/sidebar/FilterDomains.vue'
import FilterVariants from '@/components/sidebar/FilterVariants.vue'
import FilterSamples from '@/components/sidebar/FilterSamples.vue'
import Bookmarks from '@/components/sidebar/Bookmarks.vue'

const items = [
  { fa: 'upload', title: 'Upload vcf/bookmark' },
  { fa: 'dna', title: 'Select gene' },
  { fa: 'microscope', title: 'Select transcript' },
  { fa: 'layer-group', title: 'Filter domains' },
  { fa: 'filter', title: 'Filter variants' },
  { fa: 'users', title: 'Filter Samples' },
  { fa: 'bookmark', title: 'Bookmarks' }
]

const main = useMainStore()
const sidebar = useSidebarStore()

const myGenes = computed(() => main.getGenes)
const mySpinner = computed(() => main.getSpinner)
const myActive = computed(() => sidebar.isActive)
const myOption = computed(() => sidebar.getOption)

function myToggle (payload) {
  sidebar.toggle(payload)
}

watch(myGenes, (contents) => {
  if (contents.length === 0) return
  sidebar.setOption('dna')
})
</script>
