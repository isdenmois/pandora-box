<script lang="ts">
  import type { PageData } from './$types'

  export let data: PageData

  let q = data.q
</script>

<form>
  <label>
    Search
    <input name="q" bind:value={q} />
  </label>
</form>

{#if data.series}
  <ul>
    {#each data.series as series (series.id)}
      <li>
        {series.seriesName}, {series.firstAired} ({series.image}) <img alt={series.seriesName} src={series.image} />
      </li>
    {/each}
  </ul>
{/if}
