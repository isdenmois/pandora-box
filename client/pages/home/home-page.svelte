<script lang="ts">
  import { user$ } from '@/shared/lib'
  import { series, SeriesItem } from '@/entities/series'
  import { movies, MovieItem } from '@/entities/movie'
  import { Spinner } from '@/shared/ui'
  import { onMount } from 'svelte'

  onMount(() => {
    series.refresh()
    movies.refresh()
  })
</script>

<h1>Series</h1>

<p class="mt-8">User: {$user$?.username}</p>

<p>Role: {$user$?.role}</p>

<p>All Series</p>

{#if series.isLoading}
  <Spinner size={24} />
{/if}

<ul>
  {#each series.all as item (item.id)}
    <li>
      <SeriesItem series={item} />
    </li>
  {/each}
</ul>

<p>All Movies</p>

{#if movies.isLoading}
  <Spinner size={24} />
{/if}

<ul>
  {#each movies.all as movie (movie.id)}
    <li>
      <MovieItem {movie} />
    </li>
  {/each}
</ul>
