<script lang="ts">
  import { navigate } from 'svelte-routing'

  const { parent = '/' } = $props()

  const goBack = () => {
    navigate(parent)
  }
</script>

<div class="dialog flex items-center justify-center">
  <div class="backdrop" onclick={goBack}></div>

  <div class="content">
    <slot />
  </div>
</div>

<style>
  .dialog {
    position: fixed;
    inset: 0;
  }

  .backdrop {
    content: '';
    position: absolute;
    inset: 0;
    background-color: rgba(0, 0, 0, 0.5);
  }

  .content {
    background-color: var(--card);
    min-width: var(--max-dialog-width);
    padding: 1rem;
    z-index: 1;
    border-radius: 1rem;
    max-height: 80vh;
    overflow-y: auto;
  }
</style>
