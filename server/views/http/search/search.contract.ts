import * as v from 'valibot'

// A path param has no default: it is either in the URL or the route does not match.
const provider = v.picklist(['omdb'])

export const searchParams = v.object({ provider })

export const searchQuery = v.object({
  q: v.pipe(v.string(), v.minLength(3)),
  type: v.optional(v.string()),
  year: v.optional(v.pipe(v.string(), v.transform(Number), v.number())),
})

export const searchByIdParams = v.object({
  provider,
  id: v.string(),
})
