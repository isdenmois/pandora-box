<script setup lang="ts">
import Icon from './icon.vue'
import { icons } from './icons'
</script>

<template>
  <nav>
    <RouterLink class="nav-link not-link" to="/" replace>
      <div class="icon">
        <Icon :size="40" :icon="icons.series" />
      </div>

      <div>Wishlist</div>
    </RouterLink>

    <RouterLink class="nav-link plus not-link" to="/search" data-testid="search-button">
      <div class="flex items-center justify-center icon">
        <Icon :size="32" :icon="icons.plus" />
      </div>
    </RouterLink>

    <RouterLink class="nav-link not-link" to="/settings" replace>
      <div class="icon">
        <Icon :size="40" :icon="icons.settings" />
      </div>

      <div>Settings</div>
    </RouterLink>
  </nav>
</template>

<style scoped>
nav {
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: var(--black);
  text-align: center;
  gap: 1.5rem;
}

:global(.nav-link.plus .icon) {
  background-color: var(--accent);
  color: var(--card);
  border-radius: 50%;
  height: 4rem;
  width: 4rem;
}

:global(body:not(#mobile) .nav-link.plus) {
  position: absolute;
  right: 1rem;
  bottom: 5rem;
}

/* Mobile */
:global(#mobile nav) {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  flex-direction: row;
  font-size: 12px;
  gap: 0;
}

:global(#mobile .nav-link.plus .icon) {
  width: 48px;
  height: 48px;
}

:global(#mobile nav .nav-link:not(.plus)) {
  flex: 1;
}
</style>
