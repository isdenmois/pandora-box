<script lang="ts">
  import { api } from '@/shared/api'
  import { getMessage, preventDefault } from '@/shared/lib'

  let message = $state('')
  let username = $state('')
  let password = $state('')

  const register = async () => {
    try {
      await api.admin.register(username, password)

      username = ''
      password = ''
    } catch (error) {
      message = getMessage(error)
    }
  }
</script>

<h1>Admin panel, baby!</h1>

<h3>Register a user</h3>

<form class="mt-8" onsubmit={preventDefault(register)}>
  <input
    name="username"
    class:error={message}
    type="text"
    autocapitalize="off"
    placeholder="Username"
    bind:value={username}
  />

  <input class="mt-4" class:error={message} type="password" placeholder="Password" bind:value={password} />

  {#if message}
    <p class="mt-4" style="color: red">{message}</p>
  {/if}

  <div class="mt-4">
    <button type="submit">Register</button>
  </div>
</form>
