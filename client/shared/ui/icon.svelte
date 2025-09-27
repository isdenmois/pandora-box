<script lang="ts">
  interface Props {
    icon: string
    size: number
  }

  const { icon, size = 32 }: Props = $props()
</script>

<svg class="flex-shrink-0" height={size} width={size}>
  <use xlink:href={`${icon}#icon`}></use>
</svg>
