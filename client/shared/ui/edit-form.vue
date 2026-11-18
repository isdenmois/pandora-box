<script setup lang="ts">
import * as v from 'valibot'
import { onBeforeUnmount, reactive, ref, shallowRef } from 'vue'
import { flatten, useForm } from 'vue-standard-schema'
import type { Movie, Series } from '../api'
import { POSTER_ACCEPT, posterFileError } from '../lib'
import { useConfirm } from './confirm'
import ImageWithFallback from './image-with-fallback.vue'
import ScheduleToggler from './schedule-toggler.vue'
import SeasonToggler from './season-toggler.vue'
import TagsInput from './tags-input.vue'

interface Props {
  data: Movie | Series
  tags: string[]
  /** Bumped by the parent after a re-download, so the image remounts instead of reusing its cache. */
  posterKey?: number
  redownloading?: boolean
}

const { data } = defineProps<Props>()
const emit = defineEmits(['save', 'delete', 'redownload'])
const confirm = useConfirm()
const isSeries = 'season' in data

const mode = ref<'url' | 'file'>('url')
const file = shallowRef<File | null>(null)
const fileError = ref<string | null>(null)
const preview = ref<string | null>(data.poster)
const fileInput = ref<HTMLInputElement | null>(null)

// The picked file has no server path yet, so the preview is a blob URL that must be released.
let objectUrl: string | null = null

const releasePreview = () => {
  if (objectUrl) {
    URL.revokeObjectURL(objectUrl)
    objectUrl = null
  }
}

const onFileChange = (event: Event) => {
  const input = event.target as HTMLInputElement
  const selected = input.files?.[0]

  if (!selected) {
    return
  }

  const error = posterFileError(selected)

  if (error) {
    fileError.value = error
    input.value = ''

    return
  }

  fileError.value = null
  releasePreview()
  objectUrl = URL.createObjectURL(selected)
  file.value = selected
  preview.value = objectUrl
  mode.value = 'file'
}

/** Drops the picked file and goes back to the URL tab; the stored poster is untouched. */
const useUrl = () => {
  releasePreview()
  file.value = null
  fileError.value = null
  preview.value = data.poster
  mode.value = 'url'

  // The input keeps its own selection, which would otherwise reappear on the next switch.
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

onBeforeUnmount(releasePreview)

const fields = reactive({
  title: data.title,
  season: 'season' in data ? data.season || 0 : 0,
  reason: data.reason,
  private: data.private,
  scheduled: data.scheduled,
  tags: data.tags || [],
  poster: data.posterSource ?? '',
})

const isValidPoster = (value: string) => {
  // A picked file wins, so whatever the URL field holds does not matter.
  if (file.value) {
    return true
  }

  // An emptied field cannot clear a poster (replace-only), but it is fine when there is none.
  if (!value) {
    return !data.posterSource
  }

  return /^https?:\/\//i.test(value)
}

const { form, submit, submitting, errors } = useForm({
  input: fields,
  schema: v.object({
    title: v.pipe(v.string(), v.trim(), v.minLength(1, 'Title is required')),
    season: v.number(),
    reason: v.nullable(v.pipe(v.string(), v.trim())),
    private: v.pipe(v.boolean()),
    scheduled: v.nullable(v.number()),
    tags: v.nullable(v.array(v.string())),
    poster: v.pipe(v.string(), v.trim(), v.check(isValidPoster, 'Enter an http(s) URL or pick a file')),
  }),
  formatErrors: flatten,
  async submit(input) {
    const { poster, ...rest } = input

    // The server maps `poster` to a source URL; a file is a separate part and must not be mixed in.
    emit('save', file.value || !poster ? rest : { ...rest, poster }, file.value)
  },
})

const toDelete = async () => {
  const confirmed = await confirm({
    title: `Delete ${isSeries ? 'series' : 'movie'}`,
    message: `Do you want to delete "${data.title}"?`,
    danger: true,
  })

  if (confirmed) {
    emit('delete')
  }
}

const toRedownload = async () => {
  const confirmed = await confirm({
    title: 'Re-download poster',
    message: 'Drop the stored poster? It downloads again from the source the next time it is shown.',
  })

  if (confirmed) {
    emit('redownload')
  }
}
</script>

<template>
  <form class="edit-details" ref="form">
    <div class="poster">
      <ImageWithFallback
        v-if="preview"
        :key="posterKey"
        class="object-cover h-44 w-30 sm:h-60 sm:w-40 rounded-lg"
        :src="preview"
      />

      <div class="field poster-field">
        <div class="label">Poster</div>

        <div class="tabs">
          <button
            type="button"
            class="flat"
            :class="{ active: mode === 'url' }"
            :disabled="submitting || !!file"
            @click="mode = 'url'"
          >
            URL
          </button>
          <button
            type="button"
            class="flat"
            :class="{ active: mode === 'file' }"
            :disabled="submitting"
            @click="mode = 'file'"
          >
            Upload
          </button>
        </div>

        <input
          v-if="mode === 'url'"
          type="text"
          name="poster"
          placeholder="Poster URL"
          v-model="fields.poster"
          :disabled="submitting"
        >

        <template v-else>
          <input
            ref="fileInput"
            type="file"
            name="posterFile"
            aria-label="Poster file"
            :accept="POSTER_ACCEPT"
            :disabled="submitting"
            @change="onFileChange"
          >

          <button v-if="file" type="button" class="flat" :disabled="submitting" @click="useUrl">Use URL instead</button>
        </template>

        <div v-for="error in errors?.nested?.poster" :key="error">{{ error }}</div>
        <div v-if="fileError">{{ fileError }}</div>
      </div>
    </div>

    <label class="field title">
      <div class="label">Title</div>
      <input type="text" name="title" placeholder="Title" v-model="fields.title" :disabled="submitting">

      <div v-for="error in errors?.nested?.title" :key="error">{{ error }}</div>
    </label>

    <label v-if="'season' in data" class="season field">
      <div class="label">Season</div>
      <SeasonToggler v-model="fields.season" />
    </label>

    <label class="field">
      <div class="label">Reason</div>
      <input type="text" name="reason" placeholder="Reason" v-model="fields.reason" :disabled="submitting">

      <div v-for="error in errors?.nested?.reason" :key="error">{{ error }}</div>
    </label>

    <label class="field list" @click="fields.private = !fields.private">
      <div class="label">List</div>

      <button type="button" class="group primary mt-1 gap-3">
        <span :class="{ active: !fields.private }">Global</span>
        <span :class="{ active: fields.private }">For Me</span>
      </button>
    </label>

    <label class="field">
      <div class="label">Scheduled</div>

      <ScheduleToggler v-model="fields.scheduled" />
    </label>

    <div class="field">
      <label>Tags</label>

      <TagsInput :tags="tags" v-model="fields.tags" />
    </div>

    <button
      v-if="data.posterSource"
      type="button"
      class="flat"
      :disabled="submitting || redownloading"
      @click="toRedownload"
    >
      {{ redownloading ? 'Removing stored poster…' : 'Re-download poster' }}
    </button>

    <button type="button" class="flat danger" :disabled="submitting" @click="toDelete">Remove</button>

    <button type="button" class="primary" :disabled="submitting" @click="submit">Save</button>
  </form>
</template>

<style scoped>
.edit-details {
  display: grid;
  row-gap: 12px;
  column-gap: 20px;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto;
  grid-auto-flow: row dense;
  grid-template-areas:
    'poster .'
    'poster .'
    'poster .'
    'poster .';
}

:global(#mobile form.edit-details) {
  grid-template-areas:
    'poster .'
    'poster .'
    'poster .';
}

.poster {
  grid-area: poster;
}

.poster-field {
  margin-top: 8px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 4px;
}

.tabs .active {
  background-color: var(--surface2);
  border-radius: 8px;
}

button,
.field {
  grid-column: span 2;
}

.title,
.season,
.list {
  grid-column: span 1;
}

.rating {
  background-color: var(--warning2);
  color: var(--warning);
  min-width: 32px;
  text-align: center;
  border-top-left-radius: 8px;
  border-top-right-radius: 2px;
  border-bottom-left-radius: 2px;
  border-bottom-right-radius: 4px;
  font-weight: bold;
}
</style>
