<script lang="ts">
  import { auth, user$ } from '@/shared/lib'
  import { Link } from 'svelte-routing'
</script>

<h1>Settings</h1>

{#if $user$?.role === 'admin'}
  <Link to="/admin">admin</Link>
{/if}

<button on:click={auth.logout}>Logout</button>
