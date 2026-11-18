import { describe, expect, it } from 'vitest'
import {
  contentTypeForExtension,
  extensionFromContentType,
  extensionFromUrl,
  isImageSource,
  isLocalPoster,
  normalizeExtension,
  parsePosterFileName,
  posterFileName,
  posterPath,
} from '../poster'

describe('normalizeExtension', () => {
  it('maps jpeg onto jpg', () => {
    expect(normalizeExtension('JPEG')).toBe('jpg')
    expect(normalizeExtension('.jpg')).toBe('jpg')
  })

  it('keeps supported formats and rejects everything else', () => {
    expect(normalizeExtension('png')).toBe('png')
    expect(normalizeExtension('webp')).toBe('webp')
    expect(normalizeExtension('avif')).toBe('avif')
    expect(normalizeExtension('svg')).toBeNull()
    expect(normalizeExtension('exe')).toBeNull()
    expect(normalizeExtension('')).toBeNull()
  })
})

describe('extensionFromContentType', () => {
  it('ignores parameters and case', () => {
    expect(extensionFromContentType('image/jpeg; charset=binary')).toBe('jpg')
    expect(extensionFromContentType('IMAGE/PNG')).toBe('png')
  })

  it('returns null for non-images and missing values', () => {
    expect(extensionFromContentType('text/html')).toBeNull()
    expect(extensionFromContentType(null)).toBeNull()
    expect(extensionFromContentType('')).toBeNull()
  })
})

describe('extensionFromUrl', () => {
  it('reads the extension from the path, not the query', () => {
    expect(extensionFromUrl('https://cdn/poster.webp?w=300')).toBe('webp')
    expect(extensionFromUrl('https://cdn/x/V1_SX300.jpg')).toBe('jpg')
  })

  it('normalizes jpeg and falls back to jpg', () => {
    expect(extensionFromUrl('https://cdn/poster.jpeg')).toBe('jpg')
    expect(extensionFromUrl('https://cdn/poster')).toBe('jpg')
    expect(extensionFromUrl('https://cdn/poster.svg')).toBe('jpg')
  })
})

describe('contentTypeForExtension', () => {
  it('never emits the unregistered image/jpg', () => {
    expect(contentTypeForExtension('jpg')).toBe('image/jpeg')
    expect(contentTypeForExtension('png')).toBe('image/png')
    expect(contentTypeForExtension('wat')).toBe('application/octet-stream')
  })
})

describe('isImageSource', () => {
  it('accepts http and https only', () => {
    expect(isImageSource('https://cdn/poster.jpg')).toBe(true)
    expect(isImageSource('http://cdn/poster.jpg')).toBe(true)
    expect(isImageSource('file:///etc/passwd')).toBe(false)
    expect(isImageSource('data:image/png;base64,AAAA')).toBe(false)
    expect(isImageSource('/images/movie-1.jpg')).toBe(false)
  })
})

describe('isLocalPoster', () => {
  it('recognizes the stored prefix', () => {
    expect(isLocalPoster('/images/movie-1.jpg')).toBe(true)
    expect(isLocalPoster('https://cdn/poster.jpg')).toBe(false)
  })
})

describe('posterFileName / posterPath', () => {
  it('names files per record and keeps the source extension', () => {
    expect(posterFileName('movie-1', 'webp')).toBe('movie-1.webp')
    expect(posterPath('movie-1', 'https://cdn/abc.png')).toBe('/images/movie-1.png')
  })
})

describe('parsePosterFileName', () => {
  it('splits a valid name', () => {
    expect(parsePosterFileName('movie-1.jpg')).toEqual({ id: 'movie-1', extension: 'jpg' })
    expect(parsePosterFileName('movie-1.jpeg')).toEqual({ id: 'movie-1', extension: 'jpg' })
  })

  it('rejects names without a known extension', () => {
    expect(parsePosterFileName('movie-1')).toBeNull()
    expect(parsePosterFileName('movie-1.exe')).toBeNull()
    expect(parsePosterFileName('.jpg')).toBeNull()
    expect(parsePosterFileName('movie-1.jpg.tmp')).toBeNull()
  })
})
