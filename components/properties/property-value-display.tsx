'use client'

import { PropertyType } from '@/types/entity'
import { formatDate, formatDateTime, formatTime } from '@/lib/date-utils'

interface PropertyValueDisplayProps {
  type: PropertyType
  value: string | null | undefined
}

export function PropertyValueDisplay({ type, value }: PropertyValueDisplayProps) {
  if (!value) {
    return <span className="text-muted-foreground">-</span>
  }

  switch (type) {
    case PropertyType.Date:
      return <span>{formatDate(value)}</span>
    
    case PropertyType.DateTime:
      return <span>{formatDateTime(value)}</span>
    
    case PropertyType.Time:
      return <span>{formatTime(value)}</span>
    
    case PropertyType.Boolean:
      return <span>{value === 'true' ? 'Yes' : 'No'}</span>
    
    default:
      return <span>{value}</span>
  }
}