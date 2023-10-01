<script lang="ts">
  import { enhance } from '$app/forms'
  import { Label, Input, Button, Alert } from 'flowbite-svelte'
  import { UserSolid, LockSolid } from 'flowbite-svelte-icons'

  import type { ActionData } from './$types'

  export let form: ActionData
</script>

<h1 class="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Sign in</h1>

{#if form?.message}
  <Alert class="mt-2">{form.message}</Alert>
{/if}

<form class="mt-4" method="post" use:enhance>
  <Label for="input-group-1" class="block mb-2">Username</Label>
  <Input type="text" name="username" autofocus>
    <UserSolid tabindex="-16" slot="left" class="w-5 h-5 text-gray-500 dark:text-gray-400" />
  </Input>

  <Label for="input-group-1" class="block mb-2">Password</Label>
  <Input type="password" name="password">
    <LockSolid tabindex="-16" slot="left" class="w-5 h-5 text-gray-500 dark:text-gray-400" />
  </Input>

  <Button class="mt-2 w-full" type="submit">Login</Button>
</form>

<a class="mt-4" href="/signup">Create an account</a>
