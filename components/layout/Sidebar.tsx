"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  Home,
  Map,
  Search,
  Users,
  User,
  LogOut,
  UtensilsCrossed,
  BookMarked,
} from "lucide-react";

const navItems = [
  { href: "/app/feed", label: "Feed", icon: Home },
  { href: "/app/map", label: "Mapa", icon: Map },
  { href: "/app/lists", label: "Listas", icon: BookMarked },
  { href: "/app/restaurants/search", label: "Restaurantes", icon: Search },
  { href: "/app/friends", label: "Amigos", icon: Users },
  { href: "/app/profile/me", label: "Meu Perfil", icon: User },
];

export default function Sidebar({
  user,
}: {
  user: { id: string; name: string; avatarUrl: string | null };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-full w-64 bg-burgundy z-30">
      <div className="p-6">
        <Link href="/app/feed" className="flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-gold" />
          <span className="font-display text-xl font-bold text-cream">mangút</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-body font-medium transition-colors",
                active
                  ? "bg-olive text-cream"
                  : "text-cream/70 hover:bg-cream/10 hover:text-cream"
              )}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-cream/10">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-8 h-8">
            <AvatarImage src={user.avatarUrl ?? undefined} />
            <AvatarFallback className="bg-olive text-cream text-xs font-body">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-body font-medium text-cream truncate">
              {user.name}
            </p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 text-sm font-body text-cream/60 hover:text-cream transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sair
        </button>
      </div>
    </aside>
  );
}
