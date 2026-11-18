import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import { makeMovie, makeSeries } from '@/shared/ui/__tests__/fixtures'
import { useTags } from '../tags'

describe('useTags', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('collects the tags of movies and series without duplicates', () => {
    // arrange
    useMovies().all = [makeMovie({ tags: ['drama', 'sci-fi'] }), makeMovie({ tags: ['drama'] })]
    useSeries().all = [makeSeries({ tags: ['sci-fi', 'comedy'] })]

    // act
    const tags = useTags()

    // assert
    expect(tags.tags).toEqual(['comedy', 'drama', 'sci-fi'])
  })

  it('ignores rows without tags', () => {
    // arrange
    useMovies().all = [makeMovie({ tags: null })]
    useSeries().all = [makeSeries({ tags: [] })]

    // act
    const tags = useTags()

    // assert
    expect(tags.tags).toEqual([])
  })

  it('reacts to a row being added later', () => {
    // arrange
    const movies = useMovies()
    movies.all = []
    const tags = useTags()

    // act
    movies.all = [makeMovie({ tags: ['western'] })]

    // assert
    expect(tags.tags).toEqual(['western'])
  })
})
