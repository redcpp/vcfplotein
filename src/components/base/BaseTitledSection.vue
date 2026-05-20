<template>
  <div>
    <label class="text-[1.55rem]">{{ title }}</label>
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true }
})
</script>
