'use client'

import { use } from 'react'
import { useSearchParams } from 'next/navigation'
import { useProjectContext } from '@/app/providers/project-provider'
import { usePage } from '@/hooks/use-pages'
import { useContainers } from '@/hooks/use-containers'
import { useQuery } from '@tanstack/react-query'
import { Breadcrumb } from '@/components/layout/breadcrumb'
import { DynamicPageViewer } from '@/components/page-builder/dynamic-page-viewer'
import { validatePageParameters, PageParameter } from '@/lib/page-parameters'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function DynamicApplicationPage({
  params
}: {
  params: Promise<{ id: string; pageIds: string[] }>
}) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const { currentProject } = useProjectContext()
  
  // Get the current page ID (last in the array for nested pages)
  const currentPageId = resolvedParams.pageIds[resolvedParams.pageIds.length - 1]
  
  // Fetch page data
  const { data: page, isLoading: pageLoading } = usePage(
    resolvedParams.id, 
    currentPageId
  )
  
  // Fetch containers for the page
  const { data: containers, isLoading: containersLoading } = useContainers(
    resolvedParams.id,
    currentPageId
  )
  
  // Fetch page parameters
  const { data: parameters, isLoading: parametersLoading } = useQuery({
    queryKey: ['page-parameters', currentPageId],
    queryFn: async () => {
      const response = await fetch(
        `/api/projects/${resolvedParams.id}/pages/${currentPageId}/parameters`
      )
      if (!response.ok) {
        throw new Error('Failed to fetch page parameters')
      }
      return response.json() as Promise<PageParameter[]>
    },
    enabled: !!currentPageId,
  })
  
  // Build breadcrumb trail
  const { data: breadcrumbItems } = useQuery({
    queryKey: ['page-breadcrumb', resolvedParams.pageIds],
    queryFn: async () => {
      const items = []
      let path = `/projects/${resolvedParams.id}/app`
      
      for (const pageId of resolvedParams.pageIds) {
        const response = await fetch(
          `/api/projects/${resolvedParams.id}/pages/${pageId}`
        )
        if (response.ok) {
          const pageData = await response.json()
          path += `/${pageId}`
          items.push({
            id: pageId,
            name: pageData.name,
            href: path,
            template: pageData.breadcrumb_template
          })
        }
      }
      
      return items
    },
    enabled: resolvedParams.pageIds.length > 0,
  })
  
  if (!currentProject) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading application...</p>
        </div>
      </div>
    )
  }
  
  if (pageLoading || containersLoading || parametersLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Loading page...</p>
      </div>
    )
  }
  
  if (!page) {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Page not found</AlertTitle>
          <AlertDescription>
            The requested page could not be found.
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  // Validate page parameters
  const validation = parameters 
    ? validatePageParameters(parameters, searchParams)
    : { isValid: true, errors: {}, values: {} }
  
  if (!validation.isValid) {
    return (
      <div className="p-6 space-y-4">
        {breadcrumbItems && (
          <Breadcrumb items={breadcrumbItems} projectId={resolvedParams.id} />
        )}
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Missing or Invalid Parameters</AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-1">
              {Object.entries(validation.errors).map(([param, error]) => (
                <div key={param} className="text-sm">
                  • {error}
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }
  
  return (
    <div className="flex flex-col h-full">
      {/* Breadcrumb */}
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <div className="border-b px-6 py-3">
          <Breadcrumb items={breadcrumbItems} projectId={resolvedParams.id} />
        </div>
      )}
      
      {/* Page Content */}
      <div className="flex-1 overflow-y-auto">
        <DynamicPageViewer
          pageId={currentPageId}
          pageName={page.name}
          containers={containers || []}
          projectId={resolvedParams.id}
          urlParameters={validation.values}
        />
      </div>
    </div>
  )
}