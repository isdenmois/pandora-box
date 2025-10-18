<script setup lang="ts">
import Icon from './icon.vue'
import { icons } from './icons'
</script>

<template>
  <nav class="navbar">
    <RouterLink class="nav-link not-link" to="/" replace>
      <div class="icon">
        <Icon :size="32" :icon="icons.home" />
      </div>

      <div class="mt-1">Home</div>
    </RouterLink>

    <RouterLink class="nav-link plus not-link" to="/search" data-testid="search-button">
      <div class="flex items-center justify-center icon">
        <Icon :size="40" :icon="icons.plus" />
      </div>
    </RouterLink>

    <RouterLink class="nav-link not-link" to="/settings" replace>
      <div class="icon">
        <Icon :size="32" :icon="icons.settings" />
      </div>

      <div class="mt-1">Settings</div>
    </RouterLink>
  </nav>
</template>

<style>
.navbar {
  padding: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 24px;
  color: var(--text-secondary);
}

#mobile .navbar {
  position: fixed;
  background-color: var(--surface1);
  bottom: 0;
  left: 0;
  right: 0;
  flex-direction: row;
  font-size: 14px;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0px -8px 8px #0002;
}

.nav-link[aria-current='page'] {
  color: var(--text-primary);
}

.nav-link.plus .icon {
  color: var(--background);
  background-color: var(--primary1);
  border-radius: 50%;
  height: 64px;
  width: 64px;
  box-shadow: 2px 6px 6px var(--background);
}

#mobile .nav-link.plus {
  position: absolute;
  bottom: 16px;
}

body:not(#mobile) .nav-link.plus {
  position: fixed;
  right: 1rem;
  bottom: 5rem;
}

#mobile .navbar .nav-link:not(.plus) {
  flex: 1;
}
</style>
