import type { User } from '../../client/shared/api'

export type { User }

export const adminUser: User = {
  id: 'user-1',
  username: 'admin',
  role: 'admin',
}
