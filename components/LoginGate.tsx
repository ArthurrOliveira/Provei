"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed } from "lucide-react";

type Action = "review" | "follow" | "list" | "map";

const microcopy: Record<Action, { title: string; subtitle: string }> = {
  review: {
    title: "Avalie restaurantes",
    subtitle:
      "Crie sua conta pra deixar avaliações e ver o que seus amigos acharam.",
  },
  follow: {
    title: "Siga amigos",
    subtitle: "Crie sua conta pra seguir amigos e ver as avaliações deles.",
  },
  list: {
    title: "Crie e salve listas",
    subtitle:
      "Crie sua conta pra salvar restaurantes em listas e compartilhar com amigos.",
  },
  map: {
    title: "Veja no mapa",
    subtitle: "Entre pra ver no mapa quem dos seus amigos foi onde.",
  },
};

export default function LoginGate({
  action,
  returnTo,
  href,
  onAuthenticated,
  children,
}: {
  action: Action;
  returnTo: string;
  href?: string;
  onAuthenticated?: () => void;
  children: React.ReactNode;
}) {
  const [hasSession, setHasSession] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleGoogle() {
    setLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(returnTo)}`,
      },
    });
  }

  const child = React.Children.only(
    children
  ) as React.ReactElement<{ onClick?: (e: React.MouseEvent) => void }>;

  const gatedChild = React.cloneElement(child, {
    onClick: (e: React.MouseEvent) => {
      if (hasSession === false) {
        e.preventDefault();
        e.stopPropagation();
        setOpen(true);
        return;
      }
      if (hasSession === true) {
        if (href) {
          router.push(href);
        } else if (onAuthenticated) {
          onAuthenticated();
        } else {
          child.props.onClick?.(e);
        }
        return;
      }
      // session still loading — treat as unauthenticated
      e.preventDefault();
      e.stopPropagation();
      setOpen(true);
    },
  });

  return (
    <>
      {gatedChild}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex justify-center mb-2">
              <UtensilsCrossed className="w-10 h-10 text-gold" />
            </div>
            <DialogTitle className="text-center font-display text-xl text-charcoal">
              {microcopy[action].title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-center font-body text-sm text-sage">
            {microcopy[action].subtitle}
          </p>
          <div className="space-y-2 pt-2">
            <Button
              className="w-full bg-burgundy text-cream hover:bg-burgundy/90 font-body font-semibold"
              onClick={handleGoogle}
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-cream/30 border-t-cream rounded-full animate-spin" />
                  Redirecionando...
                </span>
              ) : (
                "Entrar com Google"
              )}
            </Button>
            <a
              href={`/login?next=${encodeURIComponent(returnTo)}`}
              className="block text-center text-sm font-body text-sage hover:text-charcoal transition-colors"
            >
              Ou entrar com email →
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
