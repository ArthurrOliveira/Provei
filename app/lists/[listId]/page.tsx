import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { getListById } from "@/app/actions/lists";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatRelativeTime } from "@/lib/utils";
import { MapPin, BookMarked, UtensilsCrossed } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ listId: string }>;
}): Promise<Metadata> {
  const { listId } = await params;
  const res = await getListById(listId);

  if (!res.success || !res.data || !res.data.isPublic) {
    return { title: "Lista não encontrada · Mangut" };
  }

  const list = res.data;
  const description =
    list.description ??
    `${list.items.length} lugar${list.items.length !== 1 ? "es" : ""} curados por ${list.user.name}`;
  const image =
    list.coverImageUrl ??
    list.items.find((i) => i.restaurant.thumbnailUrl)?.restaurant.thumbnailUrl;

  return {
    title: `${list.title} · Mangut`,
    description,
    openGraph: {
      title: list.title,
      description,
      type: "article",
      ...(image && { images: [{ url: image, width: 1200, height: 630 }] }),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: list.title,
      description,
      ...(image && { images: [image] }),
    },
  };
}

export default async function PublicListPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  const res = await getListById(listId);

  if (!res.success || !res.data) notFound();
  const list = res.data;
  if (!list.isPublic) notFound();

  return (
    <div className="min-h-screen bg-warm-white">
      {/* Header */}
      <header className="bg-burgundy sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-gold" />
            <span className="font-display text-lg font-bold text-cream">mangút</span>
          </Link>
          <Link href="/login">
            <Button size="sm" className="bg-cream text-burgundy hover:bg-cream-dark font-body font-semibold">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {list.coverImageUrl && (
          <div className="relative w-full h-52 rounded-2xl overflow-hidden">
            <Image src={list.coverImageUrl} alt={list.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 672px" />
          </div>
        )}

        <div className="space-y-3">
          <h1 className="font-display text-2xl font-bold text-charcoal">{list.title}</h1>
          {list.description && (
            <p className="font-body text-charcoal/70 text-sm leading-relaxed">{list.description}</p>
          )}
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarImage src={list.user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-olive text-cream text-xs font-body">
                {list.user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-body text-sm text-charcoal">{list.user.name}</span>
            <span className="text-cream-dark">·</span>
            <span className="font-body text-xs text-sage">{list.items.length} {list.items.length === 1 ? "lugar" : "lugares"}</span>
            <span className="text-cream-dark">·</span>
            <span className="font-body text-xs text-sage">{formatRelativeTime(list.updatedAt)}</span>
          </div>
        </div>

        {list.items.length === 0 ? (
          <div className="text-center py-10">
            <BookMarked className="w-10 h-10 text-cream-dark mx-auto mb-3" />
            <p className="font-body text-sage">Nenhum restaurante nesta lista.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.items.map((item, idx) => (
              <div key={item.restaurantId} className="bg-warm-white rounded-xl border border-cream-dark overflow-hidden">
                <div className="flex gap-3 p-4">
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <span className="font-body text-xs font-bold text-sage w-6 text-center">{idx + 1}</span>
                    {item.restaurant.thumbnailUrl ? (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden">
                        <Image src={item.restaurant.thumbnailUrl} alt={item.restaurant.name} fill className="object-cover" sizes="56px" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-cream flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-sage" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-display font-semibold text-charcoal text-sm leading-tight">{item.restaurant.name}</p>
                    <p className="font-body text-xs text-sage truncate">{item.restaurant.address}</p>
                    {item.restaurant.topVibeTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {item.restaurant.topVibeTags.map((tag) => (
                          <Badge key={tag.label} variant="secondary" className="text-xs bg-olive/10 text-olive-dark font-body py-0">
                            {tag.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {item.note && (
                      <p className="font-body text-xs text-burgundy bg-cream rounded-md px-2 py-1 italic border border-cream-dark">
                        💬 {item.note}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="bg-burgundy rounded-2xl p-6 text-center space-y-3 relative overflow-hidden">
          <UtensilsCrossed className="w-8 h-8 text-gold mx-auto" />
          <h2 className="font-display text-cream font-bold text-lg">Entre no Mangut para criar suas listas</h2>
          <p className="font-body text-cream/70 text-sm">
            Salve seus restaurantes favoritos, veja o que seus amigos recomendam e descubra novos lugares.
          </p>
          <Link href="/login">
            <Button className="bg-cream text-burgundy hover:bg-cream-dark font-body font-semibold">
              Criar conta grátis
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
