<script lang="ts">
  import { Router, Route } from 'svelte-routing'
  import HomePage from '../pages/home/home-page.svelte'
  import { user$ } from '../shared/lib'
  import { AdminPage } from '../pages/admin'
</script>

<div class="root">
  <Router>
    <main>
      {#if $user$?.role === 'admin'}
        <Route path="/admin">
          <AdminPage />
        </Route>
      {/if}

      <Route path="/*">
        <HomePage />
      </Route>
    </main>
  </Router>
</div>
