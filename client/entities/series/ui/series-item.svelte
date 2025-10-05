<script lang="ts">
  import type { Series } from '@/shared/api'
  import { Item } from '@/shared/ui'

  interface Props {
    series: Series
  }

  const { series }: Props = $props()
</script>

<Item title={series.title} imgUrl={series.poster} testId={`series-${series.id}`} />
