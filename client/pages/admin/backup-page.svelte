<script lang="ts">
  import { api } from '@/shared/api'
  import { downloadBlob, preventDefault } from '@/shared/lib'

  let files: FileList | null = $state(null)
  let error = $state('')
  let success = $state(false)

  const createBackup = async () => {
    const data = await api.admin.backup()

    downloadBlob(data, 'box-backup.json')
  }

  const restore = async () => {
    success = false
    error = ''

    if (!files || !files.length) {
      error = 'File is not selected'
      return
    }

    const file = files.item(0)

    const text = await file?.text()
    let data

    try {
      data = JSON.parse(text ?? '')
    } catch {
      error = 'File is not json'
      return
    }

    if (!data || typeof data !== 'object') {
      error = 'Invalid backup format'
      return
    }

    for (const key in data) {
      if (!Array.isArray(data[key])) {
        error = 'Invalid format in backup'
        return
      }
    }

    await api.admin.backupRestore(data)

    success = true
  }
</script>

<h1>Backup</h1>

<button class="mt-8" onclick={createBackup}>Create Backup</button>

<form class="mt-8" onsubmit={preventDefault(restore)}>
  <label class="block">
    File
    <input type="file" accept="application/json" name="backup" bind:files />
  </label>

  {#if error}
    <div class="mt-4">{error}</div>
  {/if}

  {#if success}
    <div class="mt-4">Backup successfully restored</div>
  {/if}

  <button class="mt-4">Restore backup</button>
</form>
