import type { Metadata } from 'next'
import { Toaster } from '@/components/ui/sonner'
import { AuthProvider } from '@/app/providers/auth-provider'
import { QueryProvider } from '@/app/providers/query-provider'
import './globals.css'

export const metadata: Metadata = {
  title: 'Blueprint',
  description: 'Next.js application with Tailwind CSS and shadcn/ui',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </QueryProvider>
        <Toaster />
      </body>
    </html>
  )
}