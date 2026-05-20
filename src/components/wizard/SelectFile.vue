<template>
  <div>
    <FileInput
      :model-value="myFile"
      accept=".vcf,.gz,.json"
      placeholder="Browse files..."
      @update:model-value="onFileChosen"
    />

    <dl class="mt-3 space-y-2">
      <div>
        <dt class="eyebrow text-ink-3">Selected file</dt>
        <dd class="mt-0.5 truncate font-mono text-sm text-ink">
          {{ (myFile && myFile.name) || 'None' }}
        </dd>
      </div>

      <div v-if="myFile">
        <dt class="eyebrow text-ink-3">Reference genome</dt>
        <dd class="mt-0.5 font-mono text-sm text-ink">
          {{ myVersion === 37 ? 'GRCh37 (hg19)' : 'GRCh38' }}
        </dd>
      </div>
    </dl>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { notify } from '@kyvg/vue3-notification'

import { useMainStore } from '@/stores/main'
import FileInput from '@/components/ui/FileInput.vue'

const main = useMainStore()

const myFile = computed(() => main.getFile)
const myVersion = computed(() => main.getVersion)

function validName (file) {
  if (file.name.endsWith('.json')) return true
  if (file.name.endsWith('.vcf')) return true
  if (file.name.endsWith('.vcf.gz')) return true
  return false
}

function invalidFileError () {
  notify({
    title: 'Invalid file type.',
    text: 'Make sure to use a vcf file.',
    type: 'warn'
  })
}

function onFileChosen (newFile) {
  if (!newFile) return
  if (!validName(newFile)) {
    invalidFileError()
    return
  }
  // `chooseFile` clears all data, sets the file and parses the
  // VCF / bookmark contents. Show the spinner while it runs.
  main.setSpinner(true)
  try {
    main.chooseFile(newFile)
  } catch (err) {
    const title = 'Error reading file.'
    console.warn(title, err && err.message)
    main.setSpinner(false)
    notify({
      title,
      text: 'Make sure the uncompressed vcf is a valid one.',
      type: 'error'
    })
  }
}
</script>
