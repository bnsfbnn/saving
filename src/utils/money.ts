/** Format a number as Vietnamese Dong currency string. */
export function currency(value: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0)
}

/** Sum an array of numbers. */
export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0)
}

/** Parse a user-input string to a number, stripping commas. */
export function parseAmount(value: string): number {
  return Number(value.replace(/,/g, '').trim())
}
