import { describe, expect, it } from 'vitest'
import { POSTER_ACCEPT, POSTER_MAX_BYTES, posterFileError } from '../poster'

const asFile = (type: string, size: number) => ({ type, size }) as File

describe('posterFileError', () => {
  it('accepts exactly the formats the server can write', () => {
    expect(POSTER_ACCEPT.split(',')).toEqual(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
  })

  it('accepts an allowed type at the size cap', () => {
    expect(posterFileError(asFile('image/png', POSTER_MAX_BYTES))).toBeNull()
  })

  it('rejects a type the server cannot store', () => {
    expect(posterFileError(asFile('image/tiff', 1024))).toBe('Choose a JPEG, PNG, WebP, GIF or AVIF image')
  })

  it('leaves an unlabelled file to the server', () => {
    expect(posterFileError(asFile('', 1024))).toBeNull()
  })

  it('rejects a file over the size cap', () => {
    expect(posterFileError(asFile('image/png', POSTER_MAX_BYTES + 1))).toBe('The image must be 5 MB or smaller')
  })
})
