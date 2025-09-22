<script lang="ts">
  import { auth, getMessage } from '../../shared/lib'

  let username = $state('')
  let password = $state('')
  let message = $state('')

  const handleSubmit = async () => {
    try {
      if (username && password) {
        await auth.login(username, password)
      }
    } catch (error) {
      message = getMessage(error)
    }
  }
</script>

<main>
  <form on:submit|preventDefault={handleSubmit}>
    <h1 class="pt-4">Login</h1>

    <input
      class="mt-8"
      class:error={message}
      type="text"
      autocapitalize="off"
      placeholder="Username"
      bind:value={username}
    />
    <input class="mt-4" class:error={message} type="password" placeholder="Password" bind:value={password} />

    {#if message}
      <p class="mt-4 error">{message}</p>
    {/if}

    <button class="mt-8" type="submit" disabled={!username || !password}>Sign In</button>
  </form>
</main>
