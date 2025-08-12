import { ApplicationSidebar } from '@/components/layout/application-sidebar'
import { Header } from '@/components/layout/header'

export default function ApplicationLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      {/* Left Sidebar */}
      <aside className="w-64 border-r bg-background">
        <ApplicationSidebar />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}