<script lang="ts" setup>
import * as v from 'valibot'
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { flatten, useForm } from 'vue-standard-schema'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import { api } from '@/shared/api'
import { toNullable, toNumber } from '@/shared/lib'
import { Dialog, SeasonToggler, Spinner, MoreButton } from '@/shared/ui'

const router = useRouter()
const params = useRoute().params as { id: string }
const movies = useMovies()
const series = useSeries()

const isLoading = ref(true)
const error = ref(false)
const showMore = ref(false)

let extra: object = {}
let language: string | null = null
let genre: string | null = null
let totalSeasons: number | null = null

const fields = reactive({
  type: 'movie',
  title: '',
  rating: '',
  year: '',
  poster: '',
  season: 1,
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
    season: v.nullable(v.number()),
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
    fields.season = 1
    language = data.language || null
    genre = data.genre || null
    extra = data.extra ?? {}
    totalSeasons = 'totalSeasons' in extra ? +extra.totalSeasons : null
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
    <div v-else class="p-4">
      <form ref="form">
        <div class="flex gap-4">
          <img v-if="fields.poster" class="w-24 h-40 rounded-lg object-cover" :src="fields.poster" />

          <div class="flex flex-1 flex-col gap-4">
            <button type="button" class="group gap-3">
              <span :class="{ active: fields.type == 'movie' }" @click="fields.type = 'movie'">Movie</span>
              <span :class="{ active: fields.type == 'series' }" @click="fields.type = 'series'">Series</span>
            </button>

            <div>
              <label class="field">
                <div class="label">Title</div>
                <input type="text" name="title" placeholder="Title" v-model="fields.title" :disabled="submitting" />
              </label>
            </div>

            <div v-if="fields.type === 'series'">
              <label class="field">
                <div class="label">Season</div>
                <SeasonToggler v-model="fields.season" :total="totalSeasons" />
              </label>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <label class="field">
            <div class="label">Reason</div>
            <input type="text" name="why" placeholder="Reason" v-model="fields.reason" :disabled="submitting" />
          </label>
          <div v-for="error in errors?.nested?.reason" :key="error">{{ error }}</div>
        </div>

        <div class="mt-4" @click="fields.iAdded = !fields.iAdded">
          <div class="color-secondary text-s">Who Added</div>

          <button type="button" class="group primary mt-1 gap-3">
            <span :class="{ active: fields.iAdded }">Denis</span>
            <span :class="{ active: !fields.iAdded }">Daria</span>
          </button>
        </div>

        <div class="mt-4" @click="fields.forMe = !fields.forMe">
          <div class="color-secondary text-s">List</div>

          <button type="button" class="group primary mt-1 gap-3">
            <span :class="{ active: !fields.forMe }">Global</span>
            <span :class="{ active: fields.forMe }">For Me</span>
          </button>
        </div>

        <template v-if="showMore">
          <div class="mt-4">
            <label class="field">
              <div class="label">Rating</div>
              <input type="text" name="rating" placeholder="Rating" v-model="fields.rating" :disabled="submitting" />
            </label>
            <div v-for="error in errors?.nested?.rating" :key="error">{{ error }}</div>
          </div>

          <div class="mt-4">
            <label class="field">
              Year
              <input type="text" name="year" placeholder="Year" v-model="fields.year" :disabled="submitting" />
            </label>
            <div v-for="error in errors?.nested?.year" :key="error">{{ error }}</div>
          </div>

          <div class="mt-4 mb-4">
            <label class="field">
              Poster
              <input type="text" name="poster" placeholder="Poster" v-model="fields.poster" :disabled="submitting" />
            </label>
            <div v-for="error in errors?.nested?.poster" :key="error">{{ error }}</div>
          </div>
        </template>
        <div v-else>
          <MoreButton @click="showMore = true" />
        </div>

        <button type="button" class="primary w-full justify-center" :disabled="submitting" @click="submit">Add</button>
      </form>
    </div>
  </Dialog>
</template>
