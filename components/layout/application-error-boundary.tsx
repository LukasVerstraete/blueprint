'use client'

import { useEffect } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ApplicationErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription className="mt-2">
            {error.message || 'An unexpected error occurred while loading this page.'}
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-4">
          <Button onClick={reset} className="flex-1">
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()}
            className="flex-1"
          >
            Go back
          </Button>
        </div>
        
        {error.digest && (
          <p className="text-xs text-muted-foreground text-center">
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}