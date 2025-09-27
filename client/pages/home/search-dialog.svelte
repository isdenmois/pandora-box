<script lang="ts">
  import { api, type SearchItem } from '@/shared/api'
  import { focusOnMount, preventDefault } from '@/shared/lib'
  import { Item, Spinner } from '@/shared/ui'

  let query = $state('')
  let isSearching = $state(false)
  let result = $state<SearchItem[] | null>(null)

  const series = $derived(result?.filter((item) => item.type === 'series') ?? [])
  const movies = $derived(result?.filter((item) => item.type === 'movie') ?? [])

  const search = async () => {
    isSearching = true
    result = null

    try {
      result = await api.search.external(query)
    } catch {
      result = []
    } finally {
      isSearching = false
    }
  }
</script>

<form class="sticky top-0 w-full" onsubmit={preventDefault(search)}>
  <input
    class="w-full"
    type="text"
    name="q"
    bind:value={query}
    placeholder="Search..."
    disabled={isSearching}
    use:focusOnMount
  />
</form>

{#if isSearching}
  <div class="mt-6 text-center">
    <Spinner size={24} />
  </div>
{/if}

{#if result?.length}
  {#if series.length}
    <h3 class="mt-8">Series</h3>
    <ul class="mt-4 flex flex-col gap-4">
      {#each series as item}
        <li>
          <Item title={item.title} description={item.year ? String(item.year) : null} imgUrl={item.poster} />
        </li>
      {/each}
    </ul>
  {/if}

  {#if movies.length}
    <h3 class="mt-8">Movies</h3>
    <ul class="mt-4 flex flex-col gap-4">
      {#each movies as item}
        <li>
          <Item title={item.title} description={item.year ? String(item.year) : null} imgUrl={item.poster} />
        </li>
      {/each}
    </ul>
  {/if}
{:else if result}
  Nothing was found
{/if}

<style>
  form {
    background-color: var(--card);
  }
</style>
