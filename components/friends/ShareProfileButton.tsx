"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, Check, Copy } from "lucide-react";
import { toast } from "sonner";

export default function ShareProfileButton({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/app/profile/${userId}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: "Mangut — meu perfil", url });
        return;
      } catch {
        // usuário cancelou o share nativo — cai no fallback de copiar
      }
    }

    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Link do perfil copiado!");
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <Button
      variant="outline"
      onClick={handleShare}
      className="w-full gap-2 border-burgundy/30 text-burgundy hover:bg-burgundy hover:text-cream font-body font-semibold transition-colors duration-200"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4" />
          Link copiado!
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Compartilhar meu perfil
        </>
      )}
      {!copied && <Copy className="w-3.5 h-3.5 ml-auto opacity-40" />}
    </Button>
  );
}
