'use client'

import { ComponentType } from '@/types/page'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Plus,
  Type,
  FileText,
  List,
  Table,
  FileInput
} from 'lucide-react'

interface ComponentToolbarProps {
  onAddComponent: (type: ComponentType) => void
  disabled?: boolean
}

const componentTypes = [
  {
    type: ComponentType.Label,
    icon: Type,
    label: 'Label',
    description: 'Display text or data'
  },
  {
    type: ComponentType.Property,
    icon: FileText,
    label: 'Property',
    description: 'Show a property value'
  },
  {
    type: ComponentType.List,
    icon: List,
    label: 'List',
    description: 'Display query results as a list'
  },
  {
    type: ComponentType.Table,
    icon: Table,
    label: 'Table',
    description: 'Display query results in a table'
  },
  {
    type: ComponentType.Form,
    icon: FileInput,
    label: 'Form',
    description: 'Create or update data'
  }
]

export function ComponentToolbar({ onAddComponent, disabled }: ComponentToolbarProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="sm" variant="outline" disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          Add Component
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {componentTypes.map(({ type, icon: Icon, label, description }) => (
          <DropdownMenuItem
            key={type}
            onClick={() => onAddComponent(type)}
            className="flex items-start gap-3 p-3"
          >
            <Icon className="h-5 w-5 mt-0.5 text-muted-foreground" />
            <div className="flex-1">
              <div className="font-medium">{label}</div>
              <div className="text-xs text-muted-foreground">{description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}