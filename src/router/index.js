import { createRouter, createWebHashHistory } from 'vue-router'

import Index from '@/views/Index.vue'
import About from '@/views/About.vue'
import Wizard from '@/views/Wizard.vue'
import Graph from '@/views/Graph.vue'

const routes = [
  { path: '/', name: 'index', component: Index },
  { path: '/about', name: 'about', component: About },
  { path: '/wizard', name: 'wizard', component: Wizard },
  { path: '/graph', name: 'graph', component: Graph }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
