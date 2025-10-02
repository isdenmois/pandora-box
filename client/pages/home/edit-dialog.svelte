<script lang="ts">
  import { api } from '@/shared/api'
  import { preventDefault } from '@/shared/lib'
  import { Spinner } from '@/shared/ui'
  import { onMount } from 'svelte'
  import { navigate } from 'svelte5-router'

  const { id }: { id: string } = $props()
  let isLoading = $state(true)
  let error = $state(false)
  let title = $state('')
  let rating = $state('')
  let year = $state('')
  let poster = $state('')
  let type = $state<'movie' | 'series'>('movie')
  let season = $state('1')
  let forMe = $state(false)
  let iAdded = $state(false)
  let why = $state('')

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
      extra = data.extra ?? {}
    } catch {
      error = true
    } finally {
      isLoading = false
    }
  })

  const add = () => {
    if (!isValid) return

    console.log({
      id,
      title,
      rating,
      year,
      poster,
      type,
      season,
      forMe,
      iAdded,
      why,
      extra,
    })

    navigate('/', { replace: true })
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

        <select bind:value={type}>
          <option value="movie">Movie</option>
          <option value="series">Series</option>
        </select>
      </label>
    </div>

    <div>
      <label>
        Title
        <input type="text" name="title" placeholder="Title" bind:value={title} />
      </label>
    </div>

    <div>
      <label>
        Rating
        <input type="text" name="rating" placeholder="Rating" bind:value={rating} />
      </label>
    </div>

    <div>
      <label>
        Year
        <input type="text" name="year" placeholder="Year" bind:value={year} />
      </label>
    </div>

    <div>
      <label>
        Poster
        <input type="text" name="poster" placeholder="Poster" bind:value={poster} />
      </label>
    </div>

    {#if type === 'series'}
      <div>
        <label>
          Season
          <input type="text" name="season" placeholder="Season" bind:value={season} />
        </label>
      </div>
    {/if}

    <div>
      <label>
        Why
        <input type="text" name="why" placeholder="Why" bind:value={why} />
      </label>
    </div>

    <div>
      <label>
        I Added
        <input type="checkbox" bind:checked={iAdded} />
      </label>
    </div>

    <div>
      <label>
        For Me
        <input type="checkbox" bind:checked={forMe} />
      </label>
    </div>

    <button type="submit" disabled={!isValid}>Add</button>
  </form>
{/if}
