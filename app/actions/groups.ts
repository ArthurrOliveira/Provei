"use server";

import { prisma } from "@/lib/prisma";
import { ActionResult } from "@/types";

export type FriendGroupWithMembers = {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  members: {
    user: { id: string; name: string; avatarUrl: string | null };
  }[];
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
  return prisma.friendGroup.findMany({
    where: { ownerId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, avatarUrl: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getGroupMemberIds(groupId: string): Promise<string[]> {
  const members = await prisma.friendGroupMember.findMany({
    where: { groupId },
    select: { userId: true },
  });
  return members.map((m: { userId: string }) => m.userId);
}
