<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import { api } from '@/shared/api'
import { Dialog, Spinner } from '@/shared/ui'

const router = useRouter()
const params = useRoute().params as { id: string }
const movies = useMovies()
const series = useSeries()

const isLoading = ref(true)
const isCreating = ref(false)
const error = ref(false)
const title = ref('')
const rating = ref('')
const year = ref('')
const poster = ref('')
const type = ref<'movie' | 'series'>('movie')
const season = ref('1')
let language: string | null = null
let genre: string | null = null
const forMe = ref(false)
const iAdded = ref(false)
const reason = ref('')

let extra: object = {}

const isValid = computed(() => !!title.value)

onMounted(async () => {
  try {
    const data = await api.search.byId(params.id)

    type.value = data.type
    title.value = data.title
    rating.value = data.rating ? String(data.rating) : ''
    year.value = data.year ? String(data.year) : ''
    poster.value = data.poster ?? ''
    language = data.language || null
    genre = data.genre || null
    extra = data.extra ?? {}
  } catch {
    error.value = true
  } finally {
    isLoading.value = false
  }
})

const addSeries = async () =>
  await series.create({
    extId: params.id,
    provider: 'omdb',
    title: title.value.trim(),
    rating: parseFloat(rating.value) || null,
    year: parseInt(year.value) || null,
    poster: poster.value.trim(),
    season: 1,
    language,
    genre,
    reason: reason.value,
    userId: iAdded.value ? 'me' : null,
    private: forMe.value,
    extra,
  })

const addMovie = async () =>
  movies.create({
    extId: params.id,
    provider: 'omdb',
    title: title.value.trim(),
    rating: parseFloat(rating.value) || null,
    year: parseInt(year.value) || null,
    poster: poster.value.trim(),
    language,
    genre,
    reason: reason.value,
    userId: iAdded.value ? 'me' : null,
    private: forMe.value,
    extra,
  })

const add = async () => {
  if (!isValid.value) return

  isCreating.value = true

  try {
    if (type.value === 'series') {
      await addSeries()
    } else if (type.value === 'movie') {
      await addMovie()
    }

    router.replace('/')
  } finally {
    isCreating.value = false
  }
}
</script>

<template>
  <Dialog id="add">
    <div v-if="isLoading">
      <Spinner :size="24" />
    </div>
    <div v-else-if="error">error!</div>
    <div v-else>
      <h1>Add "{{ title }}"</h1>

      <form @submit.prevent="add">
        <div>
          <label>
            Type
            <select v-model="type" :disabled="isCreating">
              <option value="movie">Movie</option>
              <option value="series">Series</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Title
            <input type="text" name="title" placeholder="Title" v-model="title" :disabled="isCreating" />
          </label>
        </div>

        <div>
          <label>
            Rating
            <input type="text" name="rating" placeholder="Rating" v-model="rating" :disabled="isCreating" />
          </label>
        </div>

        <div>
          <label>
            Year
            <input type="text" name="year" placeholder="Year" v-model="year" :disabled="isCreating" />
          </label>
        </div>

        <div>
          <label>
            Poster
            <input type="text" name="poster" placeholder="Poster" v-model="poster" :disabled="isCreating" />
          </label>
        </div>

        <div v-if="type === 'series'">
          <label>
            Season
            <input type="text" name="season" placeholder="Season" v-model="season" :disabled="isCreating" />
          </label>
        </div>

        <div>
          <label>
            Why
            <input type="text" name="why" placeholder="Why" v-model="reason" :disabled="isCreating" />
          </label>
        </div>

        <div>
          <label>
            I Added
            <input type="checkbox" v-model="iAdded" :disabled="isCreating" />
          </label>
        </div>

        <div>
          <label>
            For Me
            <input type="checkbox" v-model="forMe" :disabled="isCreating" />
          </label>
        </div>

        <button type="submit" :disabled="!isValid || isCreating">Add</button>
      </form>
    </div>
  </Dialog>
</template>
