import { describe, expect, it } from 'vitest'
import { canAccess, claimedCreator } from '../access'

const global = { createdBy: 'owner', private: false }
const priv = { createdBy: 'owner', private: true }

describe('canAccess', () => {
  it('lets anyone read a global row', () => {
    expect(canAccess(global, 'someone')).toBe(true)
    expect(canAccess(global, 'owner')).toBe(true)
  })

  it('lets only the creator read a private row', () => {
    expect(canAccess(priv, 'owner')).toBe(true)
    expect(canAccess(priv, 'someone')).toBe(false)
  })

  it('has no admin special case', () => {
    // The rule only knows a user id; admin overrides live in the backup/import tools, not here.
    expect(canAccess(priv, 'admin')).toBe(false)
  })
})

describe('claimedCreator', () => {
  it('transfers a global row when another user makes it private', () => {
    expect(claimedCreator(global, true, 'claimer')).toBe('claimer')
  })

  it('does not transfer when the creator makes their own row private', () => {
    expect(claimedCreator(global, true, 'owner')).toBeNull()
  })

  it('does not transfer an already-private row', () => {
    expect(claimedCreator(priv, true, 'claimer')).toBeNull()
  })

  it('does not transfer unless the patch explicitly sets private', () => {
    expect(claimedCreator(global, undefined, 'claimer')).toBeNull()
    expect(claimedCreator(global, false, 'claimer')).toBeNull()
  })
})
