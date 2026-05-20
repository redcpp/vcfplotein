<template>
  <div v-if="loaded">
    <AppShell v-if="inWorkspace">
      <router-view />
    </AppShell>
    <router-view v-else />
    <notifications />
  </div>

  <!-- Initial-load gate. -->
  <div
    v-else
    class="flex h-screen items-center justify-center bg-canvas"
  >
    <Spinner />
  </div>
</template>

<script setup>
// App root. Landing/About render standalone; the genomics workspace
// (gene browser + plot) renders inside the shared AppShell so the two
// routes feel like one continuous tool.
import { ref, computed, nextTick, onMounted } from 'vue'
import { useRoute } from 'vue-router'

import AppShell from '@/components/layout/AppShell.vue'
import Spinner from '@/components/Spinner.vue'

const route = useRoute()
const loaded = ref(false)

const inWorkspace = computed(() => ['wizard', 'graph'].includes(route.name))

onMounted(() => {
  nextTick(() => {
    loaded.value = true
  })
})
</script>
