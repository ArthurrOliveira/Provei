"use client";

import { useState } from "react";
import {
  createFriendGroup,
  renameFriendGroup,
  deleteFriendGroup,
  inviteToGroup,
  removeMemberFromGroup,
  generateGroupInviteCode,
  revokeGroupInviteCode,
  type FriendGroupWithMembers,
} from "@/app/actions/groups";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  UserPlus,
  UserMinus,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  Link2,
  Copy,
  LinkIcon,
} from "lucide-react";

type SimpleUser = { id: string; name: string; avatarUrl: string | null };

export default function GroupsManager({
  currentUserId,
  initialGroups,
  following,
}: {
  currentUserId: string;
  initialGroups: FriendGroupWithMembers[];
  following: SimpleUser[];
}) {
  const [groups, setGroups] = useState<FriendGroupWithMembers[]>(initialGroups);
  const [newGroupName, setNewGroupName] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [copiedGroupId, setCopiedGroupId] = useState<string | null>(null);

  async function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setCreatingGroup(true);
    const res = await createFriendGroup(currentUserId, newGroupName.trim());
    setCreatingGroup(false);
    if (res.success) {
      const newGroup: FriendGroupWithMembers = {
        id: res.data.id,
        name: newGroupName.trim(),
        ownerId: currentUserId,
        inviteCode: null,
        createdAt: new Date(),
        members: [],
        pendingInviteIds: [],
      };
      setGroups((prev) => [...prev, newGroup]);
      setNewGroupName("");
      setExpandedGroup(res.data.id);
      toast.success(`Grupo "${newGroupName.trim()}" criado!`);
    } else {
      toast.error("Erro ao criar grupo.");
    }
  }

  async function handleRename(group: FriendGroupWithMembers) {
    if (!editingName.trim() || editingName.trim() === group.name) {
      setEditingGroupId(null);
      return;
    }
    const res = await renameFriendGroup(group.id, currentUserId, editingName.trim());
    if (res.success) {
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, name: editingName.trim() } : g))
      );
      toast.success("Grupo renomeado.");
    } else {
      toast.error("Erro ao renomear grupo.");
    }
    setEditingGroupId(null);
  }

  async function handleDelete(group: FriendGroupWithMembers) {
    const res = await deleteFriendGroup(group.id, currentUserId);
    if (res.success) {
      setGroups((prev) => prev.filter((g) => g.id !== group.id));
      if (expandedGroup === group.id) setExpandedGroup(null);
      toast.success(`Grupo "${group.name}" removido.`);
    } else {
      toast.error("Erro ao remover grupo.");
    }
  }

  async function handleGenerateLink(group: FriendGroupWithMembers) {
    const res = await generateGroupInviteCode(group.id, currentUserId);
    if (res.success) {
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, inviteCode: res.data.code } : g))
      );
    } else {
      toast.error("Erro ao gerar link.");
    }
  }

  async function handleRevokeLink(group: FriendGroupWithMembers) {
    const res = await revokeGroupInviteCode(group.id, currentUserId);
    if (res.success) {
      setGroups((prev) =>
        prev.map((g) => (g.id === group.id ? { ...g, inviteCode: null } : g))
      );
      toast.success("Link desativado.");
    } else {
      toast.error("Erro ao desativar link.");
    }
  }

  async function handleCopyLink(group: FriendGroupWithMembers) {
    if (!group.inviteCode) return;
    const url = `${window.location.origin}/invite/${group.inviteCode}`;
    await navigator.clipboard.writeText(url);
    setCopiedGroupId(group.id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedGroupId(null), 2500);
  }

  async function handleInvite(group: FriendGroupWithMembers, user: SimpleUser) {
    const res = await inviteToGroup(group.id, user.id, currentUserId);
    if (res.success) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? { ...g, pendingInviteIds: [...g.pendingInviteIds, user.id] }
            : g
        )
      );
      toast.success(`Convite enviado para ${user.name}.`);
    } else {
      toast.error(res.error ?? "Erro ao enviar convite.");
    }
  }

  async function handleRemoveMember(group: FriendGroupWithMembers, userId: string) {
    const res = await removeMemberFromGroup(group.id, userId);
    if (res.success) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? { ...g, members: g.members.filter((m) => m.user.id !== userId) }
            : g
        )
      );
      toast.success("Membro removido do grupo.");
    } else {
      toast.error("Erro ao remover membro.");
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="font-body text-xs font-semibold text-sage uppercase tracking-wide">
        Grupos ({groups.length})
      </h2>

      <form onSubmit={handleCreateGroup} className="flex gap-2">
        <Input
          placeholder="Nome do novo grupo..."
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="flex-1 border-cream-dark focus:border-olive focus:ring-olive/20 bg-warm-white font-body placeholder:text-sage"
        />
        <Button
          type="submit"
          disabled={creatingGroup || !newGroupName.trim()}
          className="bg-burgundy hover:bg-burgundy-light text-cream font-body gap-1 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          Criar
        </Button>
      </form>

      {groups.length === 0 && (
        <p className="font-body text-sm text-sage">
          Crie um grupo para organizar seus amigos e filtrar avaliações por grupo nos restaurantes.
        </p>
      )}

      <div className="space-y-3">
        {groups.map((group) => {
          const isExpanded = expandedGroup === group.id;
          const memberIds = new Set(group.members.map((m) => m.user.id));
          const pendingIds = new Set(group.pendingInviteIds);
          const available = following.filter((u) => !memberIds.has(u.id) && !pendingIds.has(u.id));

          return (
            <Card key={group.id} className="overflow-hidden border-cream-dark bg-warm-white">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {editingGroupId === group.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 text-sm border-cream-dark focus:border-olive font-body"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(group);
                          if (e.key === "Escape") setEditingGroupId(null);
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-olive hover:text-olive-dark transition-colors"
                        onClick={() => handleRename(group)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-sage hover:text-charcoal transition-colors"
                        onClick={() => setEditingGroupId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="font-display text-sm font-semibold flex-1 text-charcoal">
                        {group.name}
                        <Badge variant="secondary" className="ml-2 text-xs bg-cream text-sage font-body">
                          {group.members.length}
                        </Badge>
                        {pendingIds.size > 0 && (
                          <Badge variant="secondary" className="ml-1 text-xs bg-gold/20 text-gold font-body">
                            {pendingIds.size} pendente{pendingIds.size > 1 ? "s" : ""}
                          </Badge>
                        )}
                      </CardTitle>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-sage hover:text-charcoal transition-colors"
                        onClick={() => { setEditingGroupId(group.id); setEditingName(group.name); }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-sage hover:text-burgundy transition-colors"
                        onClick={() => handleDelete(group)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-sage transition-colors"
                        onClick={() => setExpandedGroup(isExpanded ? null : group.id)}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 pb-3 px-4 space-y-3">
                  {/* Membros confirmados */}
                  {group.members.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-body text-xs font-semibold text-sage uppercase tracking-wide">No grupo</p>
                      {group.members.map(({ user }) => (
                        <div key={user.id} className="flex items-center gap-2 py-1">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={user.avatarUrl ?? undefined} />
                            <AvatarFallback className="bg-olive text-cream text-xs font-body">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-body text-sm flex-1 text-charcoal">{user.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-sage hover:text-burgundy transition-colors"
                            onClick={() => handleRemoveMember(group, user.id)}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Convites pendentes */}
                  {pendingIds.size > 0 && (
                    <div className="space-y-2">
                      <p className="font-body text-xs font-semibold text-sage uppercase tracking-wide">Aguardando resposta</p>
                      {following
                        .filter((u) => pendingIds.has(u.id))
                        .map((user) => (
                          <div key={user.id} className="flex items-center gap-2 py-1">
                            <Avatar className="w-7 h-7">
                              <AvatarImage src={user.avatarUrl ?? undefined} />
                              <AvatarFallback className="bg-gold/20 text-gold text-xs font-body">
                                {user.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-body text-sm flex-1 text-charcoal">{user.name}</span>
                            <span className="flex items-center gap-1 font-body text-xs text-gold">
                              <Clock className="w-3 h-3" />
                              Convidado
                            </span>
                          </div>
                        ))}
                    </div>
                  )}

                  {/* Amigos que podem ser convidados */}
                  {available.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-body text-xs font-semibold text-sage uppercase tracking-wide">Convidar</p>
                      {available.map((user) => (
                        <div key={user.id} className="flex items-center gap-2 py-1">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={user.avatarUrl ?? undefined} />
                            <AvatarFallback className="bg-cream-dark text-sage text-xs font-body">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-body text-sm flex-1 text-charcoal">{user.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-sage hover:text-burgundy transition-colors"
                            onClick={() => handleInvite(group, user)}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {following.length === 0 && (
                    <p className="font-body text-xs text-sage">
                      Siga pessoas para convidá-las a grupos.
                    </p>
                  )}

                  {following.length > 0 && available.length === 0 && pendingIds.size === 0 && group.members.length === following.length && (
                    <p className="font-body text-xs text-sage">
                      Todos os seus amigos já estão neste grupo.
                    </p>
                  )}

                  {/* Link de convite */}
                  <div className="pt-2 border-t border-cream-dark space-y-2">
                    <p className="font-body text-xs font-semibold text-sage uppercase tracking-wide flex items-center gap-1">
                      <LinkIcon className="w-3 h-3" />
                      Link de convite
                    </p>
                    {group.inviteCode ? (
                      <div className="flex gap-2">
                        <div className="flex-1 bg-cream rounded-lg px-3 py-2 font-body text-xs text-charcoal truncate border border-cream-dark">
                          {typeof window !== "undefined"
                            ? `${window.location.origin}/invite/${group.inviteCode}`
                            : `/invite/${group.inviteCode}`}
                        </div>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-cream-dark text-charcoal hover:bg-burgundy hover:text-cream hover:border-burgundy transition-colors duration-200 flex-shrink-0"
                          onClick={() => handleCopyLink(group)}
                          title="Copiar link"
                        >
                          {copiedGroupId === group.id ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 border-cream-dark text-sage hover:bg-burgundy/10 hover:text-burgundy hover:border-burgundy/40 transition-colors duration-200 flex-shrink-0"
                          onClick={() => handleRevokeLink(group)}
                          title="Desativar link"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2 border-cream-dark text-charcoal hover:bg-burgundy hover:text-cream hover:border-burgundy font-body transition-colors duration-200"
                        onClick={() => handleGenerateLink(group)}
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Gerar link de convite
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
