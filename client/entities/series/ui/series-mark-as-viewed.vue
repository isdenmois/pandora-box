<script setup lang="ts">
import * as v from 'valibot'
import { reactive } from 'vue'
import { flatten, useForm } from 'vue-standard-schema'
import { useSeries } from '../model'

interface Props {
  id: string
}

const { id } = defineProps<Props>()
const emit = defineEmits(['submitted'])

const series = useSeries()
const data = await series.byId(id)
const now = new Date()
const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`

const fields = reactive({
  date: data.seen || today,
  rating: data.seenRating || '',
})

const { form, submit, submitting, errors } = useForm({
  input: fields,
  schema: v.object({
    date: v.pipe(v.string(), v.trim(), v.minLength(5, 'Date is required')),
    rating: v.pipe(v.number('Fill please')),
  }),
  formatErrors: flatten,
  async submit({ date, rating }) {
    await series.markAsViewed(id, date, rating)

    emit('submitted')
  },
})
</script>

<template>
  <h1>{{ data.title }}</h1>

  <img v-if="data.poster" class="h-40" :src="data.poster" />

  <form ref="form" @submit.prevent="submit">
    <div>
      <label>
        Date
        <input type="date" name="date" v-model="fields.date" :disabled="submitting" />
      </label>
      <div v-for="error in errors?.nested?.date" :key="error">{{ error }}</div>
    </div>

    <div>
      <label>
        Rating
        <input type="number" name="rating" v-model="fields.rating" :disabled="submitting" />
      </label>
      <div v-for="error in errors?.nested?.rating" :key="error">{{ error }}</div>
    </div>

    <button type="submit" :disabled="submitting">Save</button>
  </form>
</template>
