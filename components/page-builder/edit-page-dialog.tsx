'use client'

import { useState, useEffect } from 'react'
import { useProjectContext } from '@/app/providers/project-provider'
import { useUpdatePage, usePages } from '@/hooks/use-pages'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from 'sonner'
import { Page, PageWithChildren } from '@/types/page'

interface EditPageDialogProps {
  page: Page
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EditPageDialog({ page, open, onOpenChange }: EditPageDialogProps) {
  const { currentProject } = useProjectContext()
  const [name, setName] = useState(page.name)
  const [parentPageId, setParentPageId] = useState<string | null>(page.parent_page_id)
  const [breadcrumbTemplate, setBreadcrumbTemplate] = useState(page.breadcrumb_template || '')
  
  const { data: pages } = usePages(currentProject?.id || '')
  const updatePage = useUpdatePage(currentProject?.id || '', page.id)

  useEffect(() => {
    setName(page.name)
    setParentPageId(page.parent_page_id)
    setBreadcrumbTemplate(page.breadcrumb_template || '')
  }, [page])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!name.trim()) {
      toast.error('Page name is required')
      return
    }

    try {
      await updatePage.mutateAsync({
        name,
        parent_page_id: parentPageId,
        breadcrumb_template: breadcrumbTemplate || null
      })
      
      toast.success('Page updated successfully')
      onOpenChange(false)
    } catch {
      // Error is already handled in the hook
    }
  }

  // Flatten pages hierarchy for parent selection, excluding current page and its descendants
  const flattenPages = (pages: PageWithChildren[], excludeId: string, level = 0): { page: PageWithChildren; level: number }[] => {
    const result: { page: PageWithChildren; level: number }[] = []
    
    pages.forEach(page => {
      if (page.id !== excludeId && !isDescendant(page, excludeId, pages)) {
        result.push({ page, level })
        if (page.children && page.children.length > 0) {
          result.push(...flattenPages(page.children, excludeId, level + 1))
        }
      }
    })
    
    return result
  }

  // Check if a page is a descendant of another page
  const isDescendant = (page: PageWithChildren, ancestorId: string, allPages: PageWithChildren[]): boolean => {
    if (!page.parent_page_id) return false
    if (page.parent_page_id === ancestorId) return true
    
    const parent = findPageById(allPages, page.parent_page_id)
    return parent ? isDescendant(parent, ancestorId, allPages) : false
  }

  const findPageById = (pages: PageWithChildren[], id: string): PageWithChildren | null => {
    for (const page of pages) {
      if (page.id === id) return page
      if (page.children) {
        const found = findPageById(page.children, id)
        if (found) return found
      }
    }
    return null
  }

  const flatPages = pages ? flattenPages(pages, page.id) : []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Page</DialogTitle>
            <DialogDescription>
              Update the page details and hierarchy.
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
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="parent">Parent Page</Label>
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
              <Label htmlFor="breadcrumb">Breadcrumb Template</Label>
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={updatePage.isPending}>
              {updatePage.isPending ? 'Updating...' : 'Update Page'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}