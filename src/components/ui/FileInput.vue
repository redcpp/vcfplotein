<template>
  <div
    class="t-base flex cursor-pointer flex-col items-center justify-center gap-2
           rounded-card border-2 border-dashed px-5 py-7 text-center"
    :class="dragging
      ? 'border-primary bg-primary-soft'
      : 'border-border-strong bg-surface-2 hover:border-primary hover:bg-primary-soft'"
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

    <span
      class="flex h-10 w-10 items-center justify-center rounded-full
             bg-surface text-primary shadow-xs"
      aria-hidden="true"
    >
      <i class="fas fa-cloud-upload-alt"></i>
    </span>

    <p v-if="modelValue" class="font-mono text-sm font-medium text-ink">
      {{ modelValue.name }}
    </p>
    <p v-else class="text-sm font-semibold text-ink-2">
      {{ placeholder }}
    </p>

    <p class="text-xs text-ink-3">
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
