<script lang="ts">
  import { auth, user$ } from '@/shared/lib'
  import { Link } from 'svelte5-router'
</script>

<h1>Settings</h1>

<div class="mt-8">
  {#if $user$?.role === 'admin'}
    <div>
      <Link to="/admin">admin</Link>
    </div>
  {/if}

  <button class="mt-4" onclick={auth.logout}>Logout</button>
</div>
