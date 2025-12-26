import { format, parse, isToday, isFuture, differenceInDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { DATE_FORMAT, DISPLAY_DATE_FORMAT, DISPLAY_DATETIME_FORMAT } from '@/lib/constants'

/**
 * Date utility functions
 */

/**
 * Format date to YYYY-MM-DD
 */
export function formatDateToString(date: Date): string {
  return format(date, DATE_FORMAT)
}

/**
 * Format date for display (DD/MM/YYYY)
 */
export function formatDateForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? parseDate(date) : date
  return format(dateObj, DISPLAY_DATE_FORMAT, { locale: ptBR })
}

/**
 * Format datetime for display (DD/MM/YYYY HH:mm)
 */
export function formatDateTimeForDisplay(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return format(dateObj, DISPLAY_DATETIME_FORMAT, { locale: ptBR })
}

/**
 * Parse date string (YYYY-MM-DD) to Date object
 */
export function parseDate(dateString: string): Date {
  return parse(dateString, DATE_FORMAT, new Date())
}

/**
 * Get today's date string
 */
export function getTodayString(): string {
  return formatDateToString(new Date())
}

/**
 * Check if date string is today
 */
export function isDateToday(dateString: string): boolean {
  return isToday(parseDate(dateString))
}

/**
 * Check if date string is in the future
 */
export function isDateFuture(dateString: string): boolean {
  return isFuture(parseDate(dateString))
}

/**
 * Check if date can be edited (today or future)
 */
export function canEditDate(dateString: string): boolean {
  return isDateToday(dateString) || isDateFuture(dateString)
}

/**
 * Calculate day number in challenge
 */
export function calculateDayNumber(startDate: Date, currentDate: Date): number {
  const days = differenceInDays(currentDate, startDate)
  return Math.max(1, days + 1)
}

/**
 * Get date for specific day number in challenge
 */
export function getDateForDayNumber(startDate: Date, dayNumber: number): Date {
  const date = new Date(startDate)
  date.setDate(date.getDate() + (dayNumber - 1))
  return date
}

/**
 * Calculate days remaining in challenge
 */
export function calculateDaysRemaining(currentDay: number, totalDays: number = 75): number {
  return Math.max(0, totalDays - currentDay + 1)
}

/**
 * Calculate challenge progress percentage
 */
export function calculateProgressPercentage(currentDay: number, totalDays: number = 75): number {
  return Math.min(100, Math.round((currentDay / totalDays) * 100))
}

/**
 * Get date range for last N days
 */
export function getLastNDays(n: number): string[] {
  const dates: string[] = []
  const today = new Date()
  
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    dates.push(formatDateToString(date))
  }
  
  return dates
}

/**
 * Group dates by week
 */
export function groupDatesByWeek(dates: string[]): string[][] {
  const weeks: string[][] = []
  let currentWeek: string[] = []
  
  dates.forEach((date, index) => {
    currentWeek.push(date)
    
    if (currentWeek.length === 7 || index === dates.length - 1) {
      weeks.push([...currentWeek])
      currentWeek = []
    }
  })
  
  return weeks
}
