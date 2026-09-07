import { Navigate } from 'react-router-dom'

import { useAuth } from '@/auth/AuthContext'
import { LoadingState } from '@/components/QueryState'
import { LandingPage } from '@/pages/marketing/LandingPage'

/**
 * Gate for "/" — mirrors the exact auth-redirect pattern LoginPage already
 * uses for itself: an already-authenticated visitor goes straight to
 * /dashboard, everyone else sees the public marketing page. Kept separate
 * from LandingPage so that component stays a pure, auth-agnostic
 * presentational page.
 */
export function HomeRoute() {
  const { user, isBootstrapping } = useAuth()

  if (isBootstrapping) return <LoadingState label="Loading..." />
  if (user) return <Navigate to="/dashboard" replace />
  return <LandingPage />
}
