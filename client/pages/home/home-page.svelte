<script lang="ts">
  import { user$, auth } from '@/shared/lib'
</script>

<p>User: {$user$?.username}</p>

<p>Role: {$user$?.role}</p>

<button on:click={auth.logout}>Logout</button>
