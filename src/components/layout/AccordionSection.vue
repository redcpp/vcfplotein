<template>
  <section class="border-b border-border last:border-b-0">
    <h3>
      <button
        type="button"
        class="t-base flex w-full items-center gap-2.5 px-4 py-3 text-left hover:bg-surface-2"
        :aria-expanded="open"
        @click="open = !open"
      >
        <i
          class="fa fa-chevron-right text-[10px] text-ink-3 transition-transform duration-200"
          :class="{ 'rotate-90': open }"
        ></i>
        <span class="flex-1 text-[13px] font-semibold tracking-tight text-ink">
          {{ title }}
        </span>
        <span
          v-if="badge !== null && badge !== undefined && badge !== ''"
          class="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px] font-medium text-ink-3"
        >
          {{ badge }}
        </span>
      </button>
    </h3>

    <transition name="acc">
      <div v-show="open" class="overflow-hidden">
        <div class="px-4 pb-4 pt-0.5">
          <slot />
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup>
// A collapsible section for the inspector sidebar.
import { ref } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  badge: { type: [String, Number], default: null },
  defaultOpen: { type: Boolean, default: true }
})

const open = ref(props.defaultOpen)
</script>

<style scoped>
.acc-enter-active,
.acc-leave-active {
  transition: opacity 0.18s ease;
}
.acc-enter-from,
.acc-leave-to {
  opacity: 0;
}
</style>
