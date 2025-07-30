'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { Entity } from '@/types/entity'
import { formatDate } from '@/lib/date-utils'

interface EntityTableProps {
  entities: (Entity & { property_count: number })[]
  onEdit: (entity: Entity) => void
  onDelete: (entity: Entity) => void
}

export function EntityTable({ entities, onEdit, onDelete }: EntityTableProps) {
  if (entities.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No entities yet. Create your first entity to get started.</p>
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Display String</TableHead>
          <TableHead>Properties</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {entities.map((entity) => (
          <TableRow 
            key={entity.id} 
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => onEdit(entity)}
          >
            <TableCell className="font-medium">{entity.name}</TableCell>
            <TableCell className="text-muted-foreground">{entity.display_string}</TableCell>
            <TableCell>{entity.property_count}</TableCell>
            <TableCell>{formatDate(entity.created_at)}</TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(entity)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => onDelete(entity)}
                    className="text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}