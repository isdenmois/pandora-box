import { movieRepository, seriesRepository } from '@/infra'

export interface PosterRow {
  poster: string | null
  posterSource: string | null
}

/**
 * Only one of the two tables holds an id, and posters are addressed per record rather than per
 * type: both the image route and the re-download route take a bare id.
 */
export async function findPosterRow(id: string): Promise<PosterRow | null> {
  const movie = await movieRepository.byId(id)

  if (movie) {
    return { poster: movie.poster, posterSource: movie.posterSource }
  }

  const series = await seriesRepository.byId(id)

  return series ? { poster: series.poster, posterSource: series.posterSource } : null
}
