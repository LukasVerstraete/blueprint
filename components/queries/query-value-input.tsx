'use client'

import { PropertyType } from '@/types/entity'
import { QueryOperator } from '@/types/query'
import { Input } from '@/components/ui/input'
import { FormattedDateInput } from '@/components/properties/formatted-date-input'

interface QueryValueInputProps {
  value: string | null
  onChange: (value: string | null) => void
  propertyType: PropertyType
  operator: QueryOperator
}

export function QueryValueInput({ 
  value, 
  onChange, 
  propertyType, 
  operator 
}: QueryValueInputProps) {
  // For 'in_last_days' and 'in_last_months' operators, always show number input
  if (operator === 'in_last_days' || operator === 'in_last_months') {
    return (
      <Input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder={operator === 'in_last_days' ? 'Number of days' : 'Number of months'}
        min="1"
      />
    )
  }

  // For regex operator, show text input
  if (operator === 'matches_regex') {
    return (
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        placeholder="Regular expression"
      />
    )
  }

  // Otherwise, use input based on property type
  switch (propertyType) {
    case PropertyType.String:
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Enter text"
        />
      )

    case PropertyType.Number:
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Enter number"
          step="any"
        />
      )

    case PropertyType.Date:
      return (
        <FormattedDateInput
          type={PropertyType.Date}
          value={value || ''}
          onChange={(val) => onChange(val || null)}
        />
      )

    case PropertyType.DateTime:
      return (
        <FormattedDateInput
          type={PropertyType.DateTime}
          value={value || ''}
          onChange={(val) => onChange(val || null)}
        />
      )

    case PropertyType.Time:
      return (
        <FormattedDateInput
          type={PropertyType.Time}
          value={value || ''}
          onChange={(val) => onChange(val || null)}
        />
      )

    default:
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          placeholder="Enter value"
        />
      )
  }
}