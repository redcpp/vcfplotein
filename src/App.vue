<template>
  <div
    v-if="loaded"
    id="default-wrapper"
    class="min-h-screen bg-white text-go-charcoal"
  >
    <Navbar />
    <main>
      <router-view />
    </main>
    <notifications />
  </div>

  <!-- Initial-load gate: ported from layouts/default.vue. -->
  <div
    v-else
    class="flex h-screen items-center justify-center"
  >
    <Spinner />
  </div>
</template>

<script setup>
// App shell — ported from layouts/default.vue.
// Nuxt's <nuxt/> outlet becomes <router-view/>; <notifications/> is registered
// globally by @kyvg/vue3-notification. The `loaded` flag preserves the old
// next-tick gate that showed <Spinner/> until the first render completed.
import { ref, nextTick, onMounted } from 'vue'

import Navbar from '@/components/Navbar.vue'
import Spinner from '@/components/Spinner.vue'

const loaded = ref(false)

onMounted(() => {
  nextTick(() => {
    loaded.value = true
  })
})
</script>
