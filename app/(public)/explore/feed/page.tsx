import type { Metadata } from "next";
import Link from "next/link";
import { getPublicFeedItems } from "@/app/actions/public";
import LoginGate from "@/components/LoginGate";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Star, MapPin } from "lucide-react";
import { formatRelativeTime } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Feed de avaliações | mangút",
  description: "Veja o que as pessoas estão avaliando no mangút.",
};

export default async function ExploreFeedPage() {
  const items = await getPublicFeedItems(20);

  return (
    <div className="space-y-5">
      {/* Banner fog of war */}
      <div className="bg-burgundy rounded-2xl p-4 flex items-center gap-3">
        <UtensilsCrossed className="w-6 h-6 text-gold flex-shrink-0" />
        <p className="font-body text-cream text-sm">
          Cadastre-se pra ver quem são seus amigos por aqui e o que eles
          realmente acharam.
        </p>
      </div>

      <div>
        <h1 className="font-display text-xl font-bold text-charcoal">
          Acontecendo no mangút
        </h1>
        <p className="font-body text-sm text-sage mt-0.5">
          Avaliações recentes · nomes ocultos
        </p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <p className="font-body text-sage">
            Nenhuma avaliação ainda. Seja o primeiro!
          </p>
          <Link href="/login" className="mt-4 inline-block">
            <Button className="bg-burgundy text-cream font-body">
              Criar conta
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item, i) => (
            <div
              key={`${item.restaurantId}-${i}`}
              className="bg-warm-white rounded-xl border border-cream-dark p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Anonymous avatar placeholder */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-cream-dark flex items-center justify-center flex-shrink-0">
                      <span className="font-body text-xs text-sage">?</span>
                    </div>
                    <span className="font-body text-xs text-sage">
                      Alguém avaliou
                    </span>
                  </div>

                  <Link
                    href={`/restaurantes/${item.restaurantId}`}
                    className="font-display font-semibold text-charcoal text-sm hover:text-burgundy transition-colors leading-tight block"
                  >
                    {item.restaurantName}
                  </Link>

                  {item.vibeTags.length > 0 && (
                    <p className="font-body text-xs text-sage mt-1">
                      {item.vibeTags.join(", ")}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {item.rating != null && (
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-gold text-gold" />
                      <span className="font-body text-sm font-bold text-charcoal">
                        {item.rating}
                      </span>
                    </div>
                  )}
                  <span className="font-body text-xs text-sage">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>
              </div>

              {/* Gate CTA inline */}
              <div className="mt-3 pt-3 border-t border-cream-dark">
                <LoginGate action="review" returnTo="/explore/feed" href="/app/feed">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs font-body text-sage hover:text-burgundy p-0 h-auto gap-1"
                  >
                    <MapPin className="w-3 h-3" />
                    Ver avaliações dos seus amigos neste restaurante →
                  </Button>
                </LoginGate>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CTA final */}
      <div className="bg-cream rounded-2xl p-5 text-center space-y-3 border border-cream-dark">
        <p className="font-display font-bold text-charcoal">
          Tem {items.length} avaliações aqui cima
        </p>
        <p className="font-body text-sm text-sage">
          Entre pra ver os nomes, comentários completos e quem são seus amigos
          no mangút.
        </p>
        <Link href="/login">
          <Button className="bg-burgundy text-cream font-body font-semibold">
            Criar conta grátis
          </Button>
        </Link>
      </div>
    </div>
  );
}
