<script setup lang="ts"></script>

<template>
  <h1>Admin panel, baby!</h1>

  <RouterLink to="/admin/register">Register a user</RouterLink>

  <RouterLink to="/admin/backup">Backup</RouterLink>

  <RouterLink to="/admin/import">Import</RouterLink>

  <router-view />
</template>
