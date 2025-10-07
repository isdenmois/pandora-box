<script setup lang="ts">
import { ref } from 'vue'
import { api } from '@/shared/api'
import { downloadBlob } from '@/shared/lib'

const files = ref<FileList | null>(null)
const error = ref('')
const success = ref(false)

const createBackup = async () => {
  const data = await api.admin.backup()
  const now = new Date().toISOString().replace(/[:.]/g, '-')

  downloadBlob(data, `box-backup-${now}.json`)
}

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files) {
    files.value = target.files
  }
}

const restore = async () => {
  success.value = false
  error.value = ''

  if (!files.value || !files.value.length) {
    error.value = 'File is not selected'
    return
  }

  const file = files.value.item(0)

  const text = await file?.text()
  let data

  try {
    data = JSON.parse(text ?? '')
  } catch {
    error.value = 'File is not json'
    return
  }

  if (!data || typeof data !== 'object') {
    error.value = 'Invalid backup format'
    return
  }

  for (const key in data) {
    if (!Array.isArray(data[key])) {
      error.value = 'Invalid format in backup'
      return
    }
  }

  await api.admin.backupRestore(data)
  success.value = true
}
</script>

<template>
  <h1>Backup</h1>

  <button class="mt-8" @click="createBackup">Create Backup</button>

  <form class="mt-8" @submit.prevent="restore">
    <label class="block">
      File
      <input type="file" accept="application/json" @change="handleFileChange" />
    </label>

    <div v-if="error" class="mt-4">{{ error }}</div>
    <div v-if="success" class="mt-4">Backup successfully restored</div>
    <button class="mt-4">Restore backup</button>
  </form>
</template>
