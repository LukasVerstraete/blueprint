'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { signOut } from '@/utils/supabase/auth'
import { toast } from 'sonner'

export default function Home() {
  const { user, loading } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    const result = await signOut()
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Logged out successfully')
      router.push('/login')
    }
  }

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

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to Blueprint!</h1>
        {user ? (
          <div>
            <p className="mb-6 text-muted-foreground">
              Logged in as: <span className="font-semibold">{user.email}</span>
            </p>
            <Button onClick={handleSignOut}>
              Sign out
            </Button>
          </div>
        ) : (
          <div>
            <p className="mb-6 text-muted-foreground">
              You are not logged in
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
        )}
      </div>
    </main>
  )
}