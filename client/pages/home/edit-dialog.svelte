<script lang="ts">
  import { movies } from '@/entities/movie'
  import { series } from '@/entities/series'
  import { api } from '@/shared/api'
  import { preventDefault } from '@/shared/lib'
  import { Spinner } from '@/shared/ui'
  import { onMount } from 'svelte'
  import { navigate } from 'svelte5-router'

  const { id }: { id: string } = $props()
  let isLoading = $state(true)
  let isCreating = $state(false)
  let error = $state(false)
  let title = $state('')
  let rating = $state('')
  let year = $state('')
  let poster = $state('')
  let type = $state<'movie' | 'series'>('movie')
  let season = $state('1')
  let language: string | null = null
  let genre: string | null = null
  let forMe = $state(false)
  let iAdded = $state(false)
  let reason = $state('')

  let extra: object = {}

  const isValid = $derived(!!title)

  onMount(async () => {
    try {
      const data = await api.search.byId(id)

      type = data.type
      title = data.title
      rating = data.rating ? String(data.rating) : ''
      year = data.year ? String(data.year) : ''
      poster = data.poster ?? ''
      language = data.language || null
      genre = data.genre || null
      extra = data.extra ?? {}
    } catch {
      error = true
    } finally {
      isLoading = false
    }
  })

  const addSeries = async () =>
    await series.create({
      extId: id,
      provider: 'omdb',
      title,
      rating: parseFloat(rating) || null,
      year: parseInt(year) || null,
      poster,
      season: 1,
      language,
      genre,
      reason,
      userId: iAdded ? 'me' : null,
      private: forMe,
      extra,
    })

  const addMovie = async () =>
    movies.create({
      extId: id,
      provider: 'omdb',
      title,
      rating: parseFloat(rating) || null,
      year: parseInt(year) || null,
      poster,
      language,
      genre,
      reason,
      userId: iAdded ? 'me' : null,
      private: forMe,
      extra,
    })

  const add = async () => {
    if (!isValid) return

    isCreating = true

    try {
      if (type === 'series') {
        await addSeries()
      } else if (type === 'movie') {
        await addMovie()
      }

      navigate('/', { replace: true })
    } finally {
      isCreating = false
    }
  }
</script>

{#if isLoading}
  <Spinner size={24} />
{:else if error}
  error!
{:else}
  <h1>Add "{title}"</h1>

  <form onsubmit={preventDefault(add)}>
    <div>
      <label>
        Type

        <select bind:value={type} disabled={isCreating}>
          <option value="movie">Movie</option>
          <option value="series">Series</option>
        </select>
      </label>
    </div>

    <div>
      <label>
        Title
        <input type="text" name="title" placeholder="Title" bind:value={title} disabled={isCreating} />
      </label>
    </div>

    <div>
      <label>
        Rating
        <input type="text" name="rating" placeholder="Rating" bind:value={rating} disabled={isCreating} />
      </label>
    </div>

    <div>
      <label>
        Year
        <input type="text" name="year" placeholder="Year" bind:value={year} disabled={isCreating} />
      </label>
    </div>

    <div>
      <label>
        Poster
        <input type="text" name="poster" placeholder="Poster" bind:value={poster} disabled={isCreating} />
      </label>
    </div>

    {#if type === 'series'}
      <div>
        <label>
          Season
          <input type="text" name="season" placeholder="Season" bind:value={season} disabled={isCreating} />
        </label>
      </div>
    {/if}

    <div>
      <label>
        Why
        <input type="text" name="why" placeholder="Why" bind:value={reason} disabled={isCreating} />
      </label>
    </div>

    <div>
      <label>
        I Added
        <input type="checkbox" bind:checked={iAdded} disabled={isCreating} />
      </label>
    </div>

    <div>
      <label>
        For Me
        <input type="checkbox" bind:checked={forMe} disabled={isCreating} />
      </label>
    </div>

    <button type="submit" disabled={!isValid || isCreating}>Add</button>
  </form>
{/if}
