<script setup lang="ts">
import * as v from 'valibot'
import { reactive } from 'vue'
import { flatten, useForm } from 'vue-standard-schema'
import type { Movie, Series } from '../api'
import { useConfirm } from './confirm'
import ScheduleToggler from './schedule-toggler.vue'
import SeasonToggler from './season-toggler.vue'

interface Props {
  data: Movie | Series
}

const { data } = defineProps<Props>()
const emit = defineEmits(['save', 'delete'])
const confirm = useConfirm()
const isSeries = 'season' in data

const fields = reactive({
  title: data.title,
  season: 'season' in data ? data.season || 0 : 0,
  reason: data.reason,
  private: data.private,
  scheduled: data.scheduled,
})

const { form, submit, submitting, errors } = useForm({
  input: fields,
  schema: v.object({
    title: v.pipe(v.string(), v.trim(), v.minLength(1, 'Title is required')),
    season: v.number(),
    reason: v.pipe(v.string(), v.trim()),
    private: v.pipe(v.boolean()),
    scheduled: v.nullable(v.number()),
  }),
  formatErrors: flatten,
  async submit(input) {
    emit('save', input)
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
</script>

<template>
  <form class="edit-details" ref="form">
    <div v-if="data.poster" class="poster relative">
      <img class="object-cover h-44 w-30 sm:h-60 sm:w-40 rounded-lg" :src="data.poster" />
    </div>

    <label class="field title">
      <div class="label">Title</div>
      <input type="text" name="title" placeholder="Title" v-model="fields.title" :disabled="submitting" />

      <div v-for="error in errors?.nested?.title" :key="error">{{ error }}</div>
    </label>

    <label v-if="'season' in data" class="season field">
      <div class="label">Season</div>
      <SeasonToggler v-model="fields.season" />
    </label>

    <label class="field">
      <div class="label">Reason</div>
      <input type="text" name="reason" placeholder="Reason" v-model="fields.reason" :disabled="submitting" />

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
