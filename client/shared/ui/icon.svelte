<script lang="ts">
  interface Props {
    icon: string
    size: number
  }

  const { icon, size = 32 }: Props = $props()
</script>

<svg height={size} width={size}>
  <use xlink:href={`${icon}#icon`}></use>
</svg>

<style>
  svg {
    flex-shrink: 0;
  }
</style>
