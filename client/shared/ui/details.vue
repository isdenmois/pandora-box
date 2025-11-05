<script setup lang="ts">
import { computed, ref } from 'vue'
import { formatDate, isMobile, isOmdb, isOmdbString, getExternalUrl, searchLink, useAuth } from '@/shared/lib'
import type { Movie, Series } from '../api'
import Icon from './icon.vue'
import { icons } from './icons'
import SeasonToggler from './season-toggler.vue'

interface Props {
  data: Movie | Series
}

const { data } = defineProps<Props>()

defineEmits(['updateSeason', 'removeView', 'seen', 'edit'])

const searchUrl = computed(() =>
  searchLink('season' in data && data.season ? `${data.title} ${data.season}` : data.title),
)

const { user } = useAuth()
const totalSeasons = computed(() => (isOmdb(data) && data.extra.totalSeasons ? +data.extra.totalSeasons : null))
const season = ref('season' in data ? data.season || 1 : 1)
const externalUrl = data.provider && data.extId ? getExternalUrl(data.provider, data.extId) : null
</script>

<template>
  <div class="home-details px-6 py-4 sm:p-8">
    <div v-if="data.poster" class="poster relative">
      <img class="object-cover h-44 w-30 sm:h-60 sm:w-40 rounded-lg" :src="data.poster" />

      <div v-if="data.rating" class="rating absolute top-0 left-0 p-1">{{ data.rating }}</div>
    </div>

    <div class="title flex gap-2">
      <div class="flex-1">
        <h1>
          <a class="not-link" :href="searchUrl" target="_blank">{{ data.title }}</a>
        </h1>

        <div v-if="data.genre" class="color-secondary text-s hidden sm:block">{{ data.genre }}</div>
      </div>

      <a v-if="externalUrl" class="mr-[-0.5rem] sm:mt-[-1rem] sm:mr-[-1rem]" target="_blank" :href="externalUrl">
        <Icon :size="isMobile ? 24 : 32" :icon="icons.globe" />
      </a>
    </div>

    <label v-if="'season' in data" class="season field">
      <div class="label">Season</div>
      <SeasonToggler v-model="season" :total="totalSeasons" @update:model-value="$emit('updateSeason', season)" />
    </label>

    <label v-if="data.seen" class="field">
      <div class="label">Seen</div>

      <div class="flex gap-4">
        <div>{{ formatDate(data.seen) }}: {{ data.seenRating }}/10</div>
      </div>
    </label>

    <label class="field">
      <div class="label">List</div>

      <button type="button" class="group primary mt-1 gap-3">
        <span :class="{ active: !data.private }">Global</span>
        <span :class="{ active: data.private }">For Me</span>
      </button>
    </label>

    <label v-if="data.reason" class="field">
      <div class="label">Reason</div>
      {{ data.reason }}
    </label>

    <label class="field">
      <div class="label">Who Added</div>

      {{ data.userId === user?.id ? 'Me' : 'Not me' }}
    </label>

    <label v-if="data.year" class="field">
      <div class="label">Year</div>

      {{ data.year }}
    </label>

    <template v-if="isOmdb(data)">
      <label v-if="isOmdbString(data.extra.Runtime)" class="field col-span-2">
        <div class="label">Runtime</div>

        {{ data.extra.Runtime }}
      </label>

      <label v-if="isOmdbString(data.extra.Actors)" class="field col-span-2">
        <div class="label">Actors</div>

        {{ data.extra.Actors }}
      </label>

      <label v-if="isOmdbString(data.extra.Director)" class="field col-span-2">
        <div class="label">Director</div>

        {{ data.extra.Director }}
      </label>
    </template>

    <div class="flex gap-4 col-span-2">
      <button class="primary flex-1" @click="$emit('edit')">Edit</button>
      <button v-if="!data.seen" class="primary flex-1" @click="$emit('seen')">Finished</button>
      <button v-else class="primary flex-1" @click="$emit('removeView')">Not Seen</button>
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
  grid-auto-flow: row dense;
  grid-template-areas:
    'poster title'
    'poster .'
    'poster .'
    'poster .'
    'poster .';
}

:global(#mobile .home-details) {
  grid-template-areas:
    'title title'
    'poster .'
    'poster .'
    'poster .';
}

.poster {
  grid-area: poster;
}

.title {
  grid-area: title;
}

.field {
  grid-column: span 2;
}

.field:nth-child(3),
.field:nth-child(4),
.field:nth-child(5) {
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
