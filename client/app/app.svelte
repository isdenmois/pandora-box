<script lang="ts">
  import { LoginPage } from '@/pages/login'
  import { initialized, isLoggedIn } from '@/shared/lib'
  import { Spinner } from '@/shared/ui'
  import AppRouter from './router.svelte'
</script>

{#if $isLoggedIn}
  <AppRouter />
{:else if $initialized}
  <LoginPage />
{:else}
  <div class="h-screen flex justify-center items-center">
    <Spinner size={48} />
  </div>
{/if}
