import { useAuth } from './auth-state'

export function authGuard() {
  const { user } = useAuth()

  return user?.role === 'admin'
}
