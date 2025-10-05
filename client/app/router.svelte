<script lang="ts">
  import { Router, Route } from 'svelte5-router'
  import { user$ } from '@/shared/lib'
  import { EditDialog, HomePage, SearchDialog } from '@/pages/home'
  import { AdminPage, BackupPage, RegisterUserPage } from '@/pages/admin'
  import { SettingsPage } from '@/pages/settings'
  import NavBar from './navbar.svelte'
  import Dialog from './dialog.svelte'
</script>

<div class="root flex flex-1 justify-center">
  <Router>
    <NavBar />

    <main class="flex flex-1 p-8">
      <div class="p-4 pb-5 sm:pb-4 flex-1 overflow-y-auto">
        {#if $user$?.role === 'admin'}
          <Route path="/admin/register">
            <RegisterUserPage />
          </Route>

          <Route path="/admin/backup">
            <BackupPage />
          </Route>

          <Route path="/admin/*">
            <AdminPage />
          </Route>
        {/if}

        <Route path="/settings">
          <SettingsPage />
        </Route>

        <Route path="/*">
          <HomePage />

          <Router>
            <Route path="search">
              <Dialog id="search">
                <SearchDialog />
              </Dialog>
            </Route>
            <Route path="edit/:id">
              {#snippet children(params)}
                <Dialog id="add">
                  <EditDialog id={params.id} />
                </Dialog>
              {/snippet}
            </Route>
          </Router>
        </Route>
      </div>
    </main>
  </Router>
</div>

<style>
  .root {
    background-color: var(--black);
  }

  main {
    margin: 1.5rem 1.5rem 1.5rem 0;
    background-color: var(--background);
    border-radius: 2rem;
    height: calc(100vh - 9rem);
    max-width: 80rem;
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
</style>
