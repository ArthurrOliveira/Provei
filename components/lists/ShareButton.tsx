"use client";

import { Share2, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ShareButton({ listId }: { listId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/lists/${listId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copiado!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Não foi possível copiar o link");
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="flex items-center gap-1.5 px-3 py-2 rounded-full border border-gray-200 text-sm font-medium text-gray-600 bg-white hover:border-orange-300 hover:text-orange-600 transition-all"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
      {copied ? "Copiado!" : "Compartilhar"}
    </button>
  );
}
