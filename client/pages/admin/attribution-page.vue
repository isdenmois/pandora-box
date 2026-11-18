<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import { type AttributionData, api } from '@/shared/api'
import { getMessage, useUsers } from '@/shared/lib'
import { useConfirm } from '@/shared/ui'

interface Row {
  type: 'movie' | 'series'
  id: string
  title: string
  createdBy: string
  recommendedBy: string | null
}

const confirm = useConfirm()
const users = useUsers()
const movies = useMovies()
const series = useSeries()

const data = ref<AttributionData>({ movies: [], series: [] })
const selected = ref<string[]>([])
const drafts = ref<Record<string, string>>({})
const search = ref('')
const creatorFilter = ref<string | null>(null)
const target = ref<string | null>(null)
const busy = ref(false)
const message = ref('')

const rows = computed<Row[]>(() => [
  ...data.value.movies.map((movie) => ({
    type: 'movie' as const,
    id: movie.id,
    title: movie.title,
    createdBy: movie.createdBy,
    recommendedBy: movie.recommendedBy,
  })),
  ...data.value.series.map((show) => ({
    type: 'series' as const,
    id: show.id,
    title: show.title,
    createdBy: show.createdBy,
    recommendedBy: show.recommendedBy,
  })),
])

const filtered = computed(() => {
  const query = search.value.trim().toLowerCase()

  return rows.value.filter((row) => {
    return (
      (!query || row.title.toLowerCase().includes(query)) &&
      (!creatorFilter.value || row.createdBy === creatorFilter.value)
    )
  })
})

const keyFor = (row: Row) => `${row.type}:${row.id}`

const allSelected = computed(
  () => filtered.value.length > 0 && filtered.value.every((row) => selected.value.includes(keyFor(row))),
)

const creatorName = (id: string) => users.nameFor(id) ?? 'Unknown'
const recommenderName = (id: string | null) => users.nameFor(id) ?? ''

const load = async () => {
  try {
    data.value = await api.admin.attribution()
    drafts.value = {}
  } catch (error) {
    message.value = getMessage(error)
  }
}

const apply = async (body: { movies?: string[]; series?: string[]; createdBy: string }) => {
  busy.value = true
  message.value = ''

  try {
    const result = await api.admin.reassignAttribution(body)
    message.value = `Reassigned ${result.updated} record(s)`

    await load()
    await Promise.all([movies.refresh(), series.refresh()])

    return true
  } catch (error) {
    message.value = getMessage(error)

    return false
  } finally {
    busy.value = false
  }
}

const toggleSelected = (row: Row) => {
  const key = keyFor(row)

  selected.value = selected.value.includes(key)
    ? selected.value.filter((item) => item !== key)
    : [...selected.value, key]
}

const toggleAll = () => {
  if (allSelected.value) {
    selected.value = selected.value.filter((key) => !filtered.value.some((row) => keyFor(row) === key))
  } else {
    selected.value = [...new Set([...selected.value, ...filtered.value.map(keyFor)])]
  }
}

const stageOne = (row: Row, event: Event) => {
  drafts.value = { ...drafts.value, [keyFor(row)]: (event.target as HTMLSelectElement).value }
}

const reassignOne = async (row: Row, createdBy: string) => {
  if (!createdBy || createdBy === row.createdBy) {
    return
  }

  await apply({
    movies: row.type === 'movie' ? [row.id] : [],
    series: row.type === 'series' ? [row.id] : [],
    createdBy,
  })
}

const reassignSelected = async () => {
  if (!target.value || !selected.value.length || busy.value) {
    return
  }

  const confirmed = await confirm({
    title: 'Reassign attribution',
    message: `Move ${selected.value.length} record(s) to ${creatorName(target.value)}?`,
  })

  if (!confirmed) {
    return
  }

  const movieIds = selected.value.filter((key) => key.startsWith('movie:')).map((key) => key.slice('movie:'.length))
  const seriesIds = selected.value.filter((key) => key.startsWith('series:')).map((key) => key.slice('series:'.length))

  const saved = await apply({ movies: movieIds, series: seriesIds, createdBy: target.value })

  if (saved) {
    selected.value = []
  }
}

onMounted(load)
</script>

<template>
  <h1>Attribution</h1>

  <p class="mt-4 color-secondary">
    Only shared (Global) rows appear here. A private row belongs to its creator alone, so it must be made Global by its
    owner before it can be reassigned.
  </p>

  <div class="mt-6 flex flex-wrap items-end gap-4">
    <label class="field flex-1 min-w-48">
      <div class="label">Search</div>
      <input type="text" name="search" placeholder="Title" v-model="search">
    </label>

    <label class="field">
      <div class="label">Current creator</div>
      <select name="creatorFilter" v-model="creatorFilter">
        <option :value="null">Anyone</option>
        <option v-for="user in users.all" :key="user.id" :value="user.id">{{ user.username }}</option>
      </select>
    </label>

    <label class="field">
      <div class="label">Reassign selected to</div>
      <select name="target" v-model="target">
        <option :value="null">Select a user</option>
        <option v-for="user in users.all" :key="user.id" :value="user.id">{{ user.username }}</option>
      </select>
    </label>

    <button
      type="button"
      class="primary"
      :disabled="busy || !target || selected.length === 0"
      @click="reassignSelected"
    >
      Reassign selected ({{ selected.length }})
    </button>
  </div>

  <p v-if="message" class="mt-4">{{ message }}</p>

  <div class="mt-6 flex items-center gap-3">
    <input
      id="attribution-all"
      type="checkbox"
      :checked="allSelected"
      :disabled="filtered.length === 0 || busy"
      @change="toggleAll"
    >
    <label for="attribution-all" class="text-s">Select all shown ({{ filtered.length }})</label>
  </div>

  <ul class="mt-4 flex flex-col gap-3">
    <li
      v-for="row in filtered"
      :key="keyFor(row)"
      class="flex flex-wrap items-center gap-4 p-3 rounded-lg"
      style="background-color: var(--surface2)"
    >
      <input
        type="checkbox"
        :checked="selected.includes(keyFor(row))"
        :disabled="busy"
        :aria-label="`Select ${row.title}`"
        @change="toggleSelected(row)"
      >

      <div class="flex-1 min-w-48">
        <div>{{ row.title }}</div>
        <div class="text-s color-secondary">
          {{ row.type }} · added by {{ creatorName(row.createdBy) }}
          <template v-if="row.recommendedBy"> · recommended by {{ recommenderName(row.recommendedBy) }}</template>
        </div>
      </div>

      <label class="field">
        <div class="label">Creator</div>

        <select
          name="creator"
          :value="drafts[keyFor(row)] ?? row.createdBy"
          :disabled="busy"
          :aria-label="`Creator for ${row.title}`"
          @change="stageOne(row, $event)"
        >
          <option v-if="!users.byId(row.createdBy)" :value="row.createdBy">Unknown</option>
          <option v-for="user in users.all" :key="user.id" :value="user.id">{{ user.username }}</option>
        </select>
      </label>

      <button
        v-if="drafts[keyFor(row)] && drafts[keyFor(row)] !== row.createdBy"
        type="button"
        class="primary"
        :disabled="busy"
        @click="reassignOne(row, drafts[keyFor(row)] ?? row.createdBy)"
      >
        Apply
      </button>
    </li>
  </ul>

  <p v-if="filtered.length === 0" class="mt-4 color-secondary">No shared records match.</p>
</template>
