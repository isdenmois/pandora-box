import { describe, expect, it } from 'vitest'
import { withPlainPrototypes } from '../plain-body'

function nullProto(value: Record<string, unknown>) {
  return Object.assign(Object.create(null), value)
}

describe('withPlainPrototypes', () => {
  it('restores the standard prototype on a plain object body', () => {
    // arrange
    const body = nullProto({ title: 'A Movie' })

    // act
    withPlainPrototypes(body)

    // assert
    expect(Object.getPrototypeOf(body)).toBe(Object.prototype)
  })

  it('restores nested objects and objects inside arrays', () => {
    // arrange
    const body = nullProto({
      extra: nullProto({ Actors: 'Someone' }),
      rows: [nullProto({ id: '1' }), nullProto({ id: '2' })],
    })

    // act
    withPlainPrototypes(body)

    // assert
    expect(Object.getPrototypeOf(body.extra)).toBe(Object.prototype)
    for (const row of body.rows) {
      expect(Object.getPrototypeOf(row)).toBe(Object.prototype)
    }
  })

  it('walks into plain objects that already carry a prototype', () => {
    // arrange
    // The multipart body wraps a pre-parsed JSON part: a normal object holding null-proto ones.
    const body = { data: nullProto({ title: 'A Movie' }) }

    // act
    withPlainPrototypes(body)

    // assert
    expect(Object.getPrototypeOf(body.data)).toBe(Object.prototype)
  })

  it('leaves non-plain values alone and passes primitives through', () => {
    // arrange
    const file = new File(['x'], 'poster.png')
    const date = new Date(0)
    const bytes = new Uint8Array([1, 2, 3])
    const body = nullProto({ file, date, bytes, title: 'A Movie', year: null })

    // act
    withPlainPrototypes(body)

    // assert
    expect(body.file).toBe(file)
    expect(body.date).toBe(date)
    expect(body.bytes).toBe(bytes)
    expect(withPlainPrototypes(null)).toBeNull()
    expect(withPlainPrototypes('text')).toBe('text')
  })
})
