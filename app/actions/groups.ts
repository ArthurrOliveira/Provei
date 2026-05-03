"use server";

import { prisma } from "@/lib/prisma";
import { ActionResult } from "@/types";

export type FriendGroupWithMembers = {
  id: string;
  name: string;
  ownerId: string;
  inviteCode: string | null;
  createdAt: Date;
  members: {
    user: { id: string; name: string; avatarUrl: string | null };
  }[];
  pendingInviteIds: string[];
};

export type GroupPublicInfo = {
  id: string;
  name: string;
  ownerName: string;
  memberCount: number;
};

export type GroupInvitationWithDetails = {
  id: string;
  groupId: string;
  groupName: string;
  invitedByName: string;
  createdAt: Date;
};

export async function createFriendGroup(
  ownerId: string,
  name: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const group = await prisma.friendGroup.create({
      data: { ownerId, name },
    });
    return { success: true, data: { id: group.id } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function renameFriendGroup(
  groupId: string,
  ownerId: string,
  name: string
): Promise<ActionResult> {
  try {
    await prisma.friendGroup.updateMany({
      where: { id: groupId, ownerId },
      data: { name },
    });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function deleteFriendGroup(
  groupId: string,
  ownerId: string
): Promise<ActionResult> {
  try {
    await prisma.friendGroup.deleteMany({ where: { id: groupId, ownerId } });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function addMemberToGroup(
  groupId: string,
  userId: string
): Promise<ActionResult> {
  try {
    await prisma.friendGroupMember.create({ data: { groupId, userId } });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function removeMemberFromGroup(
  groupId: string,
  userId: string
): Promise<ActionResult> {
  try {
    await prisma.friendGroupMember.delete({
      where: { groupId_userId: { groupId, userId } },
    });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getFriendGroups(
  ownerId: string
): Promise<FriendGroupWithMembers[]> {
  const groups = await prisma.friendGroup.findMany({
    where: { ownerId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, avatarUrl: true } } },
      },
      invitations: {
        where: { status: "PENDING" },
        select: { invitedId: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });
  return groups.map((g) => ({
    ...g,
    pendingInviteIds: g.invitations.map((i) => i.invitedId),
  }));
}

export async function generateGroupInviteCode(
  groupId: string,
  ownerId: string
): Promise<ActionResult<{ code: string }>> {
  try {
    const code = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
    await prisma.friendGroup.updateMany({
      where: { id: groupId, ownerId },
      data: { inviteCode: code },
    });
    return { success: true, data: { code } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function revokeGroupInviteCode(
  groupId: string,
  ownerId: string
): Promise<ActionResult> {
  try {
    await prisma.friendGroup.updateMany({
      where: { id: groupId, ownerId },
      data: { inviteCode: null },
    });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getGroupByInviteCode(
  code: string
): Promise<GroupPublicInfo | null> {
  const group = await prisma.friendGroup.findUnique({
    where: { inviteCode: code },
    include: {
      owner: { select: { name: true } },
      _count: { select: { members: true } },
    },
  });
  if (!group) return null;
  return {
    id: group.id,
    name: group.name,
    ownerName: group.owner.name,
    memberCount: group._count.members,
  };
}

export async function joinGroupViaCode(
  code: string,
  userId: string
): Promise<ActionResult<{ groupId: string }>> {
  try {
    const group = await prisma.friendGroup.findUnique({
      where: { inviteCode: code },
    });
    if (!group) return { success: false, error: "Link inválido ou expirado." };

    const alreadyMember = await prisma.friendGroupMember.findUnique({
      where: { groupId_userId: { groupId: group.id, userId } },
    });
    if (alreadyMember) return { success: true, data: { groupId: group.id } };

    await prisma.friendGroupMember.create({ data: { groupId: group.id, userId } });
    return { success: true, data: { groupId: group.id } };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function inviteToGroup(
  groupId: string,
  invitedId: string,
  invitedBy: string
): Promise<ActionResult> {
  try {
    const alreadyMember = await prisma.friendGroupMember.findUnique({
      where: { groupId_userId: { groupId, userId: invitedId } },
    });
    if (alreadyMember) return { success: false, error: "Usuário já é membro do grupo." };

    const pending = await prisma.groupInvitation.findFirst({
      where: { groupId, invitedId, status: "PENDING" },
    });
    if (pending) return { success: false, error: "Convite já enviado." };

    await prisma.groupInvitation.create({ data: { groupId, invitedId, invitedBy } });
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function respondToGroupInvitation(
  invitationId: string,
  userId: string,
  accept: boolean
): Promise<ActionResult> {
  try {
    const invitation = await prisma.groupInvitation.findFirst({
      where: { id: invitationId, invitedId: userId, status: "PENDING" },
    });
    if (!invitation) return { success: false, error: "Convite não encontrado." };

    if (accept) {
      await prisma.$transaction([
        prisma.friendGroupMember.create({
          data: { groupId: invitation.groupId, userId },
        }),
        prisma.groupInvitation.update({
          where: { id: invitationId },
          data: { status: "ACCEPTED" },
        }),
      ]);
    } else {
      await prisma.groupInvitation.update({
        where: { id: invitationId },
        data: { status: "DECLINED" },
      });
    }
    return { success: true, data: undefined };
  } catch (e) {
    return { success: false, error: String(e) };
  }
}

export async function getPendingGroupInvitations(
  userId: string
): Promise<GroupInvitationWithDetails[]> {
  const invitations = await prisma.groupInvitation.findMany({
    where: { invitedId: userId, status: "PENDING" },
    include: {
      group: { select: { name: true } },
      sender: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return invitations.map((inv) => ({
    id: inv.id,
    groupId: inv.groupId,
    groupName: inv.group.name,
    invitedByName: inv.sender.name,
    createdAt: inv.createdAt,
  }));
}

export async function getGroupMemberIds(groupId: string): Promise<string[]> {
  const members = await prisma.friendGroupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });
  return members.map((m: { userId: string }) => m.userId);
}
