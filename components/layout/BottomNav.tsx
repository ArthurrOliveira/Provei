"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Home,
  Map,
  Search,
  Users,
  User,
  BookMarked,
  Info,
  LogIn,
} from "lucide-react";

const authedNavItems = [
  { href: "/app/feed", label: "Feed", icon: Home },
  { href: "/app/map", label: "Mapa", icon: Map },
  { href: "/app/lists", label: "Listas", icon: BookMarked },
  { href: "/app/restaurants/search", label: "Buscar", icon: Search },
  { href: "/app/friends", label: "Amigos", icon: Users },
  { href: "/app/profile/me", label: "Perfil", icon: User },
];

const publicNavItems = [
  { href: "/app/restaurants/search", label: "Buscar", icon: Search },
  { href: "/explore/map", label: "Mapa", icon: Map },
  { href: "/", label: "Sobre", icon: Info },
  { href: "/login", label: "Entrar", icon: LogIn },
];

export default function BottomNav({
  user,
}: {
  user?: { id: string } | null;
}) {
  const pathname = usePathname();
  const navItems = user ? authedNavItems : publicNavItems;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-warm-white border-t border-cream-dark z-30 safe-area-bottom">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          const isEntrar = label === "Entrar";
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 text-xs font-body transition-colors",
                isEntrar
                  ? "text-burgundy font-semibold"
                  : active
                  ? "text-burgundy"
                  : "text-sage"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
