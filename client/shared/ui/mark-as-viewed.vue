<script lang="ts">
import * as v from 'valibot'
import { reactive } from 'vue'
import { flatten, useForm } from 'vue-standard-schema'
import type { Series, Movie } from '../api'
import RatingInput from './rating-input.vue'

interface Props {
  data: Movie | Series
}

export interface SeenData {
  date: string
  rating: number
}
</script>

<script setup lang="ts">
const { data } = defineProps<Props>()
const emit = defineEmits(['save'])

const now = new Date()
const today = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`

const fields = reactive({
  date: data.seen || today,
  rating: data.seenRating || 0,
})

const { form, submit, submitting, errors } = useForm({
  input: fields,
  schema: v.object({
    date: v.pipe(v.string(), v.trim(), v.minLength(5, 'Date is required')),
    rating: v.pipe(v.number('Fill please')),
  }),
  formatErrors: flatten,
  async submit({ date, rating }) {
    emit('save', { date, rating })
  },
})
</script>

<template>
  <form ref="form" @submit.prevent="submit">
    <h3 class="text-l">{{ data.title }}</h3>

    <div class="flex mt-2 gap-4">
      <img v-if="data.poster" class="h-40 rounded-lg" :src="data.poster" />

      <div class="flex flex-col mt-2 gap-4">
        <label class="field">
          <div class="label">Rating {{ fields.rating }}/10</div>

          <RatingInput v-model="fields.rating" />
          <div v-for="error in errors?.nested?.rating" :key="error">{{ error }}</div>
        </label>

        <label class="field">
          <div class="label">Date</div>
          <input type="date" name="date" v-model="fields.date" :disabled="submitting" />
        </label>
        <div v-for="error in errors?.nested?.date" :key="error">{{ error }}</div>
      </div>
    </div>

    <button type="submit" class="primary w-full mt-4">Save</button>
  </form>
</template>
