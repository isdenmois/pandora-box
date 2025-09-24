<script lang="ts">
  import { Router, Route } from 'svelte-routing'
  import { user$ } from '@/shared/lib'
  import { HomePage } from '@/pages/home'
  import { AdminPage } from '@/pages/admin'
  import { SettingsPage } from '@/pages/settings'
  import NavBar from './navbar.svelte'
</script>

<div class="root">
  <Router>
    <NavBar />

    <main>
      <div class="content">
        {#if $user$?.role === 'admin'}
          <Route path="/admin">
            <AdminPage />
          </Route>
        {/if}

        <Route path="/settings">
          <SettingsPage />
        </Route>

        <Route path="/*">
          <HomePage />
        </Route>
      </div>
    </main>
  </Router>
</div>

<style>
  .root {
    display: flex;
    flex: 1;
    background-color: var(--black);
    justify-content: center;
  }

  main {
    margin: 1.5rem 1.5rem 1.5rem 0;
    flex: 1;
    background-color: var(--background);
    border-radius: 2rem;
    padding: 2rem;
    height: calc(100vh - 9rem);
    display: flex;
    max-width: 80rem;
  }

  .content {
    padding: 1rem;
    flex: 1;
    overflow-y: auto;
  }

  /* Mobile */
  :global(#mobile) .root {
    flex-direction: column;
    max-height: 100dvh;
  }

  :global(#mobile) main {
    margin: 0;
    border-radius: 0;
    padding: 0;
  }

  :global(#mobile) .content {
    padding-bottom: 5rem;
  }
</style>
