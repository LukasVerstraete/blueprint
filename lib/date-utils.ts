/**
 * Format a date string to dd/MM/yyyy format
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return ''
  
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString
    
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    
    return `${day}/${month}/${year}`
  } catch {
    return dateString
  }
}

/**
 * Format a datetime string to dd/MM/yyyy HH:mm format
 */
export function formatDateTime(dateTimeString: string | null | undefined): string {
  if (!dateTimeString) return ''
  
  try {
    const date = new Date(dateTimeString)
    if (isNaN(date.getTime())) return dateTimeString
    
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    
    return `${day}/${month}/${year} ${hours}:${minutes}`
  } catch {
    return dateTimeString
  }
}

/**
 * Format a time string to HH:mm format
 */
export function formatTime(timeString: string | null | undefined): string {
  if (!timeString) return ''
  
  try {
    // Handle both full datetime strings and time-only strings
    if (timeString.includes('T')) {
      const date = new Date(timeString)
      if (isNaN(date.getTime())) return timeString
      
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    } else {
      // Handle HH:mm or HH:mm:ss format
      const parts = timeString.split(':')
      if (parts.length >= 2) {
        const hours = parts[0].padStart(2, '0')
        const minutes = parts[1].padStart(2, '0')
        return `${hours}:${minutes}`
      }
    }
    
    return timeString
  } catch {
    return timeString
  }
}

/**
 * Convert dd/MM/yyyy format back to ISO date string for storage
 */
export function parseDate(displayDate: string): string {
  if (!displayDate) return ''
  
  try {
    const parts = displayDate.split('/')
    if (parts.length !== 3) return displayDate
    
    const day = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1 // Month is 0-indexed
    const year = parseInt(parts[2], 10)
    
    const date = new Date(year, month, day)
    return date.toISOString().split('T')[0]
  } catch {
    return displayDate
  }
}

/**
 * Convert dd/MM/yyyy HH:mm format back to ISO datetime string for storage
 */
export function parseDateTime(displayDateTime: string): string {
  if (!displayDateTime) return ''
  
  try {
    const [datePart, timePart] = displayDateTime.split(' ')
    if (!datePart || !timePart) return displayDateTime
    
    const dateParts = datePart.split('/')
    if (dateParts.length !== 3) return displayDateTime
    
    const timeParts = timePart.split(':')
    if (timeParts.length < 2) return displayDateTime
    
    const day = parseInt(dateParts[0], 10)
    const month = parseInt(dateParts[1], 10) - 1 // Month is 0-indexed
    const year = parseInt(dateParts[2], 10)
    const hours = parseInt(timeParts[0], 10)
    const minutes = parseInt(timeParts[1], 10)
    
    const date = new Date(year, month, day, hours, minutes)
    return date.toISOString().slice(0, 16) // Format for datetime-local input
  } catch {
    return displayDateTime
  }
}

/**
 * Convert HH:mm format back to time string for storage
 */
export function parseTime(displayTime: string): string {
  if (!displayTime) return ''
  
  try {
    const parts = displayTime.split(':')
    if (parts.length >= 2) {
      const hours = parts[0].padStart(2, '0')
      const minutes = parts[1].padStart(2, '0')
      return `${hours}:${minutes}`
    }
    
    return displayTime
  } catch {
    return displayTime
  }
}