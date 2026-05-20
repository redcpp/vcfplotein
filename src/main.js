import { createApp } from 'vue'
import { createPinia } from 'pinia'
import Notifications from '@kyvg/vue3-notification'
import VueFullscreen from 'vue-fullscreen'

import '@fortawesome/fontawesome-free/css/all.css'
import '@/assets/css/main.css'
import '@/assets/css/viz.css'

import App from '@/App.vue'
import router from '@/router'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Notifications)
app.use(VueFullscreen)

app.mount('#app')
