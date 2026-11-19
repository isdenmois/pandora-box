import { userRepository } from '@server/infra'

/**
 * A recommender is optional, but when present it must be a real user and must not be the same
 * account that created the row. The database foreign keys are declarative only, so this is the
 * enforced check.
 */
export async function isValidRecommender(
  recommendedBy: string | null | undefined,
  creatorId: string,
): Promise<boolean> {
  if (recommendedBy == null) {
    return true
  }

  if (recommendedBy === creatorId) {
    return false
  }

  return await userRepository.exists(recommendedBy)
}
