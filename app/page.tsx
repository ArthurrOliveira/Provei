import Link from "next/link";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Users, Map, Star } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <UtensilsCrossed className="w-6 h-6 text-orange-600" />
          <span className="text-xl font-bold text-orange-700">Mangut</span>
        </div>
        <Link href="/login">
          <Button variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50">
            Entrar
          </Button>
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight">
            Descubra restaurantes{" "}
            <span className="text-orange-600">com quem você confia</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Veja avaliações apenas dos seus amigos. Sem strangers, sem reviews
            compradas. Só a opinião de quem você conhece.
          </p>
        </div>

        <Link href="/login">
          <Button
            size="lg"
            className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all"
          >
            Entrar com Google
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
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
              className="bg-white/70 backdrop-blur rounded-2xl p-6 text-left border border-orange-100"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center mb-3">
                <Icon className="w-5 h-5 text-orange-600" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
              <p className="text-sm text-gray-500">{desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
