'use client'

import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { PropertyType } from '@/types/entity'

interface PropertyDefaultInputProps {
  type: PropertyType
  value: string | null | undefined
  onChange: (value: string | null) => void
  disabled?: boolean
}

export function PropertyDefaultInput({ type, value, onChange, disabled }: PropertyDefaultInputProps) {
  const handleChange = (newValue: string | boolean | null) => {
    if (newValue === null || newValue === '') {
      onChange(null)
    } else if (typeof newValue === 'boolean') {
      onChange(newValue.toString())
    } else {
      onChange(newValue)
    }
  }

  switch (type) {
    case PropertyType.String:
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter default text"
          disabled={disabled}
        />
      )

    case PropertyType.Number:
      return (
        <Input
          type="number"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Enter default number"
          disabled={disabled}
        />
      )

    case PropertyType.Boolean:
      return (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="default-boolean"
            checked={value === 'true'}
            onCheckedChange={(checked) => handleChange(checked ? true : false)}
            disabled={disabled}
          />
          <label
            htmlFor="default-boolean"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Default to true
          </label>
        </div>
      )

    case PropertyType.Date:
      return (
        <Input
          type="date"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
        />
      )

    case PropertyType.DateTime:
      return (
        <Input
          type="datetime-local"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
        />
      )

    case PropertyType.Time:
      return (
        <Input
          type="time"
          value={value || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={disabled}
        />
      )

    case PropertyType.Entity:
      return (
        <div className="text-sm text-muted-foreground">
          Entity default values not yet supported
        </div>
      )

    default:
      return null
  }
}