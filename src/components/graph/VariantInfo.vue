<template>
  <div class="bar-wrapper">
    <div class="general border-right text-left">
      <div class="title"><h5>General</h5></div>
      <div class="only-top">
        <div>
          <p class="subtitle">Gene name</p>
          <p class="gene-name">{{ main.getInfo.name }}</p>
        </div>
        <div class="expand-items">
          <div>
            <p class="subtitle">Ensembl ID</p>
            <p>{{ main.getInfo.id }}</p>
          </div>
          <div>
            <p class="subtitle">Transcript ID</p>
            <p>{{ main.getInfo.transcript_id }}</p>
          </div>
        </div>
      </div>
    </div>

    <div class="variants scrollable border-right">
      <div class="title"><h5>Variants</h5></div>
      <div class="top">
        <div>
          <p class="subtitle">Chromosome</p>
          <p>{{ main.getVariant.chr }}</p>
        </div>
        <div>
          <p class="subtitle">Genomic position</p>
          <p>{{ main.getVariant.pos }}</p>
        </div>
        <div>
          <p class="subtitle">Protein position</p>
          <p>{{ main.getVariant.aa_pos }}</p>
        </div>
      </div>
      <div class="bottom">
        <div>
          <p class="subtitle">Reference</p>
          <p>{{ main.getVariant.ref }}</p>
        </div>
        <div>
          <p class="subtitle">Alternative</p>
          <p>{{ main.getVariant.alt }}</p>
        </div>
        <div>
          <p class="subtitle">Aminoacid Change</p>
          <p>{{ main.getVariant.aa_change }}</p>
        </div>
      </div>
      <div class="scroll">
        <p class="subtitle">Consequences</p>
        <ul class="scroll-list">
          <li
            v-for="con in main.getVariant.consequences"
            :key="con"
            :style="`color:${colorcons[con]};`"
            class="circles"
          >
            <span style="color: black;">{{ con.replace(/_/g, ' ') }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="samples scrollable">
      <div class="title"><h5>Samples</h5></div>
      <div class="top text-left">
        <p style="font-size: .7em;">
          Samples in variant: <strong>{{ main.getVariant.samples.length }}</strong>
        </p>
      </div>
      <div class="scroll">
        <p class="subtitle">Samples</p>
        <ul class="scroll-list">
          <li v-for="sample in main.getVariant.samples" :key="sample.id">
            <span>{{ sample.name }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
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

<style scoped>
ul.cons {
  columns: 2;
  -webkit-columns: 2;
  -moz-columns: 2;
}
</style>
