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
  FileInput,
  Layers
} from 'lucide-react'
import { LucideIcon } from 'lucide-react'

interface UnifiedElementToolbarProps {
  onSelect: (type: 'container' | ComponentType) => void
  disabled?: boolean
  compact?: boolean
}

interface ElementOption {
  type: 'container' | ComponentType
  icon: LucideIcon
  label: string
  description: string
}

const elementOptions: ElementOption[] = [
  {
    type: 'container',
    icon: Layers,
    label: 'Container',
    description: 'Layout container for organizing elements'
  },
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

export function UnifiedElementToolbar({ onSelect, disabled, compact }: UnifiedElementToolbarProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          size={compact ? "sm" : "default"} 
          variant="outline" 
          disabled={disabled}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Element
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        {elementOptions.map(({ type, icon: Icon, label, description }) => (
          <DropdownMenuItem
            key={type}
            onClick={() => onSelect(type)}
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