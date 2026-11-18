import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/infra/env', () => ({ env: { OMDB_URL: 'https://omdb.test/api' } }))

const { omdbSearchProvider } = await import('../search-repository/search-providers/omdb-search-provider')

const fetchMock = vi.fn()

/** The provider may hand fetch a string, a URL or a Request; the query parameters are all we need. */
function requestedUrl(index = 0): URL {
  const input = fetchMock.mock.calls[index]?.[0] as Request | URL | string | undefined
  const target = input instanceof Request ? input.url : String(input)

  return new URL(target)
}

const respond = (payload: unknown) =>
  new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })

describe('omdbSearchProvider.search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends the query to OMDB and maps the search results', async () => {
    // arrange
    fetchMock.mockResolvedValue(
      respond({
        Search: [
          {
            imdbID: 'tt1',
            Title: 'Movie One',
            Type: 'movie',
            Year: '1999',
            Poster: 'https://img.test/1.jpg',
          },
          { imdbID: 'tt2', Title: 'Show Two', Type: 'series', Year: '2001', Poster: '' },
        ],
      }),
    )

    // act
    const items = await omdbSearchProvider.search('matrix')

    // assert
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const url = requestedUrl()

    expect(url.origin + url.pathname).toBe('https://omdb.test/api')
    expect(url.searchParams.get('s')).toBe('matrix')
    expect(items).toEqual([
      { id: 'tt1', title: 'Movie One', type: 'movie', poster: 'https://img.test/1.jpg', year: 1999 },
      { id: 'tt2', title: 'Show Two', type: 'series', poster: null, year: 2001 },
    ])
  })

  it('passes the optional type and year filters along', async () => {
    // arrange
    fetchMock.mockResolvedValue(respond({ Search: [] }))

    // act
    const items = await omdbSearchProvider.search('show', 'series', 2001)

    // assert
    expect(items).toEqual([])
    const params = requestedUrl().searchParams

    expect(params.get('s')).toBe('show')
    expect(params.get('type')).toBe('series')
    expect(params.get('y')).toBe('2001')
  })

  it('drops results that are neither movies nor series', async () => {
    // arrange
    fetchMock.mockResolvedValue(
      respond({
        Search: [
          { imdbID: 'tt1', Title: 'A Movie', Type: 'movie', Year: '1999' },
          { imdbID: 'tt2', Title: 'An Episode', Type: 'episode', Year: '2001' },
        ],
      }),
    )

    // act
    const items = await omdbSearchProvider.search('a')

    // assert
    expect(items).toHaveLength(1)
    expect(items[0]?.id).toBe('tt1')
  })

  it('answers an empty list when OMDB has no Search key', async () => {
    // arrange
    fetchMock.mockResolvedValue(respond({ Response: 'False', Error: 'Movie not found!' }))

    // act
    const items = await omdbSearchProvider.search('nothing')

    // assert
    expect(items).toEqual([])
  })

  it('maps an "N/A" year to null', async () => {
    // arrange
    fetchMock.mockResolvedValue(respond({ Search: [{ imdbID: 'tt1', Title: 'No Year', Type: 'movie', Year: 'N/A' }] }))

    // act
    const items = await omdbSearchProvider.search('no-year')

    // assert
    expect(items[0]?.year).toBeNull()
  })
})

describe('omdbSearchProvider.getById', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('maps the details and strips fields it does not model', async () => {
    // arrange
    fetchMock.mockResolvedValue(
      respond({
        imdbID: 'tt7',
        Title: 'Detail Movie',
        Type: 'movie',
        Year: '2010',
        Poster: 'https://img.test/7.jpg',
        imdbRating: '8.1',
        Genre: 'Action',
        Language: 'English',
        Director: 'Someone',
        Metascore: '70',
        Ratings: [{ Source: 'Internet Movie Database', Value: '8.1/10' }],
        Response: 'True',
        Awards: 'Won something',
      }),
    )

    // act
    const details = await omdbSearchProvider.getById('tt7')

    // assert
    expect(requestedUrl().searchParams.get('i')).toBe('tt7')
    expect(details).toEqual({
      id: 'tt7',
      provider: 'omdb',
      title: 'Detail Movie',
      type: 'movie',
      poster: 'https://img.test/7.jpg',
      year: 2010,
      rating: 8.1,
      genre: 'Action',
      language: 'English',
      extra: { Director: 'Someone' },
    })
    expect(details.extra).not.toHaveProperty('Metascore')
    expect(details.extra).not.toHaveProperty('Ratings')
    expect(details.extra).not.toHaveProperty('Response')
    expect(details.extra).not.toHaveProperty('Awards')
  })

  it('maps empty metadata to null', async () => {
    // arrange
    fetchMock.mockResolvedValue(
      respond({
        imdbID: 'tt8',
        Title: 'Sparse Series',
        Type: 'series',
        Year: '2015',
        Poster: '',
        imdbRating: '',
        Genre: '',
        Language: '',
      }),
    )

    // act
    const details = await omdbSearchProvider.getById('tt8')

    // assert
    expect(details.poster).toBeNull()
    expect(details.rating).toBeNull()
    expect(details.genre).toBeNull()
    expect(details.language).toBeNull()
    expect(details.year).toBe(2015)
  })

  it('maps OMDB "N/A" placeholders to null', async () => {
    // arrange
    fetchMock.mockResolvedValue(
      respond({
        imdbID: 'tt9',
        Title: 'Placeholder Series',
        Type: 'series',
        Year: 'N/A',
        Poster: 'N/A',
        imdbRating: 'N/A',
        Genre: 'N/A',
        Language: 'N/A',
      }),
    )

    // act
    const details = await omdbSearchProvider.getById('tt9')

    // assert
    expect(details.year).toBeNull()
    expect(details.poster).toBeNull()
    expect(details.rating).toBeNull()
    expect(details.genre).toBeNull()
    expect(details.language).toBeNull()
  })

  it('rejects a type it cannot store', async () => {
    // arrange
    fetchMock.mockResolvedValue(respond({ imdbID: 'tt3', Title: 'An Episode', Type: 'episode', Year: '2001' }))

    // act
    const details = omdbSearchProvider.getById('tt3')

    // assert
    await expect(details).rejects.toBe('Bad type')
  })

  it('rejects a payload without a title', async () => {
    // arrange
    fetchMock.mockResolvedValue(respond({ imdbID: 'tt4', Type: 'movie', Year: '2001' }))

    // act
    const details = omdbSearchProvider.getById('tt4')

    // assert
    await expect(details).rejects.toThrow()
  })
})
