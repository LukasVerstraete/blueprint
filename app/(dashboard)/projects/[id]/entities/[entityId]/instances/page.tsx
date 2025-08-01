import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { EntityInstanceTable } from '@/components/entity-instances/entity-instance-table'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{
    id: string
    entityId: string
  }>
}

export default async function EntityInstancesPage({ params }: PageProps) {
  const { id: projectId, entityId } = await params

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="mb-4"
        >
          <Link href={`/projects/${projectId}/entities/${entityId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Entity
          </Link>
        </Button>
        
        <h1 className="text-3xl font-bold">Entity Instances</h1>
      </div>

      <EntityInstanceTable />
    </div>
  )
}