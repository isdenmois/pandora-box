<script lang="ts">
  import type { Movie } from '@/shared/api'
  import { Item } from '@/shared/ui'

  interface Props {
    movie: Movie
  }

  const { movie }: Props = $props()
</script>

<Item title={movie.title} imgUrl={movie.poster} testId={`movie-${movie.id}`} />
