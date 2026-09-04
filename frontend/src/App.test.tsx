import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import { AuthProvider } from '@/auth/AuthContext'

import App from './App'

vi.mock('@/lib/api-client', () => ({
  apiClient: {
    GET: vi.fn().mockResolvedValue({ error: { detail: 'not authenticated' } }),
    POST: vi.fn().mockResolvedValue({ error: { detail: 'no session' } }),
    PATCH: vi.fn().mockResolvedValue({ error: { detail: 'not authenticated' } }),
  },
  setAccessToken: vi.fn(),
  getAccessToken: vi.fn(() => null),
  setRefreshHandler: vi.fn(),
  apiOrigin: 'http://localhost:8000',
}))

function renderApp() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('App', () => {
  it('redirects an unauthenticated visitor to the login page', async () => {
    renderApp()

    await waitFor(() => {
      expect(screen.getByText(/sign in to obliTrack/i)).toBeInTheDocument()
    })
  })
})
