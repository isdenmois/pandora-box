<script lang="ts">
  import { api, getMessage } from '../../shared/api'

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

<form on:submit|preventDefault={register}>
  <label>
    Username
    <input name="username" bind:value={username} />
  </label>
  <label>
    Password
    <input type="password" name="password" bind:value={password} />
  </label>

  <button type="submit">Register</button>
</form>

{#if message}
  <p style="color: red">{message}</p>
{/if}
