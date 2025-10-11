<script setup lang="ts">
import * as v from 'valibot'
import { reactive } from 'vue'
import { flatten, useForm } from 'vue-standard-schema'
import { toNullable, toNumber } from '@/shared/lib'
import { useMovies } from '../model'

interface Props {
  id: string
}

const { id } = defineProps<Props>()
const emit = defineEmits(['submitted'])
const movies = useMovies()

const data = await movies.byId(id)
const fields = reactive({
  title: data.title,
  rating: String(data.rating),
  year: String(data.year),
  poster: data.poster,
  reason: data.reason,
  private: data.private,
})

const { form, submit, submitting, errors } = useForm({
  input: fields,
  schema: v.object({
    title: v.pipe(v.string(), v.trim(), v.minLength(1, 'Title is required')),
    rating: v.pipe(v.string(), v.trim(), v.transform(toNumber), v.nullable(v.number('Should be a valid number'))),
    year: v.pipe(v.string(), v.trim(), v.transform(toNumber), v.nullable(v.number('Should be a valid year'))),
    poster: v.nullable(v.pipe(v.string(), v.trim(), v.transform(toNullable))),
    reason: v.pipe(v.string(), v.trim()),
    private: v.pipe(v.boolean()),
  }),
  formatErrors: flatten,
  async submit(input) {
    await movies.update(id, input)

    emit('submitted')
  },
})
</script>

<template>
  <h1>{{ fields.title }}</h1>

  <form ref="form" @submit.prevent="submit">
    <div>
      <label>
        Title
        <input type="text" name="title" placeholder="Title" v-model="fields.title" :disabled="submitting" />
      </label>
    </div>

    <div>
      <label>
        Rating
        <input type="text" name="rating" placeholder="Rating" v-model="fields.rating" :disabled="submitting" />
      </label>
      <div v-for="error in errors?.nested?.rating" :key="error">{{ error }}</div>
    </div>

    <div>
      <label>
        Year
        <input type="text" name="year" placeholder="Year" v-model="fields.year" :disabled="submitting" />
      </label>
      <div v-for="error in errors?.nested?.year" :key="error">{{ error }}</div>
    </div>

    <div>
      <label>
        Poster
        <input type="text" name="poster" placeholder="Poster" v-model="fields.poster" :disabled="submitting" />
      </label>
      <div v-for="error in errors?.nested?.poster" :key="error">{{ error }}</div>
    </div>

    <div>
      <label>
        Why
        <input type="text" name="why" placeholder="Why" v-model="fields.reason" :disabled="submitting" />
      </label>
      <div v-for="error in errors?.nested?.reason" :key="error">{{ error }}</div>
    </div>

    <div>
      <label>
        For Me
        <input type="checkbox" v-model="fields.private" :disabled="submitting" />
      </label>
    </div>

    <button type="submit" :disabled="submitting">Save</button>
  </form>
</template>
