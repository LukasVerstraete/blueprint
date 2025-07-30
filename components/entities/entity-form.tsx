'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Entity, CreateEntityInput, Property } from '@/types/entity'
import { DisplayStringBuilder } from './display-string-builder'

interface EntityFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  entity?: Entity | null
  properties?: Property[]
  onSubmit: (data: CreateEntityInput) => void
  isLoading?: boolean
}

export function EntityForm({ open, onOpenChange, entity, properties = [], onSubmit, isLoading }: EntityFormProps) {
  const [name, setName] = useState(entity?.name || '')
  const [displayString, setDisplayString] = useState(entity?.display_string || '')
  const [errors, setErrors] = useState<{ name?: string; displayString?: string }>({})

  useEffect(() => {
    if (entity) {
      setName(entity.name)
      setDisplayString(entity.display_string)
    } else {
      setName('')
      setDisplayString('')
    }
  }, [entity])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    // Validate
    const newErrors: typeof errors = {}
    if (!name.trim()) {
      newErrors.name = 'Name is required'
    }
    // Only validate display string for editing existing entities
    if (entity && !displayString.trim()) {
      newErrors.displayString = 'Display string is required'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onSubmit({
      name: name.trim(),
      display_string: entity ? displayString.trim() : '{id}' // Default to {id} for new entities
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
            {entity && (
              <div className="grid gap-2">
                <DisplayStringBuilder
                  value={displayString}
                  onChange={setDisplayString}
                  properties={properties}
                />
                {errors.displayString && (
                  <p className="text-sm text-destructive">{errors.displayString}</p>
                )}
              </div>
            )}
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