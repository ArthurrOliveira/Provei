import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import { getGroupByInviteCode, joinGroupViaCode } from "@/app/actions/groups";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const [group, currentUser] = await Promise.all([
    getGroupByInviteCode(code),
    getCurrentUser(),
  ]);

  if (!group) {
    return (
      <div className="min-h-screen bg-burgundy flex items-center justify-center p-4">
        <div className="bg-warm-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-3">
          <div className="w-14 h-14 rounded-full bg-cream flex items-center justify-center mx-auto">
            <Users className="w-7 h-7 text-sage" />
          </div>
          <h1 className="font-display text-xl font-bold text-charcoal">Link inválido</h1>
          <p className="font-body text-sm text-sage">
            Este link de convite não existe ou foi desativado.
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    redirect(`/login?next=/invite/${code}`);
  }

  // Server action para entrar no grupo
  async function handleJoin() {
    "use server";
    const res = await joinGroupViaCode(code, currentUser!.id);
    if (res.success) {
      redirect("/app/friends");
    }
  }

  return (
    <div className="min-h-screen bg-burgundy flex items-center justify-center p-4">
      <div className="bg-warm-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center space-y-6">
        {/* Ícone */}
        <div className="w-16 h-16 rounded-full bg-burgundy/10 flex items-center justify-center mx-auto">
          <Users className="w-8 h-8 text-burgundy" />
        </div>

        {/* Info do grupo */}
        <div className="space-y-1">
          <p className="font-body text-xs font-semibold text-sage uppercase tracking-wide">
            Você foi convidado para
          </p>
          <h1 className="font-display text-2xl font-bold text-charcoal">{group.name}</h1>
          <p className="font-body text-sm text-sage">
            Criado por <span className="text-charcoal font-medium">{group.ownerName}</span>
            {" · "}
            {group.memberCount} {group.memberCount === 1 ? "membro" : "membros"}
          </p>
        </div>

        {/* Ação */}
        <form action={handleJoin}>
          <Button
            type="submit"
            className="w-full bg-burgundy hover:bg-burgundy-light text-cream font-body font-semibold py-5 transition-colors duration-200"
          >
            Entrar no grupo
          </Button>
        </form>

        <p className="font-body text-xs text-sage/70">
          Você será adicionado como membro de{" "}
          <span className="font-medium text-charcoal">{group.name}</span>
        </p>
      </div>
    </div>
  );
}
