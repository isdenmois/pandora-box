import { Elysia } from 'elysia'

/**
 * Elysia hardens parsed bodies against prototype pollution by cloning plain objects with
 * `Object.create(null)`. Those objects then reach the repositories, and drizzle's entity check
 * walks `Object.getPrototypeOf(value).constructor` — which throws on a null-prototype object, so
 * every create with a nested object (`extra`) answered 500. One boundary pass restores the
 * standard prototype before any handler runs, which covers every route, including restore and
 * import payloads. The multipart `data` part is parsed by `parseJsonPart` outside this transform,
 * but its schemas are flat (scalars and a string array), so no plain object can reach drizzle
 * from there.
 *
 * The hook runs after validation: Elysia rebuilds the body while validating, so a transform-stage
 * fix is undone before the handler sees it.
 */
export function withPlainPrototypes(value: unknown): unknown {
  if (value === null || typeof value !== 'object') {
    return value
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      withPlainPrototypes(item)
    }

    return value
  }

  // Only plain objects are walked; File, Date and typed arrays are left alone.
  const prototype = Object.getPrototypeOf(value)

  if (prototype === Object.prototype || prototype === null) {
    if (prototype === null) {
      Object.setPrototypeOf(value, Object.prototype)
    }

    for (const child of Object.values(value)) {
      withPlainPrototypes(child)
    }
  }

  return value
}

export const plainBody = new Elysia({ name: 'plain body' }).onBeforeHandle({ as: 'global' }, ({ body }) => {
  withPlainPrototypes(body)
})
