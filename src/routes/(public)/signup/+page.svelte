<script lang="ts">
  import { enhance } from '$app/forms'

  import type { ActionData } from './$types'

  export let form: ActionData
</script>

<h1>Sign up</h1>

{#if form?.message}
  <h6>{form.message}</h6>
{/if}

<form method="post" use:enhance>
  <label>
    Username
    <input type="text" name="username" autofocus placeholder="Login" required />
  </label>

  <label class="mt-2">
    Password
    <input type="password" name="password" placeholder="Password" required />
  </label>

  <button class="mt-2 w-full" type="submit">Sign Up</button>
</form>

<a class="mt-4" href="/login">Login</a>
