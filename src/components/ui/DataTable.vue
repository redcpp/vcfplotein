<template>
  <table class="w-full border-collapse text-sm">
    <caption v-if="$slots['table-caption']" class="p-2 text-center text-go-primary-light">
      <slot name="table-caption" />
    </caption>

    <thead>
      <tr class="border-b-2 border-gray-300 text-left">
        <th
          v-for="field in fields"
          :key="field.key"
          class="px-3 py-2 font-semibold text-go-primary select-none"
          :class="{ 'cursor-pointer hover:bg-gray-100': field.sortable }"
          @click="field.sortable && toggleSort(field.key)"
        >
          <span class="inline-flex items-center gap-1">
            {{ field.label }}
            <span v-if="field.sortable" class="text-xs text-go-primary-light">
              <template v-if="internalSortBy === field.key">
                {{ sortDesc ? '▼' : '▲' }}
              </template>
              <template v-else>{{ '⇅' }}</template>
            </span>
          </span>
        </th>
      </tr>
    </thead>

    <tbody>
      <tr
        v-for="(item, rowIndex) in pagedItems"
        :key="rowIndex"
        class="border-b border-gray-200"
        :class="[
          striped && rowIndex % 2 === 1 ? 'bg-gray-50' : '',
          hover ? 'hover:bg-go-secondary-light/10' : ''
        ]"
      >
        <td
          v-for="field in fields"
          :key="field.key"
          class="px-3 py-2 align-middle text-go-charcoal"
        >
          <slot
            :name="field.key"
            :value="item[field.key]"
            :item="item"
          >
            {{ item[field.key] }}
          </slot>
        </td>
      </tr>

      <tr v-if="pagedItems.length === 0">
        <td :colspan="fields.length" class="px-3 py-6 text-center text-go-primary-light">
          No data
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  fields: { type: Array, required: true },
  items: { type: Array, default: () => [] },
  sortBy: { type: String, default: '' },
  perPage: { type: Number, default: 0 },
  currentPage: { type: Number, default: 1 },
  striped: { type: Boolean, default: false },
  hover: { type: Boolean, default: false }
})

defineEmits(['update:currentPage'])

// Sort state — seeded from the `sortBy` prop, then owned internally.
const internalSortBy = ref(props.sortBy)
const sortDesc = ref(false)

function toggleSort (key) {
  if (internalSortBy.value === key) {
    sortDesc.value = !sortDesc.value
  } else {
    internalSortBy.value = key
    sortDesc.value = false
  }
}

const sortedItems = computed(() => {
  if (!internalSortBy.value) return props.items
  const key = internalSortBy.value
  const dir = sortDesc.value ? -1 : 1
  return [...props.items].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av == null && bv == null) return 0
    if (av == null) return -dir
    if (bv == null) return dir
    if (av < bv) return -dir
    if (av > bv) return dir
    return 0
  })
})

// External pagination — slice the (sorted) items for the current page.
const pagedItems = computed(() => {
  if (props.perPage <= 0) return sortedItems.value
  const start = (props.currentPage - 1) * props.perPage
  return sortedItems.value.slice(start, start + props.perPage)
})
</script>
