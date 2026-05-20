<template>
  <nav v-if="totalPages > 1" class="flex items-center gap-1" aria-label="Pagination">
    <button
      type="button"
      class="rounded border border-gray-300 px-2 py-1 text-sm text-go-primary
             hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="modelValue <= 1"
      @click="goTo(modelValue - 1)"
    >
      Prev
    </button>

    <button
      v-for="page in pages"
      :key="page.key"
      type="button"
      :disabled="page.value === null"
      class="min-w-[2rem] rounded border px-2 py-1 text-sm"
      :class="page.value === modelValue
        ? 'border-go-secondary bg-go-secondary text-white'
        : 'border-gray-300 text-go-primary hover:bg-gray-100 disabled:cursor-default disabled:opacity-60'"
      @click="page.value !== null && goTo(page.value)"
    >
      {{ page.label }}
    </button>

    <button
      type="button"
      class="rounded border border-gray-300 px-2 py-1 text-sm text-go-primary
             hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
      :disabled="modelValue >= totalPages"
      @click="goTo(modelValue + 1)"
    >
      Next
    </button>
  </nav>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  totalRows: { type: Number, required: true },
  perPage: { type: Number, default: 10 },
  modelValue: { type: Number, default: 1 }
})

const emit = defineEmits(['update:modelValue'])

const totalPages = computed(() => {
  if (props.perPage <= 0) return 1
  return Math.max(1, Math.ceil(props.totalRows / props.perPage))
})

// Build a windowed list of page buttons with ellipsis gaps.
const pages = computed(() => {
  const total = totalPages.value
  const current = props.modelValue
  const result = []
  const window = 1 // pages shown on each side of the current page

  const add = (value) => {
    result.push({
      key: value === null ? `gap-${result.length}` : `p-${value}`,
      label: value === null ? '…' : String(value),
      value
    })
  }

  for (let p = 1; p <= total; p++) {
    if (p === 1 || p === total || (p >= current - window && p <= current + window)) {
      add(p)
    } else if (result.length && result[result.length - 1].value !== null) {
      add(null)
    }
  }
  return result
})

function goTo (page) {
  const clamped = Math.min(Math.max(1, page), totalPages.value)
  if (clamped !== props.modelValue) {
    emit('update:modelValue', clamped)
  }
}
</script>
