<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatDate, searchLink } from '@/shared/lib'
import type { Movie, Series } from '../api'
import SeasonToggler from './season-toggler.vue'

interface Props {
  data: Movie | Series
}

const { data } = defineProps<Props>()

defineEmits(['updateSeason', 'togglePrivate', 'removeView', 'seen', 'edit'])

const searchUrl = computed(() =>
  searchLink('season' in data && data.season ? `${data.title} ${data.season}` : data.title),
)

const totalSeasons = computed(() => ('totalSeasons' in data.extra ? +(data.extra.totalSeasons as number) : null))
const season = ref('season' in data ? data.season || 1 : 1)
</script>

<template>
  <div class="home-details p-6 sm:p-8">
    <div v-if="data.poster" class="poster relative">
      <img class="h-40 sm:h-60 sm:w-40 rounded-lg" :src="data.poster" />

      <div v-if="data.rating" class="rating absolute top-0 left-0 p-1">{{ data.rating }}</div>
    </div>

    <div class="title">
      <h1>
        <a class="not-link" :href="searchUrl" target="_blank">{{ data.title }}</a>
      </h1>

      <div v-if="data.genre" class="color-secondary text-s hidden sm:block">{{ data.genre }}</div>
    </div>

    <label v-if="'season' in data" class="season field">
      <div class="label">Season</div>
      <SeasonToggler v-model="season" :total="totalSeasons" @update:model-value="$emit('updateSeason', season)" />
    </label>

    <label v-if="data.reason" class="reason field">
      <div class="label">Reason</div>
      {{ data.reason }}
    </label>

    <label v-if="data.seen" class="seen field">
      <div class="label">Seen</div>

      <div class="flex gap-4">
        <div>{{ formatDate(data.seen) }}: {{ data.seenRating }}/10</div>
      </div>
    </label>

    <div class="other flex flex-col gap-4">
      <label class="field" @click="$emit('togglePrivate')">
        <div class="label">List</div>

        <button type="button" class="group primary mt-1 gap-3">
          <span :class="{ active: !data.private }">Global</span>
          <span :class="{ active: data.private }">For Me</span>
        </button>
      </label>

      <label class="field">
        <div class="label">Who Added</div>

        {{ data.userId === 'me' ? 'Me' : 'Not me' }}
      </label>

      <div class="flex gap-4">
        <button class="primary flex-1" @click="$emit('edit')">Edit</button>
        <button v-if="!data.seen" class="primary flex-1" @click="$emit('seen')">Finished</button>
        <button v-else class="primary flex-1" @click="$emit('removeView')">Not Seen</button>
      </div>
    </div>
  </div>
</template>
<style scoped>
.home-details {
  display: grid;
  row-gap: 12px;
  column-gap: 20px;
  grid-template-columns: auto 1fr;
  grid-template-rows: auto;
  grid-template-areas:
    'poster title'
    'poster season'
    'poster reason'
    'poster seen'
    'other other';
}

:global(#mobile .home-details) {
  grid-template-areas:
    'poster title'
    'poster season'
    'poster reason'
    'seen seen'
    'other other';
}

.poster {
  grid-area: poster;
}

.season {
  grid-area: season;
}

.title {
  grid-area: title;
}

.reason {
  grid-area: reason;
}

.seen {
  grid-area: seen;
}

.other {
  grid-area: other;
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
