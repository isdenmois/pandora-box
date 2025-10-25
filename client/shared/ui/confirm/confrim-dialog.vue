<script setup lang="ts">
import Dialog from '../dialog.vue'
import { confrimData } from './use-confirm'
</script>

<template>
  <Dialog v-if="confrimData" className="p-4" :parent="null" id="confirm" @go-back="confrimData.resolve(false)">
    <h1>{{ confrimData.title }}</h1>
    <h3 class="mt-1" v-if="confrimData.message">{{ confrimData.message }}</h3>

    <div class="flex mt-4 gap-2">
      <button class="primary flex-1" @click="confrimData.resolve(false)">No</button>
      <button class="primary flex-1" :class="{ danger: confrimData.danger }" @click="confrimData.resolve(true)">
        Yes
      </button>
    </div>
  </Dialog>
</template>
