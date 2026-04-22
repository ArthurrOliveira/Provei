import { ProfileBadge } from "@/app/actions/badges";
import { BADGE_ICONS } from "@/lib/badges/badge-utils";
import { cn } from "@/lib/utils";

const CATEGORY_META = {
  REVIEWER: { label: "Avaliador",  color: "text-burgundy bg-cream border-burgundy/20" },
  SOCIAL:   { label: "Social",     color: "text-olive bg-cream border-olive/30" },
  EXPLORER: { label: "Explorador", color: "text-charcoal bg-cream border-charcoal/20" },
};

const CATEGORY_BADGE_COLOR = {
  REVIEWER: "bg-cream border-burgundy/20",
  SOCIAL:   "bg-cream border-olive/30",
  EXPLORER: "bg-cream border-charcoal/20",
};

function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  return (
    <div className="w-full h-1 bg-cream-dark rounded-full overflow-hidden mt-1.5">
      <div className="h-full bg-olive rounded-full transition-all" style={{ width: `${pct}%` }} />
    </div>
  );
}

function BadgeCard({ badge }: { badge: ProfileBadge }) {
  const icon = BADGE_ICONS[badge.slug] ?? "🏅";
  const catColor = CATEGORY_BADGE_COLOR[badge.category];

  return (
    <div
      title={badge.description}
      className={cn(
        "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all",
        badge.earned ? cn(catColor, "shadow-sm") : "bg-cream/50 border-cream-dark opacity-60"
      )}
    >
      <span className={cn("text-2xl leading-none", !badge.earned && "grayscale")}>{icon}</span>
      <span className={cn("text-xs font-body font-medium text-center leading-tight", badge.earned ? "text-charcoal" : "text-sage")}>
        {badge.label}
      </span>
      {!badge.earned && (
        <div className="w-full">
          <p className="text-[10px] text-sage font-body text-center">{badge.progress.current}/{badge.progress.total}</p>
          <ProgressBar current={badge.progress.current} total={badge.progress.total} />
        </div>
      )}
    </div>
  );
}

export default function BadgesSection({ badges }: { badges: ProfileBadge[] }) {
  const earned = badges.filter((b) => b.earned);
  const byCategory = (cat: "REVIEWER" | "SOCIAL" | "EXPLORER") => badges.filter((b) => b.category === cat);

  if (badges.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-charcoal">Selos</h2>
        {earned.length > 0 && (
          <span className="text-xs text-sage font-body">{earned.length}/{badges.length} conquistados</span>
        )}
      </div>

      {(["REVIEWER", "SOCIAL", "EXPLORER"] as const).map((cat) => {
        const catBadges = byCategory(cat);
        if (catBadges.length === 0) return null;
        const meta = CATEGORY_META[cat];
        return (
          <div key={cat}>
            <span className={cn("inline-block text-xs font-body font-semibold px-2 py-0.5 rounded-full border mb-2", meta.color)}>
              {meta.label}
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {catBadges.map((badge) => (
                <BadgeCard key={badge.slug} badge={badge} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
