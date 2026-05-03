import Link from "next/link";
import { Button } from "@/components/ui/button";
import BotanicalDecor from "@/components/ui/botanical-decor";
import { Users, Map, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-burgundy relative overflow-hidden">
      {/* Botanical decorations */}
      <BotanicalDecor variant="monstera" position="bottom-left" size="lg" opacity={0.09} animate />
      <BotanicalDecor variant="monstera" position="top-right" size="lg" opacity={0.07} animate />
      <BotanicalDecor variant="sansevieria" position="top-left" size="md" opacity={0.07} animate />
      <BotanicalDecor variant="sansevieria" position="bottom-right" size="md" opacity={0.07} animate />

      {/* Header */}
      <header className="relative z-10 px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        {/* Logo placeholder — swap for /public/logo.svg when available */}
        <span className="font-display text-2xl font-bold text-cream tracking-wide">mangút</span>
        <Link href="/login">
          <Button
            variant="outline"
            className="border-cream/40 text-cream hover:bg-cream hover:text-burgundy transition-all font-body"
          >
            Entrar
          </Button>
        </Link>
      </header>

      {/* Hero */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-20 text-center space-y-8">
        <div className="space-y-5">
          <div className="inline-flex items-center gap-2 bg-cream/10 border border-cream/20 rounded-full px-4 py-1.5 text-cream/80 text-sm font-body">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            Avaliações de quem você confia e conhece
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-bold text-warm-white leading-tight">
            Descubra restaurantes{" "}
            <span className="text-gold">com quem você confia</span>
          </h1>
          <p className="font-body text-xl text-sage max-w-2xl mx-auto leading-relaxed">
            Chega de dicas de desconhecidos e reviews compradas.
            Só a opinião de quem você realmente conhece.
          </p>
        </div>

        <Link href="/login">
          <Button
            size="lg"
            className="bg-cream text-burgundy hover:bg-cream-dark font-body font-bold px-10 py-6 text-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all"
          >
            Entrar com Google
          </Button>
        </Link>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-16">
          {[
            {
              icon: Users,
              title: "Círculo Social",
              desc: "Avaliações apenas de amigos e pessoas de confiança",
            },
            {
              icon: Star,
              title: "Vibe Tags",
              desc: "Saiba se é pet friendly, bom para date, preço justo e muito mais",
            },
            {
              icon: Map,
              title: "Mapa Interativo",
              desc: "Visualize onde seus amigos foram e o que recomendam perto de você",
            },
          ].map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-warm-white/8 backdrop-blur-sm rounded-2xl p-6 text-left border border-cream/10 hover:border-cream/25 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-olive/30 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-gold" />
              </div>
              <h3 className="font-display font-semibold text-cream mb-1">{title}</h3>
              <p className="font-body text-sm text-sage leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {/* Sobre / Visão */}
        <div className="mt-20 max-w-2xl mx-auto text-center space-y-4 pb-10">
          <h2 className="font-display text-2xl font-bold text-cream">Nossa visão</h2>
          <p className="font-body text-sage leading-relaxed">
            Acreditamos que a melhor recomendação de restaurante não vem de um algoritmo,
            nem de um influencer patrocinado — vem de um amigo que foi lá ontem e te contou
            tudo de verdade.
          </p>
          <p className="font-body text-sage leading-relaxed">
            O Mangut nasceu para resgatar isso: um círculo de confiança onde cada avaliação
            tem nome, rosto e contexto. Nada de estrelas anônimas. Só o que importa,
            de quem você conhece.
          </p>
        </div>
      </main>
    </div>
  );
}
