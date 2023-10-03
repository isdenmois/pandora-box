<script lang="ts">
  import { applyAction, deserialize, enhance } from '$app/forms'
  import { invalidateAll } from '$app/navigation'
  import type { LayoutData } from './$types'

  export let data: LayoutData

  const logout = async () => {
    const response = await fetch('/?/logout', { method: 'POST', body: new FormData() })
    const result = deserialize(await response.text())

    if (result.type === 'success') {
      await invalidateAll()
    }

    applyAction(result)
  }
</script>

<nav>
  <ul>
    <li><strong>Pandora</strong></li>
  </ul>

  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/users">Users</a></li>
    <li><button on:click={logout}>Log out</button></li>
    <li>
      <details role="list">
        <summary aria-haspopup="listbox">Details</summary>
        <ul role="listbox">
          <li><a href="#" on:click={logout}>Sign out</a></li>
        </ul>
      </details>
    </li>
  </ul>
</nav>

<h3><span class="font-medium">Hello, </span>{data.username}!</h3>

<slot />
