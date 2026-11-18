import { offsiteConfigured, offsiteRepository } from '@/infra'

/** Newest first; `null` means the feature has no credentials, which the routes answer 503 for. */
export async function list(): Promise<string[] | null> {
  if (!offsiteConfigured) {
    return null
  }

  return await offsiteRepository.list()
}
