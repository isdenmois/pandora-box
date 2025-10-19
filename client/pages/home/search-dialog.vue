<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { api, type SearchItem } from '@/shared/api'
import { vFocusOnMount } from '@/shared/lib'
import { Dialog, Item, Spinner } from '@/shared/ui'

const router = useRouter()

const query = ref('')
const isSearching = ref(false)
const result = ref<SearchItem[] | null>(null)

const series = computed(() => result.value?.filter((item) => item.type === 'series') ?? [])
const movies = computed(() => result.value?.filter((item) => item.type === 'movie') ?? [])
const omdbId = /(tt\d\d\d\d+)/i

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
    <form class="sticky top-0 w-full" @submit.prevent="search">
      <input
        class="w-full"
        type="text"
        name="q"
        v-model="query"
        placeholder="Search..."
        :disabled="isSearching"
        v-focus-on-mount
      />
    </form>

    <div v-if="isSearching" class="mt-6 text-center">
      <Spinner :size="24" />
    </div>

    <template v-if="series.length">
      <h3 class="mt-8">Series</h3>
      <ul class="mt-4 flex flex-col gap-4">
        <li v-for="item in series" :key="item.id">
          <RouterLink class="not-link" :to="`/add/${item.id}`" :data-testid="`search-series-${item.id}`">
            <Item :title="item.title" :description="item.year ? String(item.year) : null" :imgUrl="item.poster" />
          </RouterLink>
        </li>
      </ul>
    </template>

    <template v-if="movies.length">
      <h3 class="mt-8">Movies</h3>
      <ul class="mt-4 flex flex-col gap-4">
        <li v-for="item in movies" :key="item.id">
          <RouterLink class="not-link" :to="`/add/${item.id}`" :data-testid="`search-movie-${item.id}`">
            <Item :title="item.title" :description="item.year ? String(item.year) : null" :imgUrl="item.poster" />
          </RouterLink>
        </li>
        {/each}
      </ul>
    </template>
  </Dialog>
</template>

<style scoped>
form {
  background-color: var(--card);
}
</style>
