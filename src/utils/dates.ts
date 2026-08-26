/** Format a Date as YYYY-MM-DD. */
export function formatISODate(value: Date): string {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Parse a YYYY-MM-DD string into a local Date (no timezone offset). */
export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

/** Today's date as YYYY-MM-DD. */
export function todayISO(): string {
  return formatISODate(new Date())
}

/** Get the first day of the month containing the given ISO date. */
export function monthStartISO(value = todayISO()): string {
  return `${value.slice(0, 7)}-01`
}

/** Extract YYYY-MM from a month-start ISO string for <input type="month">. */
export function monthInputValue(monthStart: string): string {
  return monthStart.slice(0, 7)
}

/** Human-readable month label, e.g. "tháng 8 năm 2026". */
export function monthLabel(monthStart: string): string {
  return new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(parseISODate(monthStart))
}

/** Number of days in the month containing monthStart. */
export function daysInMonth(monthStart: string): number {
  const date = parseISODate(monthStart)
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
}

/** Check whether a date string falls in the same YYYY-MM as monthStart. */
export function isInMonth(date: string, monthStart: string): boolean {
  return date.slice(0, 7) === monthStart.slice(0, 7)
}

/** Build 42 calendar cells (6 weeks) for the month, including leading/trailing days. */
export type CalendarDay = {
  iso: string
  dayNumber: number
  inMonth: boolean
}

export function buildCalendarDays(monthStart: string): CalendarDay[] {
  const start = parseISODate(monthStart)
  const firstCalendarDate = new Date(start)
  firstCalendarDate.setDate(start.getDate() - start.getDay())

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(firstCalendarDate)
    date.setDate(firstCalendarDate.getDate() + index)
    const iso = formatISODate(date)
    return {
      iso,
      dayNumber: date.getDate(),
      inMonth: isInMonth(iso, monthStart),
    }
  })
}
