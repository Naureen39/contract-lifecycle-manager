import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface State {
  error: Error | null
}

/**
 * Top-level safety net — without this, any uncaught render-time error
 * anywhere in the tree unmounts the entire app to a blank white page
 * (React's default behavior for an error with no boundary above it).
 * Catches it instead and offers a reload, rather than leaving the user
 * looking at nothing with no way to tell what happened.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
          <p className="text-lg font-semibold">Something went wrong.</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            This page hit an unexpected error. Reloading usually fixes it. If it keeps
            happening, please let us know what you were doing.
          </p>
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" />
            Reload
          </Button>
        </div>
      )
    }
    return this.props.children
  }
}
