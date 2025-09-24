<script lang="ts">
  import { auth, getMessage } from '@/shared/lib'

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

<style>
  main {
    display: flex;
    flex-direction: column;
    flex: 1;
    align-items: center;
    justify-content: center;
  }

  form {
    display: flex;
    flex-direction: column;
    background-color: var(--card);
    padding: 2rem 1.5rem;
    border-radius: 1rem;
  }

  h1 {
    text-align: center;
  }

  input {
    width: 16rem;
  }

  /* Mobile */
  :global(#mobile) main {
    align-items: stretch;
    background-color: transparent;
  }

  :global(#mobile) input {
    width: auto;
  }
</style>
