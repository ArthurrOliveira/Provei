"use client";

import { useState } from "react";
import { respondToGroupInvitation, type GroupInvitationWithDetails } from "@/app/actions/groups";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Users, Check, X } from "lucide-react";

export default function GroupInvitationsList({
  initialInvitations,
  currentUserId,
}: {
  initialInvitations: GroupInvitationWithDetails[];
  currentUserId: string;
}) {
  const [invitations, setInvitations] = useState(initialInvitations);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  async function handleRespond(id: string, accept: boolean) {
    setRespondingId(id);
    const res = await respondToGroupInvitation(id, currentUserId, accept);
    setRespondingId(null);
    if (res.success) {
      setInvitations((prev) => prev.filter((inv) => inv.id !== id));
      toast.success(accept ? "Você entrou no grupo!" : "Convite recusado.");
    } else {
      toast.error(res.error ?? "Erro ao responder convite.");
    }
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <div className="w-12 h-12 rounded-full bg-cream flex items-center justify-center mx-auto">
          <Users className="w-6 h-6 text-sage" />
        </div>
        <p className="font-body text-sm text-sage">Nenhum convite pendente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {invitations.map((inv) => (
        <Card key={inv.id} className="border-cream-dark bg-warm-white">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="w-10 h-10 rounded-full bg-burgundy/10 flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-burgundy" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body font-semibold text-sm text-charcoal truncate">
                {inv.groupName}
              </p>
              <p className="font-body text-xs text-sage">
                Convidado por <span className="text-charcoal font-medium">{inv.invitedByName}</span>
              </p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                disabled={respondingId === inv.id}
                onClick={() => handleRespond(inv.id, false)}
                className="border-cream-dark text-sage hover:border-burgundy/40 hover:text-burgundy font-body transition-colors duration-200 h-8 px-2.5"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
              <Button
                size="sm"
                disabled={respondingId === inv.id}
                onClick={() => handleRespond(inv.id, true)}
                className="bg-burgundy hover:bg-burgundy-light text-cream font-body transition-colors duration-200 h-8 px-3 gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Aceitar
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
