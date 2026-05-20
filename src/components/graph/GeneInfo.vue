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
      <div class="title" style="grid-column:1/3;"><h5>Variants</h5></div>
      <div class="top">
        <div>
          <p class="subtitle">Total gene variants</p>
          <p>{{ main.getInfo.num_vcf_vars }}</p>
        </div>
        <div>
          <p class="subtitle">Variants in transcript</p>
          <p>{{ main.getVariants.length }}</p>
        </div>
        <div>
          <p class="subtitle">Variants in graph</p>
          <p>{{ main.getStatusVariants.length }}</p>
        </div>
      </div>
      <div class="bottom">
        <div class="expand-items">
          <p style="font-size: .7em;">
            Base changes:<br><span class="muted">(in graph)</span>
          </p>
        </div>
        <div class="count-wrapper">
          <span class="ref">A</span>
          <p class="alt-1">G {{ main.getBaseCount.A.G }}</p>
          <p class="alt-2">C {{ main.getBaseCount.A.C }}</p>
          <p class="alt-3">T {{ main.getBaseCount.A.T }}</p>
        </div>
        <div class="count-wrapper">
          <span class="ref">G</span>
          <p class="alt-2">A {{ main.getBaseCount.G.A }}</p>
          <p class="alt-1">C {{ main.getBaseCount.G.C }}</p>
          <p class="alt-3">T {{ main.getBaseCount.G.T }}</p>
        </div>
        <div class="count-wrapper">
          <span class="ref">C</span>
          <p class="alt-2">A {{ main.getBaseCount.C.A }}</p>
          <p class="alt-1">G {{ main.getBaseCount.C.G }}</p>
          <p class="alt-3">T {{ main.getBaseCount.C.T }}</p>
        </div>
        <div class="count-wrapper">
          <span class="ref">T</span>
          <p class="alt-2">A {{ main.getBaseCount.T.A }}</p>
          <p class="alt-1">C {{ main.getBaseCount.T.C }}</p>
          <p class="alt-3">G {{ main.getBaseCount.T.G }}</p>
        </div>
      </div>
      <div class="scroll">
        <p class="subtitle">Consequences</p>
        <ul class="scroll-list">
          <li
            v-for="con in main.getStatusConsequences"
            :key="con.id"
            :style="`color:${con.color};list-style-type:disc;`"
          >
            <span style="color: black;">{{ con.name.replace(/_/g, ' ') }}</span>
          </li>
        </ul>
      </div>
    </div>

    <div class="samples scrollable">
      <div class="title"><h5>Samples</h5></div>
      <div class="only-top text-left">
        <div class="expand-items">
          <p style="font-size: .7em;">
            Total gene samples: <strong>{{ main.getInfo.num_vcf_samples }}</strong>
          </p>
          <p style="font-size: .7em;">
            Samples in transcript: <strong>{{ main.getSamples.length }}</strong>
          </p>
          <p style="font-size: .7em;">
            Samples in graph: <strong>{{ main.getStatusSamples.length }}</strong>
          </p>
        </div>
      </div>
      <div class="scroll">
        <p class="subtitle">Samples</p>
        <ul class="scroll-list">
          <li v-for="sample in main.getStatusSamples" :key="sample.id">
            <span>{{ sample.name }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useMainStore } from '@/stores/main'

const main = useMainStore()
</script>

<!--
  Graph info-panel styles. Ported verbatim from the OLD global
  `assets/scss/_graph.scss`. NOT scoped: VariantInfo.vue and DatabasesInfo.vue
  share the same `.bar-wrapper` grid markup and depend on these rules.
-->
<style>
.expand-items {
  display: grid;
  align-items: center;
  height: 100%;
}
.bar-wrapper .gene-name {
  font-size: 2.5em;
  font-style: italic;
  font-family: sans-serif !important;
}
.bar-wrapper {
  display: grid;
  grid-auto-columns: auto;
  text-transform: uppercase;
  border-bottom: 2px solid darkgray;
  overflow-x: auto;
  overflow-y: hidden;
}
.bar-wrapper .general { grid-column: 1; }
.bar-wrapper .variants { grid-column: 2; }
.bar-wrapper .samples { grid-column: 3; }
.bar-wrapper .scrollable {
  grid-template-rows: 20px repeat(2, minmax(auto, 50px));
}
.bar-wrapper,
.bar-wrapper h1,
.bar-wrapper h2,
.bar-wrapper h3,
.bar-wrapper h4,
.bar-wrapper h5,
.bar-wrapper h6,
.bar-wrapper p,
.bar-wrapper * {
  font-family: 'Montserrat', sans-serif !important;
  margin: 0;
}
.bar-wrapper > div {
  display: grid;
  grid-auto-columns: minmax(max-content, auto);
  grid-template-rows: 20px auto;
  text-align: center;
}
.bar-wrapper > div .title {
  grid-row: 1;
  grid-column: 1 / 2;
  display: flex;
  text-align: center;
  justify-content: center;
  flex-direction: column;
  background-color: #ddd;
  margin: 0;
}
.bar-wrapper > div .title > * {
  padding: 0;
  margin: 0;
  font-size: 11px;
  font-weight: bold;
}
.bar-wrapper > div .subtitle {
  color: rgb(32, 33, 36);
  font-size: 10px;
  margin-bottom: 0;
}
.bar-wrapper > div .top,
.bar-wrapper > div .bottom,
.bar-wrapper > div .only-top {
  display: grid;
  grid-gap: 10px;
  grid-auto-columns: auto;
  grid-auto-flow: column;
  padding: 3px 10px;
}
.bar-wrapper > div .bottom { grid-row: 3; }
.bar-wrapper > div .only-top {
  grid-row: 2 / 4;
  display: grid;
  align-items: center;
}
.bar-wrapper > div .top {
  grid-row: 2;
  align-items: center;
}
.bar-wrapper > div.border-right { border-right: solid 2px #ccc !important; }
.bar-wrapper > div.scrollable .title { grid-column: 1/3; }
.bar-wrapper > div.scrollable .scroll {
  grid-row: 2/4;
  overflow-y: auto;
  min-width: fit-content;
  padding: 5px 10px 0 10px;
  width: 100%;
}
.bar-wrapper > div.scrollable .scroll .scroll-list {
  font-size: .75em;
  padding-left: 15px;
  text-align: left;
  line-height: 1.5em;
  text-transform: capitalize;
}
.count-wrapper {
  display: grid;
  grid-auto-columns: auto;
}
.count-wrapper p {
  font-size: 10px !important;
  text-align: left;
  margin: 0;
}
.count-wrapper .ref {
  grid-column: 1;
  grid-row: 1 / 4;
  margin-bottom: 0;
  font-size: 1.5em;
  display: flex;
  align-items: center;
}
.count-wrapper .alt-1 {
  grid-column: 2;
  grid-row: 1 / 2;
  align-self: center;
}
.count-wrapper .alt-2 {
  grid-column: 2;
  grid-row: 2 / 3;
  align-self: center;
}
.count-wrapper .alt-3 {
  grid-column: 2;
  grid-row: 3 / 4;
  align-self: center;
}
</style>
