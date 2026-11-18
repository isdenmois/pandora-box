<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { api } from '@/shared/api'
import { formatDate, getMessage } from '@/shared/lib'

const keys = ref<string[]>([])
const retention = ref(0)
const available = ref(true)
const loading = ref(true)
const uploading = ref(false)
const error = ref('')
const saved = ref('')

const lastLabel = computed(() => {
  const key = keys.value[0]

  return key ? formatDate(`${key}T00:00:00Z`) : ''
})

const isUnconfigured = (failure: unknown) => (failure as { status?: number } | null)?.status === 503

const load = async () => {
  error.value = ''

  try {
    const status = await api.admin.offsiteStatus()

    keys.value = status.keys
    retention.value = status.retention
    available.value = true
  } catch (failure) {
    // Missing server credentials is not something the admin can retry around; say so instead.
    if (isUnconfigured(failure)) {
      available.value = false

      return
    }

    error.value = getMessage(failure)
  } finally {
    loading.value = false
  }
}

const upload = async () => {
  uploading.value = true
  error.value = ''
  saved.value = ''

  try {
    const result = await api.admin.offsiteUpload()

    saved.value = `${formatDate(`${result.key}T00:00:00Z`)} saved, ${Math.ceil(result.bytes / 1024)} KB`

    await load()
  } catch (failure) {
    error.value = getMessage(failure)
  } finally {
    uploading.value = false
  }
}

onMounted(load)
</script>

<template>
  <section class="mt-8">
    <h2>Offsite</h2>

    <template v-if="available">
      <p v-if="loading" class="mt-4">Checking…</p>
      <template v-else>
        <p class="mt-4">
          {{ lastLabel ? `Last copy: ${lastLabel}` : 'No copy uploaded yet' }}
        </p>
        <p v-if="keys.length">{{ keys.length }} of {{ retention }} days kept</p>
        <button type="button" class="mt-4" :disabled="uploading" @click="upload">
          {{ uploading ? 'Uploading…' : 'Upload now' }}
        </button>
      </template>
    </template>

    <p v-else class="mt-4">Not configured: set FIREBASE_DB_URL, FIREBASE_SERVICE_ACCOUNT_B64 and BACKUP_TOKEN.</p>

    <p v-if="saved" class="mt-4">{{ saved }}</p>
    <p v-if="error" class="mt-4" style="color: red">{{ error }}</p>
  </section>
</template>
