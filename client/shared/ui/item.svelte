<script lang="ts">
  interface Props {
    title: string
    description?: string | null
    imgUrl?: string | null
  }

  const { title, description, imgUrl }: Props = $props()
</script>

<div class="flex item rounded-md gap-4 overflow-hidden">
  {#if imgUrl}
    <img class="object-cover h-20 w-12" src={imgUrl} alt={title} />
  {/if}

  <div>
    <div>{title}</div>

    {#if description}
      <div>{description}</div>
    {/if}
  </div>
</div>

<style>
  .item {
    box-shadow: 0px 4px 4px 1px rgba(0, 0, 0, 0.25);
  }
</style>
