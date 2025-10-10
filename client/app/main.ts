import 'uno.css'
import '@unocss/reset/eric-meyer.css'
import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './app.vue'
import router from './router'

const mobileQuery = matchMedia('(max-width: 639px)')
const setMobile = () => {
  document.body.id = mobileQuery.matches ? 'mobile' : ''
}

mobileQuery.addEventListener('change', setMobile)
setMobile()

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
