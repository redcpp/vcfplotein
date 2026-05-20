<template>
  <base-titled-section title="Open VCF or Bookmark">
    <FileInput
      :model-value="myFile"
      accept=".vcf,.gz,.json"
      placeholder="Browse files..."
      class="mt-2"
      @update:model-value="onFileChosen"
    />

    <div class="mt-3">
      Selected file:<br />
      <span class="font-bold">
        {{ (myFile && myFile.name) || 'None' }}
      </span>
    </div>

    <p v-if="myFile" class="mt-3">
      Reference genome: ({{ myVersion }})
      <br />
      <span class="font-bold">
        Human assembly {{ myVersion === 37 ? 'GRCh37 (hg 19)' : 'GRCh38' }}
      </span>
    </p>
  </base-titled-section>
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
