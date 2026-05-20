<template>
  <div class="bar-wrapper">
    <div class="general border-right text-left">
      <div class="title"><h5>Prediction</h5></div>
      <div class="only-top">
        <div class="expand-items">
          <div>
            <p class="subtitle">Sift score</p>
            <p>{{ variant.sift_score || '-' }}</p>
          </div>
          <div>
            <p class="subtitle">Sift prediction</p>
            <p class="capitalize">
              {{ variant.sift_prediction || 'Not available' }}
            </p>
          </div>
        </div>
        <div class="expand-items">
          <div>
            <p class="subtitle">Polyphen score</p>
            <p>{{ variant.polyphen_score || '-' }}</p>
          </div>
          <div>
            <p class="subtitle">Polyphen prediction</p>
            <p class="capitalize">
              {{ variant.polyphen_prediction
                ? variant.polyphen_prediction.replace(/_/g, ' ')
                : 'Not available' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="variants border-right text-left">
      <div class="title"><h5>Clinical</h5></div>
      <div class="top">
        <div>
          <p class="subtitle" style="text-transform: none;">{{ dbFormat('Clinvar') }}</p>
          <p class="text-normal">
            {{ variant[`clinvar_${version}`] ? 'Present' : 'Absent' }}
          </p>
        </div>
        <div>
          <p class="subtitle" style="text-transform: none;">{{ dbFormat('Cosmic') }}</p>
          <p class="text-normal">
            {{ variant[`cosmic_${version}`] ? 'Present' : 'Absent' }}
          </p>
        </div>
      </div>
      <div class="bottom">
        <div>
          <p class="subtitle">Clinical significance</p>
          <p class="text-normal">
            {{ clinicalSignificance() }}
          </p>
        </div>
      </div>
    </div>

    <div class="samples text-left">
      <div class="title"><h5>Population</h5></div>
      <div class="top">
        <div>
          <p class="subtitle" style="text-transform: none;">{{ dbFormat('gnomAD') }}</p>
          <p class="text-normal">
            {{ variant[`gnomad_${version}`] ? 'Present' : 'Absent' }}
          </p>
        </div>
        <div>
          <p class="subtitle" style="text-transform: none;">{{ dbFormat('dbSnp') }}</p>
          <p class="text-normal">
            {{ variant[`dbSnp_${version}`] ? 'Present' : 'Absent' }}
          </p>
        </div>
      </div>
      <div class="bottom">
        <div>
          <p class="subtitle">Total population</p>
          <p>{{ totalPopulation() }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import dbNameFormat from '@/lib/dbNameFormat'
import { useMainStore } from '@/stores/main'

const GROUP_POSITION = 1

const main = useMainStore()

const version = computed(() => main.getVersion)
const variant = computed(() => main.getVariant)

function dbFormat (dbName) {
  return dbNameFormat(dbName)
}

function clinicalSignificance () {
  const clinvarInfo = variant.value[`clinvar_${version.value}_info`]
  if (!clinvarInfo) {
    return '-'
  }
  const cs = clinvarInfo.match(/CLNDN=([^;]+)/)[GROUP_POSITION]
  // cs == 'Melanoma,_cutaneous_malignant,_susceptibility_to,_10'
  const arr = cs.split(',').reverse()
  const noTenArr = arr.slice(1)
  return noTenArr.map((w) => w.replace(/_/g, ' ').trim()).join(' ')
}

function totalPopulation () {
  const gnomadInfo = variant.value[`gnomad_${version.value}_info`]
  if (!gnomadInfo) {
    return '-'
  }
  const tp = gnomadInfo.match(/AF=([^;]+)/)[GROUP_POSITION]
  return parseFloat(tp)
}
</script>
