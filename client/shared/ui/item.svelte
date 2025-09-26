<script lang="ts">
  interface Props {
    title: string
    description?: string | null
    imgUrl?: string | null
  }

  const { title, description, imgUrl }: Props = $props()
</script>

<div class="flex item rounded-md overflow-hidden">
  {#if imgUrl}
    <img class="object-cover h-20 w-12" src={imgUrl} alt={title} />
  {/if}

  <div class="p-4">
    <div class="text-m">{title}</div>

    {#if description}
      <div class="text-s mt-2 secondary">{description}</div>
    {/if}
  </div>
</div>

<style>
  .item {
    box-shadow: 0px 4px 4px 1px rgba(0, 0, 0, 0.25);
  }
</style>
