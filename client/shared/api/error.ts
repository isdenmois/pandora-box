import type { ErrorBody, ErrorCode, ErrorDetails } from '@server/views/http/error'

/** Thrown by `unwrap`/`ensure`, so pages keep their `try/catch` + `getMessage` shape. */
export class ApiError extends Error {
  readonly code: ErrorCode
  readonly status: number
  readonly details: ErrorDetails[] | undefined

  constructor(code: ErrorCode, message: string, status: number, details?: ErrorDetails[]) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

export interface HttpResponseLike {
  ok: boolean
  status: number
  json(): Promise<unknown>
  blob(): Promise<Blob>
}

/** A proxy or an empty body may not be JSON; the status still has to reach the caller. */
export async function apiError(response: HttpResponseLike): Promise<ApiError> {
  let body: ErrorBody | null = null

  try {
    body = (await response.json()) as ErrorBody
  } catch {
    body = null
  }

  const error = body && typeof body === 'object' && 'error' in body ? body.error : null

  return new ApiError(
    error?.code ?? 'internal',
    error?.message ?? `Request failed with ${response.status}`,
    response.status,
    error?.details,
  )
}
