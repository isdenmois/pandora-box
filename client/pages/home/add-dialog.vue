<script lang="ts" setup>
import * as v from 'valibot'
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { flatten, useForm } from 'vue-standard-schema'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import { api } from '@/shared/api'
import { toNullable, toNumber } from '@/shared/lib'
import { Dialog, Spinner } from '@/shared/ui'

const router = useRouter()
const params = useRoute().params as { id: string }
const movies = useMovies()
const series = useSeries()

const isLoading = ref(true)
const error = ref(false)

let extra: object = {}
let language: string | null = null
let genre: string | null = null

const fields = reactive({
  type: 'movie',
  title: '',
  rating: '',
  year: '',
  poster: '',
  season: '1',
  reason: '',
  iAdded: false,
  forMe: false,
})

const { form, submit, submitting, errors } = useForm({
  input: fields,
  schema: v.object({
    type: v.pipe(v.union([v.literal('movie'), v.literal('series')])),
    title: v.pipe(v.string(), v.trim(), v.minLength(1, 'Title is required')),
    rating: v.pipe(v.string(), v.trim(), v.transform(toNumber), v.nullable(v.number('Should be a valid number'))),
    year: v.pipe(v.string(), v.trim(), v.transform(toNumber), v.nullable(v.number('Should be a valid year'))),
    poster: v.nullable(v.pipe(v.string(), v.trim(), v.transform(toNullable))),
    season: v.pipe(v.string(), v.trim(), v.transform(toNumber), v.nullable(v.number())),
    reason: v.pipe(v.string(), v.trim()),
    iAdded: v.boolean(),
    forMe: v.boolean(),
  }),
  formatErrors: flatten,
  async submit({ type, season, iAdded, forMe, ...input }) {
    const data = {
      ...input,
      extId: params.id,
      provider: 'omdb',
      language,
      genre,
      extra,
      userId: iAdded ? 'me' : null,
      private: forMe,
    }
    if (type === 'series') {
      await series.create({ ...data, season })
    } else if (type === 'movie') {
      await movies.create(data)
    }

    router.replace('/')
  },
})

onMounted(async () => {
  try {
    const data = await api.search.byId(params.id)

    fields.type = data.type
    fields.title = data.title
    fields.rating = data.rating ? String(data.rating) : ''
    fields.year = data.year ? String(data.year) : ''
    fields.poster = data.poster ?? ''
    fields.season = '1'
    language = data.language || null
    genre = data.genre || null
    extra = data.extra ?? {}
  } catch {
    error.value = true
  } finally {
    isLoading.value = false
  }
})
</script>

<template>
  <Dialog id="add">
    <div v-if="isLoading">
      <Spinner :size="24" />
    </div>
    <div v-else-if="error">error!</div>
    <div v-else>
      <h1>Add "{{ fields.title }}"</h1>

      <form ref="form" @submit.prevent="submit">
        <div>
          <label>
            Type
            <select v-model="fields.type" :disabled="submitting">
              <option value="movie">Movie</option>
              <option value="series">Series</option>
            </select>
          </label>
        </div>

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

        <div v-if="fields.type === 'series'">
          <label>
            Season
            <input type="text" name="season" placeholder="Season" v-model="fields.season" :disabled="submitting" />
          </label>

          <div v-for="error in errors?.nested?.season" :key="error">{{ error }}</div>
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
            I Added
            <input type="checkbox" v-model="fields.iAdded" :disabled="submitting" />
          </label>
        </div>

        <div>
          <label>
            For Me
            <input type="checkbox" v-model="fields.forMe" :disabled="submitting" />
          </label>
        </div>

        <button type="submit" :disabled="submitting">Add</button>
      </form>
    </div>
  </Dialog>
</template>
