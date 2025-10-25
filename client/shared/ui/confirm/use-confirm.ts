import { ref } from 'vue'

interface Confrim {
  title: string
  message?: string
  danger?: boolean
}

interface ConfirmData extends Confrim {
  resolve: (confirmed: boolean) => void
}

export const confrimData = ref<ConfirmData | null>()

function confirm(data: Confrim): Promise<boolean> {
  return new Promise((resolve) => {
    if (confrimData.value) {
      confrimData.value.resolve(false)
    }

    confrimData.value = {
      ...data,
      resolve(value) {
        confrimData.value = null
        resolve(value)
      },
    }
  })
}

export const useConfirm = () => confirm
