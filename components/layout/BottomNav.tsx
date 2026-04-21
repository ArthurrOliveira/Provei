"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Map, Search, Users, User, BookMarked } from "lucide-react";

const navItems = [
  { href: "/app/feed", label: "Feed", icon: Home },
  { href: "/app/map", label: "Mapa", icon: Map },
  { href: "/app/lists", label: "Listas", icon: BookMarked },
  { href: "/app/restaurants/search", label: "Buscar", icon: Search },
  { href: "/app/friends", label: "Amigos", icon: Users },
  { href: "/app/profile/me", label: "Perfil", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-orange-100 z-30 safe-area-bottom">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 text-xs transition-colors",
                active ? "text-orange-600" : "text-gray-500"
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
