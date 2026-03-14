/**
 * Formats a Firestore user document into a display name.
 * Precedence: displayName → email (name portion) → fallback
 */
export function formatUserName(
  userData: { displayName?: string | null; email?: string | null } | null,
  fallback = 'Someone'
): string {
  if (!userData) return fallback;

  const raw = userData.displayName || userData.email || '';
  if (!raw) return fallback;

  if (raw.includes('@')) {
    const localPart = raw.split('@')[0];
    return localPart
      .replace(/[._]/g, ' ')
      .split(' ')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || fallback;
  }

  return raw;
}
