import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readonly } from 'vue'
import { useMovies } from '@/entities/movie'
import { useSeries } from '@/entities/series'
import type { Movie, Series } from '@/shared/api'

import { useHome } from '../home-filters'

vi.mock('@/entities/movie', () => {
  return {
    useMovies: vi.fn().mockReturnValue({ all: [] }),
  }
})

vi.mock('@/entities/series', () => {
  return {
    useSeries: vi.fn().mockReturnValue({ all: [] }),
  }
})

describe('useHome store', () => {
  let moviesMock: ReturnType<typeof useMovies>
  let seriesMock: ReturnType<typeof useSeries>

  beforeEach(() => {
    setActivePinia(createPinia())

    moviesMock = useMovies()
    seriesMock = useSeries()
  })

  describe('initial sort', () => {
    it('should sort movies by rating by default', () => {
      // arrange
      const a = { id: 'a', rating: 5 } as Movie
      const b = { id: 'b', rating: 3 } as Movie
      const c = { id: 'c', rating: 7 } as Movie

      moviesMock.all = readonly([a, b, c])

      // act
      const store = useHome()

      // assert
      expect(store.movies).toEqual([c, a, b])
    })

    it('should sort series by rating by default', () => {
      // arrange
      const a = { id: 'a', rating: 5 } as Series
      const b = { id: 'b', rating: 3 } as Series
      const c = { id: 'c', rating: 7 } as Series

      seriesMock.all = readonly([a, b, c])

      // act
      const store = useHome()

      // assert
      expect(store.series).toEqual([c, a, b])
    })
  })

  describe('"for me" filter', () => {
    const a = { id: 'a', rating: 5, private: true } as Movie
    const b = { id: 'b', rating: 3 } as Movie
    const c = { id: 'c', rating: 7 } as Movie

    beforeEach(() => {
      moviesMock.all = readonly([a, b, c])
    })

    it('should filter out private movies by default', () => {
      // arrange + act
      const store = useHome()

      // assert
      expect(store.forMe).toBeFalsy()
      expect(store.movies).toEqual([c, b])
    })

    it('should filter by private when toggle "for me"', () => {
      // arrange
      const store = useHome()

      // act
      store.toggleForMe()

      // assert
      expect(store.forMe).toBeTruthy()
      expect(store.movies).toEqual([a])
    })
  })

  describe('sort mode', () => {
    const a = { title: 'a', rating: 5 } as Movie
    const b = { title: 'b', rating: 3 } as Movie
    const c = { title: 'c', rating: 7 } as Movie
    const d = { title: 'd', rating: 4 } as Movie

    beforeEach(() => {
      moviesMock.all = readonly([a, c, b, d])
    })

    it('should sort by rating by default', () => {
      // arrange + act
      const store = useHome()

      // assert
      expect(store.sort).toBe('season')
      expect(store.movies).toEqual([c, a, d, b])
    })

    it('should sort by title when toggle "sort"', () => {
      // arrange
      const store = useHome()

      // act
      store.toggleSort()

      // assert
      expect(store.sort).toBe('title')
      expect(store.movies).toEqual([a, b, c, d])
    })
  })
})
