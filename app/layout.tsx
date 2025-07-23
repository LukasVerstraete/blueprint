import type { Metadata } from 'next'
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
      <body>{children}</body>
    </html>
  )
}