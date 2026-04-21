"use client";

import { useState } from "react";
import {
  createFriendGroup,
  renameFriendGroup,
  deleteFriendGroup,
  addMemberToGroup,
  removeMemberFromGroup,
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
        createdAt: new Date(),
        members: [],
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

  async function handleAddMember(group: FriendGroupWithMembers, user: SimpleUser) {
    const res = await addMemberToGroup(group.id, user.id);
    if (res.success) {
      setGroups((prev) =>
        prev.map((g) =>
          g.id === group.id
            ? { ...g, members: [...g.members, { user }] }
            : g
        )
      );
      toast.success(`${user.name} adicionado ao grupo.`);
    } else {
      toast.error("Erro ao adicionar membro.");
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
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
        Grupos ({groups.length})
      </h2>

      <form onSubmit={handleCreateGroup} className="flex gap-2">
        <Input
          placeholder="Nome do novo grupo..."
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={creatingGroup || !newGroupName.trim()}
          className="bg-orange-600 hover:bg-orange-700 gap-1"
        >
          <Plus className="w-4 h-4" />
          Criar
        </Button>
      </form>

      {groups.length === 0 && (
        <p className="text-sm text-gray-500">
          Crie um grupo para organizar seus amigos e filtrar avaliações por grupo nos restaurantes.
        </p>
      )}

      <div className="space-y-3">
        {groups.map((group) => {
          const isExpanded = expandedGroup === group.id;
          const memberIds = new Set(group.members.map((m) => m.user.id));
          const nonMembers = following.filter((u) => !memberIds.has(u.id));

          return (
            <Card key={group.id} className="overflow-hidden">
              <CardHeader className="py-3 px-4">
                <div className="flex items-center gap-2">
                  {editingGroupId === group.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 text-sm"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(group);
                          if (e.key === "Escape") setEditingGroupId(null);
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-green-600"
                        onClick={() => handleRename(group)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-gray-400"
                        onClick={() => setEditingGroupId(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <CardTitle className="text-sm font-semibold flex-1">
                        {group.name}
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {group.members.length}
                        </Badge>
                      </CardTitle>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-gray-400 hover:text-gray-600"
                        onClick={() => {
                          setEditingGroupId(group.id);
                          setEditingName(group.name);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-gray-400 hover:text-red-500"
                        onClick={() => handleDelete(group)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-gray-400"
                        onClick={() =>
                          setExpandedGroup(isExpanded ? null : group.id)
                        }
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="pt-0 pb-3 px-4 space-y-3">
                  {/* Membros atuais */}
                  {group.members.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">No grupo</p>
                      {group.members.map(({ user }) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 py-1"
                        >
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={user.avatarUrl ?? undefined} />
                            <AvatarFallback className="bg-orange-100 text-orange-700 text-xs">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm flex-1">{user.name}</span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            onClick={() => handleRemoveMember(group, user.id)}
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Amigos que podem ser adicionados */}
                  {nonMembers.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500">Adicionar</p>
                      {nonMembers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center gap-2 py-1"
                        >
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={user.avatarUrl ?? undefined} />
                            <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">
                              {user.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm flex-1 text-gray-600">
                            {user.name}
                          </span>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-gray-400 hover:text-orange-600"
                            onClick={() => handleAddMember(group, user)}
                          >
                            <UserPlus className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {following.length === 0 && (
                    <p className="text-xs text-gray-400">
                      Siga pessoas para adicioná-las a grupos.
                    </p>
                  )}

                  {following.length > 0 && nonMembers.length === 0 && group.members.length === following.length && (
                    <p className="text-xs text-gray-400">
                      Todos os seus amigos já estão neste grupo.
                    </p>
                  )}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
