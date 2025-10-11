<script setup lang="ts">
import * as v from 'valibot'
import { computed, onMounted, reactive, ref } from 'vue'
import { flatten, useForm } from 'vue-standard-schema'
import { api, type ImportStatus } from '@/shared/api'
import { sleep } from '@/shared/lib'

const fields = reactive({
  json: '',
})

const status = ref<ImportStatus | null>(null)

const poll = async () => {
  do {
    status.value = await api.admin.importStatus()
    await sleep(1)
  } while (status.value?.inProgress)
}

onMounted(poll)

const { submit, submitting, errors } = useForm({
  input: fields,
  schema: v.object({
    json: v.pipe(v.string(), v.parseJson()),
  }),
  formatErrors: flatten,
  async submit({ json }) {
    if (status.value?.inProgress) {
      return
    }

    api.admin.import(json)

    poll()
  },
})

const disabled = computed(() => !!status.value?.inProgress || submitting.value)
</script>

<template>
  <form @submit.prevent="submit">
    <h3>Import data</h3>

    <div>
      <textarea class="w-full min-h-[50vh]" name="json" :disabled="disabled" v-model="fields.json" />
    </div>

    <div v-for="error in errors?.nested?.json" :key="error">{{ error }}</div>

    <div class="mt-4" v-if="status?.inProgress">
      <h5>Importing</h5>

      <p class="mt-4">Movies: {{ status.movies.finished }} / {{ status.movies.total }}</p>
      <progress v-if="status.movies.total" :value="status.movies.finished / status.movies.total" />

      <p class="mt-4">Series: {{ status.series.finished }} / {{ status.series.total }}</p>
      <progress v-if="status.series.total" :value="status.series.finished / status.series.total" />
    </div>

    <button class="mt-4" :disabled="disabled" type="submit">Import</button>
  </form>
</template>
