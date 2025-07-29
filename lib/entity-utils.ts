import { PropertyType, Entity, Property } from '@/types/entity'

export function toCamelCase(str: string): string {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase()
    })
    .replace(/\s+/g, '')
}

export function parseDisplayString(displayString: string): string[] {
  const regex = /\{([^}]+)\}/g
  const placeholders: string[] = []
  let match
  
  while ((match = regex.exec(displayString)) !== null) {
    placeholders.push(match[1])
  }
  
  return placeholders
}

export function detectCycles(
  entities: Entity[],
  properties: Property[],
  sourceEntityId: string,
  targetEntityId: string
): boolean {
  // Build adjacency list
  const graph = new Map<string, Set<string>>()
  
  properties
    .filter(p => p.property_type === PropertyType.Entity && p.referenced_entity_id && !p.is_deleted)
    .forEach(p => {
      if (!graph.has(p.entity_id)) {
        graph.set(p.entity_id, new Set())
      }
      graph.get(p.entity_id)!.add(p.referenced_entity_id!)
    })
  
  // Add the proposed edge
  if (!graph.has(sourceEntityId)) {
    graph.set(sourceEntityId, new Set())
  }
  graph.get(sourceEntityId)!.add(targetEntityId)
  
  // Check for cycles using DFS
  const visited = new Set<string>()
  const recursionStack = new Set<string>()
  
  function hasCycle(entityId: string): boolean {
    visited.add(entityId)
    recursionStack.add(entityId)
    
    const neighbors = graph.get(entityId) || new Set()
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (hasCycle(neighbor)) {
          return true
        }
      } else if (recursionStack.has(neighbor)) {
        return true
      }
    }
    
    recursionStack.delete(entityId)
    return false
  }
  
  // Check all entities
  for (const entity of entities) {
    if (!entity.is_deleted && !visited.has(entity.id)) {
      if (hasCycle(entity.id)) {
        return true
      }
    }
  }
  
  return false
}

export function validatePropertyType(value: string | null | undefined, type: PropertyType): boolean {
  if (!value) return true // null/empty values are valid
  
  switch (type) {
    case PropertyType.String:
      return true
      
    case PropertyType.Number:
      return !isNaN(Number(value))
      
    case PropertyType.Boolean:
      return value === 'true' || value === 'false'
      
    case PropertyType.Date:
      // YYYY-MM-DD format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      return dateRegex.test(value) && !isNaN(Date.parse(value))
      
    case PropertyType.DateTime:
      // ISO 8601 format
      return !isNaN(Date.parse(value))
      
    case PropertyType.Time:
      // HH:MM:SS or HH:MM format
      const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/
      return timeRegex.test(value)
      
    case PropertyType.Entity:
      // Entity values should be UUIDs
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      return uuidRegex.test(value)
      
    default:
      return false
  }
}