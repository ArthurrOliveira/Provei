export const BADGE_ICONS: Record<string, string> = {
  "first-review": "🍽️",
  "frequent-reviewer": "⭐",
  "official-critic": "🏆",
  "neighborhood-voice": "🏘️",
  influencer: "📣",
  "opinion-maker": "💡",
  curator: "📋",
  explorer: "🗺️",
  eclectic: "🎭",
  pioneer: "🚀",
};

// Highest priority first — used to pick the single badge shown in cards
export const BADGE_PRIORITY_ORDER = [
  "official-critic",
  "frequent-reviewer",
  "explorer",
  "influencer",
  "eclectic",
  "pioneer",
  "neighborhood-voice",
  "opinion-maker",
  "first-review",
  "curator",
] as const;

export function getTopBadge<T extends { slug: string }>(
  badges: T[]
): T | null {
  for (const slug of BADGE_PRIORITY_ORDER) {
    const found = badges.find((b) => b.slug === slug);
    if (found) return found;
  }
  return badges[0] ?? null;
}
