'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user) {
      router.push('/projects')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    return null
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Blueprint!</h1>
        <p className="mb-6 text-muted-foreground">
          Build custom data management applications without coding
        </p>
        <div className="space-x-4">
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/signup">Sign up</Link>
          </Button>
        </div>
      </div>
    </main>
  )
}