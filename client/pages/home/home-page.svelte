<script lang="ts">
  import { user$ } from '../../shared/api'
  import { api } from '../../shared/api'
</script>

<p>User: {$user$?.username}</p>

<p>Role: {$user$?.role}</p>

<button on:click={api.auth.logout}>Logout</button>
