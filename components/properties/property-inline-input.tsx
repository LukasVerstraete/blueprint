'use client'

import { Input } from '@/components/ui/input'
import { PropertyType } from '@/types/entity'
import { FormattedDateInput } from './formatted-date-input'

interface PropertyInlineInputProps {
  type: PropertyType
  value: any
  onChange: (value: any) => void
  onKeyDown?: (e: React.KeyboardEvent) => void
  autoFocus?: boolean
}

export function PropertyInlineInput({ 
  type, 
  value, 
  onChange, 
  onKeyDown,
  autoFocus 
}: PropertyInlineInputProps) {
  const inputClassName = "h-8"

  switch (type) {
    case PropertyType.Date:
    case PropertyType.DateTime:
    case PropertyType.Time:
      return (
        <FormattedDateInput
          type={type}
          value={value}
          onChange={onChange}
          className={inputClassName}
          onKeyDown={onKeyDown}
        />
      )

    default:
      return (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          className={inputClassName}
          autoFocus={autoFocus}
        />
      )
  }
}