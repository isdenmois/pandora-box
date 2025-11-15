<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, type SearchItem } from '@/shared/api'
import { vFocusOnMount } from '@/shared/lib'
import { Dialog, Icon, icons, Item, Spinner } from '@/shared/ui'

const router = useRouter()

const query = ref('')
const isSearching = ref(false)
const result = ref<SearchItem[] | null>(null)

const series = computed(() => result.value?.filter((item) => item.type === 'series') ?? [])
const movies = computed(() => result.value?.filter((item) => item.type === 'movie') ?? [])
const omdbId = /(tt\d\d\d+)/i

const search = async () => {
  query.value = query.value.trim()
  const matches = query.value.match(omdbId)

  if (matches) {
    return router.push(`/add/${matches[1]}`)
  }

  isSearching.value = true
  result.value = null

  try {
    result.value = await api.search.external(query.value)
  } catch {
    result.value = []
  } finally {
    isSearching.value = false
  }
}
</script>

<template>
  <Dialog id="search">
    <form class="sticky z-1 top-0 w-full p-4 flex items-center gap-2" @submit.prevent="search">
      <label class="search flex-1">
        <Icon :size="24" :icon="icons.search" />
        <input
          class="w-full"
          type="text"
          name="q"
          v-model="query"
          placeholder="Start search by title or id..."
          :disabled="isSearching"
          v-focus-on-mount
        />
      </label>

      <RouterLink to="/add/manual">
        <Icon :size="32" :icon="icons.plusSquared" />
      </RouterLink>
    </form>

    <div v-if="isSearching" class="mb-4 text-center color-secondary">
      <Spinner :size="24" />
    </div>

    <div v-if="!result?.length && !isSearching" class="h-11 sm:hidden"></div>

    <div class="flex flex-col gap-4 px-4 pb-4">
      <div v-if="series.length">
        <h3>Series</h3>
        <ul class="mt-4 flex flex-col gap-4">
          <li v-for="item in series" :key="item.id">
            <RouterLink class="not-link" :to="`/add/${item.id}`" :data-testid="`search-series-${item.id}`">
              <Item :title="item.title" :description="item.year ? String(item.year) : null" :imgUrl="item.poster" />
            </RouterLink>
          </li>
        </ul>
      </div>

      <div v-if="movies.length">
        <h3>Movies</h3>
        <ul class="mt-4 flex flex-col gap-4">
          <li v-for="item in movies" :key="item.id">
            <RouterLink class="not-link" :to="`/add/${item.id}`" :data-testid="`search-movie-${item.id}`">
              <Item :title="item.title" :description="item.year ? String(item.year) : null" :imgUrl="item.poster" />
            </RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </Dialog>
</template>

<style scoped>
form {
  background-color: var(--surface0);
}
</style>
