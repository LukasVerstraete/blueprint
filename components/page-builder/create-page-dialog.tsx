'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProjectContext } from '@/app/providers/project-provider'
import { useCreatePage, usePages } from '@/hooks/use-pages'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { PageWithChildren } from '@/types/page'

export function CreatePageDialog() {
  const router = useRouter()
  const { currentProject } = useProjectContext()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [parentPageId, setParentPageId] = useState<string | null>(null)
  const [breadcrumbTemplate, setBreadcrumbTemplate] = useState('')
  
  const { data: pages } = usePages(currentProject?.id || '')
  const createPage = useCreatePage(currentProject?.id || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Page name is required')
      return
    }

    try {
      const newPage = await createPage.mutateAsync({
        name,
        parent_page_id: parentPageId,
        breadcrumb_template: breadcrumbTemplate || null
      })
      
      toast.success('Page created successfully')
      setOpen(false)
      setName('')
      setParentPageId(null)
      setBreadcrumbTemplate('')
      
      // Navigate to edit the new page
      router.push(`/projects/${currentProject?.id}/pages/${newPage.id}`)
    } catch {
      // Error is already handled in the hook
    }
  }

  // Flatten pages hierarchy for parent selection
  const flattenPages = (pages: PageWithChildren[], level = 0): { page: PageWithChildren; level: number }[] => {
    const result: { page: PageWithChildren; level: number }[] = []
    
    pages.forEach(page => {
      result.push({ page, level })
      if (page.children && page.children.length > 0) {
        result.push(...flattenPages(page.children, level + 1))
      }
    })
    
    return result
  }

  const flatPages = pages ? flattenPages(pages) : []

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Page
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Page</DialogTitle>
            <DialogDescription>
              Add a new page to your project. Pages can contain components and have subpages.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Dashboard, Customer List"
                autoFocus
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Page (Optional)</Label>
              <Select value={parentPageId || 'none'} onValueChange={(value) => setParentPageId(value === 'none' ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select parent page..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No parent (top-level page)</SelectItem>
                  {flatPages.map(({ page, level }) => (
                    <SelectItem key={page.id} value={page.id}>
                      {'  '.repeat(level)}{page.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="breadcrumb">Breadcrumb Template (Optional)</Label>
              <Input
                id="breadcrumb"
                value={breadcrumbTemplate}
                onChange={(e) => setBreadcrumbTemplate(e.target.value)}
                placeholder="e.g., Customer: {customerName}"
              />
              <p className="text-xs text-muted-foreground">
                Use placeholders like {'{parameterName}'} for dynamic breadcrumbs
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createPage.isPending}>
              {createPage.isPending ? 'Creating...' : 'Create Page'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}