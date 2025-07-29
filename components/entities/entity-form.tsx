'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Entity, CreateEntityInput } from '@/types/entity'

interface EntityFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entity?: Entity | null
  onSubmit: (data: CreateEntityInput) => void
  isLoading?: boolean
}

export function EntityForm({ open, onOpenChange, entity, onSubmit, isLoading }: EntityFormProps) {
  const [name, setName] = useState(entity?.name || '')
  const [displayString, setDisplayString] = useState(entity?.display_string || '')
  const [errors, setErrors] = useState<{ name?: string; displayString?: string }>({})

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate
    const newErrors: typeof errors = {}
    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!displayString.trim()) {
      newErrors.displayString = 'Display string is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      name: name.trim(),
      display_string: displayString.trim()
    })
  }

  const handleClose = () => {
    setName('')
    setDisplayString('')
    setErrors({})
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{entity ? 'Edit Entity' : 'Create Entity'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Customer"
                className={errors.name ? 'border-destructive' : ''}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="displayString">Display String</Label>
              <Input
                id="displayString"
                value={displayString}
                onChange={(e) => setDisplayString(e.target.value)}
                placeholder="{firstName} {lastName}"
                className={errors.displayString ? 'border-destructive' : ''}
              />
              {errors.displayString && (
                <p className="text-sm text-destructive">{errors.displayString}</p>
              )}
              <p className="text-sm text-muted-foreground">
                Use curly braces for property placeholders
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Saving...' : entity ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}