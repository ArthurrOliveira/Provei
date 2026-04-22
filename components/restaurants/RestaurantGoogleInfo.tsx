import { Phone, Globe, MapPin, Clock, Star } from "lucide-react";
import { cn } from "@/lib/utils";

type OpeningHours = {
  weekdayDescriptions?: string[];
  openNow?: boolean;
};

function isOpenNow(hours: OpeningHours | null): boolean | null {
  if (!hours) return null;
  return hours.openNow ?? null;
}

function formatDayName(desc: string): { day: string; time: string } {
  const idx = desc.indexOf(":");
  if (idx === -1) return { day: desc, time: "" };
  return { day: desc.slice(0, idx), time: desc.slice(idx + 1).trim() };
}

export default function RestaurantGoogleInfo({
  phone,
  website,
  googleMapsUri,
  googleRating,
  googleRatingCount,
  openingHours,
}: {
  phone: string | null;
  website: string | null;
  googleMapsUri: string | null;
  googleRating: number | null;
  googleRatingCount: number | null;
  openingHours: OpeningHours | null;
}) {
  const hasAny = phone || website || googleMapsUri || googleRating || openingHours;
  if (!hasAny) return null;

  const openStatus = isOpenNow(openingHours);
  const today = new Date().getDay(); // 0=Sun
  const todayIdx = today === 0 ? 6 : today - 1; // Google uses Mon=0
  const descriptions = openingHours?.weekdayDescriptions ?? [];

  return (
    <div className="space-y-3 rounded-2xl border border-cream-dark bg-cream/50 p-4">
      <p className="font-body text-xs font-semibold text-sage uppercase tracking-wide">Informações do Google</p>

      {/* Rating */}
      {googleRating !== null && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 fill-gold text-gold" />
            <span className="font-body font-bold text-charcoal text-sm">{googleRating.toFixed(1)}</span>
          </div>
          {googleRatingCount !== null && (
            <span className="font-body text-xs text-sage">
              ({googleRatingCount.toLocaleString("pt-BR")} avaliações)
            </span>
          )}
          <span className="font-body text-[10px] text-sage">Google</span>
        </div>
      )}

      {/* Open status + today's hours */}
      {openingHours && (
        <div className="space-y-2">
          {openStatus !== null && (
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sage" />
              <span
                className={cn(
                  "font-body text-sm font-semibold",
                  openStatus ? "text-olive" : "text-burgundy"
                )}
              >
                {openStatus ? "Aberto agora" : "Fechado agora"}
              </span>
              {descriptions[todayIdx] && (
                <span className="font-body text-xs text-sage">
                  · {formatDayName(descriptions[todayIdx]).time}
                </span>
              )}
            </div>
          )}

          {/* Full week toggle */}
          {descriptions.length > 0 && (
            <details className="group">
              <summary className="font-body text-xs text-sage cursor-pointer list-none hover:text-charcoal select-none">
                Ver todos os horários ▾
              </summary>
              <div className="mt-2 space-y-1 pl-1">
                {descriptions.map((desc, i) => {
                  const { day, time } = formatDayName(desc);
                  const isToday = i === todayIdx;
                  return (
                    <div key={i} className={cn("flex gap-2 font-body text-xs", isToday && "font-semibold text-charcoal")}>
                      <span className={cn("w-16 shrink-0", isToday ? "text-charcoal" : "text-sage")}>{day}</span>
                      <span className={isToday ? "text-charcoal" : "text-sage/80"}>{time}</span>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      )}

      {/* Contact links */}
      <div className="flex flex-wrap gap-2 pt-1">
        {phone && (
          <a
            href={`tel:${phone}`}
            className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-olive hover:text-olive-dark bg-warm-white border border-cream-dark rounded-full px-3 py-1.5 transition-colors"
          >
            <Phone className="w-3.5 h-3.5" />
            {phone}
          </a>
        )}
        {googleMapsUri && (
          <a
            href={googleMapsUri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-burgundy hover:text-burgundy-light bg-warm-white border border-cream-dark rounded-full px-3 py-1.5 transition-colors"
          >
            <MapPin className="w-3.5 h-3.5" />
            Ver no Maps
          </a>
        )}
        {website && (
          <a
            href={website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-body text-xs font-medium text-charcoal hover:text-charcoal/70 bg-warm-white border border-cream-dark rounded-full px-3 py-1.5 transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            Site
          </a>
        )}
      </div>
    </div>
  );
}
