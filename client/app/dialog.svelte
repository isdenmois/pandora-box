<script lang="ts">
  import { navigate } from 'svelte5-router'

  const { parent = '/', children } = $props()

  const goBack = () => {
    navigate(parent, { replace: true })
  }
</script>

<div class="inset-0 fixed flex items-center justify-center">
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <div class="backdrop absolute inset-0" onclick={goBack}></div>

  <div class="content p-4 z-1 overflow-y-auto">
    {@render children?.()}
  </div>
</div>

<style>
  .backdrop {
    background-color: rgba(0, 0, 0, 0.5);
  }

  .content {
    background-color: var(--card);
    min-width: var(--max-dialog-width);
    border-radius: 1rem;
    max-height: 80vh;
  }
</style>
