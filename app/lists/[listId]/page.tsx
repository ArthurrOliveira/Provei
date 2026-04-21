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
    <div className="min-h-screen bg-orange-50/30">
      {/* Header bar */}
      <header className="bg-white border-b border-orange-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
            <span className="text-lg font-bold text-orange-700">Mangut</span>
          </Link>
          <Link href="/login">
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700">
              Entrar
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Cover */}
        {list.coverImageUrl && (
          <div className="relative w-full h-52 rounded-2xl overflow-hidden">
            <Image
              src={list.coverImageUrl}
              alt={list.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
            />
          </div>
        )}

        {/* Title & meta */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-gray-900">{list.title}</h1>
          {list.description && (
            <p className="text-gray-600 text-sm leading-relaxed">{list.description}</p>
          )}
          <div className="flex items-center gap-2">
            <Avatar className="w-7 h-7">
              <AvatarImage src={list.user.avatarUrl ?? undefined} />
              <AvatarFallback className="bg-orange-200 text-orange-700 text-xs">
                {list.user.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-600">{list.user.name}</span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">
              {list.items.length} {list.items.length === 1 ? "lugar" : "lugares"}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">
              {formatRelativeTime(list.updatedAt)}
            </span>
          </div>
        </div>

        {/* Items */}
        {list.items.length === 0 ? (
          <div className="text-center py-10">
            <BookMarked className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhum restaurante nesta lista.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.items.map((item, idx) => (
              <div
                key={item.restaurantId}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden"
              >
                <div className="flex gap-3 p-4">
                  <div className="flex-shrink-0 flex flex-col items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 w-6 text-center">
                      {idx + 1}
                    </span>
                    {item.restaurant.thumbnailUrl ? (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden">
                        <Image
                          src={item.restaurant.thumbnailUrl}
                          alt={item.restaurant.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-orange-50 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-orange-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold text-gray-900 text-sm leading-tight">
                      {item.restaurant.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.restaurant.address}
                    </p>
                    {item.restaurant.topVibeTags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {item.restaurant.topVibeTags.map((tag) => (
                          <Badge
                            key={tag.label}
                            variant="secondary"
                            className="text-xs bg-amber-100 text-amber-700 py-0"
                          >
                            {tag.label}
                          </Badge>
                        ))}
                      </div>
                    )}
                    {item.note && (
                      <p className="text-xs text-orange-700 bg-orange-50 rounded-md px-2 py-1 italic">
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
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-6 text-center space-y-3">
          <UtensilsCrossed className="w-8 h-8 text-white mx-auto" />
          <h2 className="text-white font-bold text-lg">
            Entre no Mangut para criar suas listas
          </h2>
          <p className="text-orange-100 text-sm">
            Salve seus restaurantes favoritos, veja o que seus amigos recomendam e
            descubra novos lugares.
          </p>
          <Link href="/login">
            <Button className="bg-white text-orange-600 hover:bg-orange-50 font-semibold">
              Criar conta grátis
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
