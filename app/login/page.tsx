"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import BotanicalDecor from "@/components/ui/botanical-decor";
import { toast } from "sonner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      toast.error("Erro ao enviar link: " + error.message);
    } else {
      setSent(true);
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setGoogleLoading(false);
      toast.error("Erro ao entrar com Google: " + error.message);
    }
    // se não houve erro, o browser redireciona — não precisa resetar o loading
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-burgundy relative overflow-hidden p-4">
      <BotanicalDecor variant="sansevieria" position="left"  size="lg" opacity={0.07} animate />
      <BotanicalDecor variant="sansevieria" position="right" size="lg" opacity={0.07} animate />
      <BotanicalDecor variant="monstera"    position="bottom-left"  size="md" opacity={0.08} animate />
      <BotanicalDecor variant="monstera"    position="bottom-right" size="md" opacity={0.08} animate />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / title */}
        <div className="text-center mb-8">
          <span className="font-display text-4xl font-bold text-cream">mangút</span>
          <p className="font-body text-sage mt-2 text-sm">Descubra restaurantes com seus amigos</p>
        </div>

        {/* Card */}
        <div className="bg-warm-white rounded-2xl shadow-2xl p-6 space-y-4">
          <Button
            variant="outline"
            className="w-full gap-3 border-cream-dark text-charcoal hover:bg-cream-dark hover:border-sage font-body font-semibold py-5 transition-colors duration-200"
            onClick={handleGoogle}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <span className="w-5 h-5 border-2 border-charcoal/30 border-t-charcoal rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            )}
            {googleLoading ? "Entrando..." : "Entrar com Google"}
          </Button>

          <div className="flex items-center gap-2">
            <Separator className="flex-1 bg-cream-dark" />
            <span className="text-xs text-sage font-body">ou</span>
            <Separator className="flex-1 bg-cream-dark" />
          </div>

          {sent ? (
            <div className="text-center text-sm font-body text-olive p-4 bg-cream rounded-xl border border-olive/20">
              ✅ Link enviado! Verifique seu email.
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="space-y-3">
              <div>
                <Label htmlFor="email" className="font-body text-charcoal font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="mt-1 border-cream-dark focus:border-olive focus:ring-olive/20 bg-warm-white font-body placeholder:text-sage"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-burgundy hover:bg-burgundy-light text-cream font-body font-semibold py-5 transition-colors duration-200"
                disabled={loading}
              >
                {loading ? "Enviando..." : "Entrar com Email"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
