<script setup lang="ts">
import * as v from 'valibot'
import { reactive } from 'vue'
import { useRouter } from 'vue-router'
import { flatten, useForm } from 'vue-standard-schema'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import { toNullable, toNumber, useAuth } from '@/shared/lib'
import { Dialog, SeasonToggler, ScheduleToggler } from '@/shared/ui'

const router = useRouter()
const movies = useMovies()
const series = useSeries()
const auth = useAuth()

const fields = reactive({
  type: 'movie',
  title: '',
  rating: '',
  year: '',
  poster: '',
  season: 1,
  reason: '',
  iAdded: true,
  forMe: false,
  scheduled: null,
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
    scheduled: v.nullable(v.number()),
  }),
  formatErrors: flatten,
  async submit({ type, season, iAdded, forMe, ...input }) {
    const data = {
      ...input,
      extId: null,
      provider: 'manual',
      language: null,
      genre: null,
      extra: {},
      userId: iAdded ? auth.user?.id || null : null,
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
</script>

<template>
  <Dialog id="add">
    <div class="p-4">
      <h2>Manual add</h2>

      <form class="mt-2" ref="form">
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
                <SeasonToggler v-model="fields.season" />
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

        <div class="mt-4">
          <label class="field">
            <div class="label">Scheduled</div>

            <ScheduleToggler v-model="fields.scheduled" />
          </label>
        </div>

        <div class="mt-4" @click="fields.iAdded = !fields.iAdded">
          <div class="color-secondary text-s">Who Added</div>

          <button type="button" class="group primary mt-1 gap-3">
            <span :class="{ active: fields.iAdded }">Me</span>
            <span :class="{ active: !fields.iAdded }">Not Me</span>
          </button>
        </div>

        <div class="mt-4" @click="fields.forMe = !fields.forMe">
          <div class="color-secondary text-s">List</div>

          <button type="button" class="group primary mt-1 gap-3">
            <span :class="{ active: !fields.forMe }">Global</span>
            <span :class="{ active: fields.forMe }">For Me</span>
          </button>
        </div>

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

        <button type="button" class="primary w-full justify-center" :disabled="submitting" @click="submit">Add</button>
      </form>
    </div>
  </Dialog>
</template>
