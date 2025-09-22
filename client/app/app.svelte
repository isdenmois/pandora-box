<script lang="ts">
  import { LoginPage } from '../pages/login'
  import { initialized, isLoggedIn } from '../shared/lib/auth'
  import AppRouter from './router.svelte'
</script>

{#if $isLoggedIn}
  <AppRouter />
{:else if $initialized}
  <LoginPage />
{:else}
  <div class="h-screen flex justify-center items-center">Loading...</div>
{/if}
