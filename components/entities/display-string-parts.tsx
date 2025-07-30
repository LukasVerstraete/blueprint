'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Property, PropertyType } from '@/types/entity'
import { Plus, X } from 'lucide-react'

type DisplayStringPart = {
  id: string
  type: 'string' | 'property'
  value: string
}

interface DisplayStringPartsProps {
  value: string
  onChange: (value: string) => void
  properties: Property[]
  onSave: () => void
}

export function DisplayStringParts({ value, onChange, properties, onSave }: DisplayStringPartsProps) {
  const [parts, setParts] = useState<DisplayStringPart[]>([])
  const [editingPart, setEditingPart] = useState<string | null>(null)

  // Filter out entity type properties
  const availableProperties = properties.filter(p => p.property_type !== PropertyType.Entity && !p.is_deleted)

  // Parse display string into parts
  useEffect(() => {
    const parsedParts: DisplayStringPart[] = []
    const regex = /\{([^}]+)\}|([^{]+)/g
    let match
    let id = 0

    while ((match = regex.exec(value)) !== null) {
      if (match[1]) {
        // Property placeholder
        parsedParts.push({
          id: `part-${id++}`,
          type: 'property',
          value: match[1]
        })
      } else if (match[2]) {
        // String literal
        parsedParts.push({
          id: `part-${id++}`,
          type: 'string',
          value: match[2]
        })
      }
    }

    setParts(parsedParts)
  }, [value])

  // Convert parts back to display string
  const updateDisplayString = (updatedParts: DisplayStringPart[]) => {
    const displayString = updatedParts
      .map(part => part.type === 'property' ? `{${part.value}}` : part.value)
      .join('')
    onChange(displayString)
  }

  const addPart = (type: 'string' | 'property') => {
    const newPart: DisplayStringPart = {
      id: `part-${Date.now()}`,
      type,
      value: type === 'property' && availableProperties.length > 0 ? availableProperties[0].property_name : ''
    }
    const newParts = [...parts, newPart]
    setParts(newParts)
    updateDisplayString(newParts)
    setEditingPart(newPart.id)
  }

  const updatePart = (id: string, value: string) => {
    const newParts = parts.map(part => 
      part.id === id ? { ...part, value } : part
    )
    setParts(newParts)
    updateDisplayString(newParts)
  }

  const removePart = (id: string) => {
    const newParts = parts.filter(part => part.id !== id)
    setParts(newParts)
    updateDisplayString(newParts)
  }

  return (
    <div className="space-y-2">
      {parts.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-4 text-center">
          <p className="text-sm text-muted-foreground mb-2">
            No display string template defined. Add text or property placeholders to create a template.
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Plus className="h-3 w-3 mr-1" />
                Add Part
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={() => addPart('string')}>
                Add Text
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => addPart('property')}
                disabled={availableProperties.length === 0}
              >
                Add Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          {parts.map((part) => (
            <div key={part.id} className="flex items-center gap-1 bg-muted rounded px-2 py-1">
              {editingPart === part.id ? (
                <>
                  {part.type === 'string' ? (
                    <Input
                      value={part.value}
                      onChange={(e) => updatePart(part.id, e.target.value)}
                      onBlur={() => setEditingPart(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === 'Escape') {
                          setEditingPart(null)
                        }
                      }}
                      className="h-7 w-32"
                      placeholder="Text"
                      autoFocus
                    />
                  ) : (
                    <Select
                      value={part.value}
                      onValueChange={(value) => {
                        updatePart(part.id, value)
                        setEditingPart(null)
                      }}
                    >
                      <SelectTrigger className="h-7 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableProperties.map((property) => (
                          <SelectItem key={property.id} value={property.property_name}>
                            {property.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </>
              ) : (
                <span
                  className="cursor-pointer hover:underline text-sm"
                  onClick={() => setEditingPart(part.id)}
                >
                  {part.type === 'string' ? (part.value || '(empty)') : (
                    <span className="font-mono">{part.value}</span>
                  )}
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => removePart(part.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => addPart('string')}>
                Add Text
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => addPart('property')}
                disabled={availableProperties.length === 0}
              >
                Add Property
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      <div className="flex items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Result: {value || '(empty)'}
        </p>
        <Button
          size="sm"
          variant="outline"
          onClick={onSave}
          className="ml-auto"
        >
          Save Display String
        </Button>
      </div>
    </div>
  )
}