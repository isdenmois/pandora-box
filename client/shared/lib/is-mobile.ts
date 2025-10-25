import { ref } from 'vue'

export const isMobile = ref(false)

if (typeof matchMedia === 'function') {
  const mobileQuery = matchMedia('(max-width: 639px)')

  const setMobile = () => {
    isMobile.value = mobileQuery.matches
    document.body.id = mobileQuery.matches ? 'mobile' : ''
  }

  mobileQuery.addEventListener('change', setMobile)
  setMobile()
}
