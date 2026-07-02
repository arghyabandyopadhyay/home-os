/**
 * Quiet hours time computation utility.
 * Determines if the current local time falls within a configured quiet hours window.
 */

/**
 * Parses a "HH:mm" time string into total minutes since midnight.
 * Returns null if the format is invalid.
 */
function parseTimeToMinutes(time: string): number | null {
  const match = time.match(/^(\d{2}):(\d{2})$/)
  if (!match) return null

  const hours = parseInt(match[1], 10)
  const minutes = parseInt(match[2], 10)

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null

  return hours * 60 + minutes
}

/**
 * Checks if the current local time falls within the quiet hours window.
 *
 * - Returns `false` if either start or end is null.
 * - Handles overnight ranges (e.g., 22:00 to 07:00 crossing midnight).
 * - All computation uses local time via `new Date()`.
 *
 * @param start - Quiet hours start time in "HH:mm" 24-hour format, or null
 * @param end - Quiet hours end time in "HH:mm" 24-hour format, or null
 * @returns Whether the current time is within the quiet hours window
 */
export function isWithinQuietHours(start: string | null, end: string | null): boolean {
  if (start === null || end === null) return false

  const startMinutes = parseTimeToMinutes(start)
  const endMinutes = parseTimeToMinutes(end)

  if (startMinutes === null || endMinutes === null) return false

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  if (startMinutes <= endMinutes) {
    // Same-day range (e.g., 09:00 to 17:00)
    return currentMinutes >= startMinutes && currentMinutes < endMinutes
  } else {
    // Overnight range (e.g., 22:00 to 07:00)
    return currentMinutes >= startMinutes || currentMinutes < endMinutes
  }
}
