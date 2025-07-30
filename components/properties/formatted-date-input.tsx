'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { formatDate, formatDateTime, formatTime, parseDate, parseDateTime, parseTime } from '@/lib/date-utils'
import { PropertyType } from '@/types/entity'

interface FormattedDateInputProps {
  type: PropertyType.Date | PropertyType.DateTime | PropertyType.Time
  value: string | null | undefined
  onChange: (value: string | null) => void
  disabled?: boolean
  className?: string
  placeholder?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export function FormattedDateInput({ 
  type, 
  value, 
  onChange, 
  disabled, 
  className,
  placeholder,
  onKeyDown
}: FormattedDateInputProps) {
  const [displayValue, setDisplayValue] = useState('')

  useEffect(() => {
    if (!value) {
      setDisplayValue('')
      return
    }

    switch (type) {
      case PropertyType.Date:
        setDisplayValue(formatDate(value))
        break
      case PropertyType.DateTime:
        setDisplayValue(formatDateTime(value))
        break
      case PropertyType.Time:
        setDisplayValue(formatTime(value))
        break
    }
  }, [value, type])

  const handleChange = (newValue: string) => {
    setDisplayValue(newValue)
  }

  const handleBlur = () => {
    if (!displayValue) {
      onChange(null)
      return
    }

    let parsedValue: string
    switch (type) {
      case PropertyType.Date:
        parsedValue = parseDate(displayValue)
        break
      case PropertyType.DateTime:
        parsedValue = parseDateTime(displayValue)
        break
      case PropertyType.Time:
        parsedValue = parseTime(displayValue)
        break
    }

    onChange(parsedValue)
  }

  const getPlaceholder = () => {
    if (placeholder) return placeholder
    
    switch (type) {
      case PropertyType.Date:
        return 'dd/MM/yyyy'
      case PropertyType.DateTime:
        return 'dd/MM/yyyy HH:mm'
      case PropertyType.Time:
        return 'HH:mm'
    }
  }

  return (
    <Input
      type="text"
      value={displayValue}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      placeholder={getPlaceholder()}
      disabled={disabled}
      className={className}
      onKeyDown={onKeyDown}
    />
  )
}