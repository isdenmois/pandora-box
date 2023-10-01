<script lang="ts">
  import { applyAction, deserialize } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import type { User } from '$lib/server/schema'
  import type { PageData } from './$types'

  export let data: PageData

  const postAction = async (action: string, body: FormData) => {
    const response = await fetch(`?/${action}`, {
      method: 'POST',
      body,
    })
    const result = deserialize(await response.text())

    if (result.type === 'success') {
      // rerun all `load` functions, following the successful update
      await invalidateAll()
    }

    applyAction(result)
  }

  const deleteUser = async (user: User) => {
    if (confirm('Are you sure you want to delete this user?')) {
      const body = new FormData()
      body.set('id', String(user.id))

      postAction('delete', body)
    }
  }
</script>

<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>

<p>
  Visit <a href="/users">users management page</a>
</p>

{#if data.users.length > 0}
  <h3>Users:</h3>

  <ul>
    {#each data.users as user}
      <li>{user.username} <button on:click={() => deleteUser(user)}>X</button></li>
    {/each}
  </ul>
{/if}

<form action="/search">
  <label>
    Search
    <input name="q" />
  </label>
</form>
