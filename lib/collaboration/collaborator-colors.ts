export const COLLABORATOR_COLORS = [
  "#3B82F6", // blue
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
] as const

/**
 * Simple string hash function for consistent color assignment.
 * Uses djb2-like algorithm to produce a non-negative integer.
 */
export function hashUserId(userId: string): number {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * Get a deterministic color for a collaborator based on their user ID.
 * Always returns the same color for the same userId.
 */
export function getCollaboratorColor(userId: string): string {
  const index = hashUserId(userId) % COLLABORATOR_COLORS.length
  return COLLABORATOR_COLORS[index]
}
