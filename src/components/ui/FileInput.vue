<template>
  <div
    class="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg
           border-2 border-dashed px-6 py-8 text-center transition-colors"
    :class="dragging
      ? 'border-go-secondary bg-go-secondary-light/10'
      : 'border-gray-300 hover:border-go-secondary-light hover:bg-gray-50'"
    role="button"
    tabindex="0"
    @click="openPicker"
    @keydown.enter.prevent="openPicker"
    @keydown.space.prevent="openPicker"
    @dragover.prevent="dragging = true"
    @dragenter.prevent="dragging = true"
    @dragleave.prevent="dragging = false"
    @drop.prevent="onDrop"
  >
    <input
      ref="inputRef"
      type="file"
      class="hidden"
      :accept="accept"
      @change="onChange"
    />

    <span class="text-3xl text-go-primary-light" aria-hidden="true">⬆</span>

    <p v-if="modelValue" class="font-medium text-go-primary">
      {{ modelValue.name }}
    </p>
    <p v-else class="text-go-primary-light">
      {{ placeholder }}
    </p>

    <p class="text-xs text-go-primary-light">
      Click to browse or drag &amp; drop a file here
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  accept: { type: String, default: '' },
  placeholder: { type: String, default: 'No file selected' },
  modelValue: { type: [Object, null], default: null }
})

const emit = defineEmits(['update:modelValue'])

const inputRef = ref(null)
const dragging = ref(false)

function openPicker () {
  inputRef.value && inputRef.value.click()
}

function onChange (event) {
  const file = event.target.files && event.target.files[0]
  if (file) emit('update:modelValue', file)
}

function onDrop (event) {
  dragging.value = false
  const file = event.dataTransfer.files && event.dataTransfer.files[0]
  if (file) emit('update:modelValue', file)
}
</script>
