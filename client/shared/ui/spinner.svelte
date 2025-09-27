<script lang="ts">
  import Icon from './icon.svelte'
  import svg from './spinner.svg'

  interface Props {
    size: number
  }

  const { size }: Props = $props()
</script>

<Icon icon={svg} {size} />
