<script lang="ts">
  import { api, type SearchItem } from '@/shared/api'
  import { Item } from '@/shared/ui'

  let query = $state('Black Mirror')
  let isSearching = $state(false)
  let result = $state<SearchItem[] | null>(null)

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

<form on:submit|preventDefault={search}>
  <input class="w-full" name="q" bind:value={query} placeholder="Search..." disabled={isSearching} />
</form>

{#if result?.length}
  <ul class="mt-4 flex flex-col gap-4">
    {#each result as item (item.id)}
      <li>
        <Item title={item.title} description={item.type} imgUrl={item.poster} />
      </li>
    {/each}
  </ul>
{:else if result}
  Nothing was found
{/if}

<style>
  form {
    position: sticky;
    top: 0;
    width: 100%;
    background-color: var(--card);
  }
</style>
