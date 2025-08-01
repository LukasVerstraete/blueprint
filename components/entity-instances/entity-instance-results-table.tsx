'use client'

import React from 'react'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatDisplayValue } from '@/lib/entity-instance-utils'
import { resolveDisplayString } from '@/lib/display-string-utils'
import { EntityInstanceWithProperties } from '@/types/entity-instance'
import { EntityWithProperties, Property } from '@/types/entity'

interface EntityInstanceResultsTableProps {
  instances: EntityInstanceWithProperties[]
  entity: EntityWithProperties
  properties: Property[]
}

export function EntityInstanceResultsTable({ 
  instances, 
  entity, 
  properties 
}: EntityInstanceResultsTableProps) {
  if (!instances || instances.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No results found
      </div>
    )
  }

  // Filter to non-deleted properties and sort by sort_order
  const visibleProperties = properties
    .filter(p => !p.is_deleted)
    .sort((a, b) => a.sort_order - b.sort_order)

  return (
    <div className="border rounded-md">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Display</TableHead>
            {visibleProperties.map((property) => (
              <TableHead key={property.id} className="font-semibold">
                {property.name}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {instances.map((instance) => {
            const displayString = instance._displayString || 
              resolveDisplayString(instance, properties, entity.display_string || '')
            
            return (
              <TableRow key={instance.id}>
                <TableCell className="font-medium">
                  {displayString}
                </TableCell>
                {visibleProperties.map((property) => (
                  <TableCell key={property.id}>
                    {formatDisplayValue(
                      instance.properties[property.property_name], 
                      property.property_type
                    ) || '-'}
                  </TableCell>
                ))}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}