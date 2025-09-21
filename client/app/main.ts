import 'uno.css'
import '@unocss/reset/eric-meyer.css'
import { mount } from 'svelte'
import App from './app.svelte'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
