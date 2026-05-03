import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import FriendsClient from "@/components/friends/FriendsClient";
import GroupsManager from "@/components/friends/GroupsManager";
import GroupInvitationsList from "@/components/friends/GroupInvitationsList";
import ShareProfileButton from "@/components/friends/ShareProfileButton";
import { getFollowing } from "@/app/actions/social";
import { getFriendGroups, getPendingGroupInvitations } from "@/app/actions/groups";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function FriendsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const [following, groups, pendingInvitations] = await Promise.all([
    getFollowing(currentUser.id),
    getFriendGroups(currentUser.id),
    getPendingGroupInvitations(currentUser.id),
  ]);

  const followingUsers = following.map((f) => f.following);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-charcoal">Amigos</h1>
        <p className="font-body text-sm text-sage">Gerencie seus amigos e grupos</p>
      </div>

      <Tabs defaultValue={pendingInvitations.length > 0 ? "invitations" : "following"}>
        <TabsList className="bg-cream border border-cream-dark">
          <TabsTrigger
            value="following"
            className="font-body transition-colors duration-200 data-[state=active]:bg-burgundy data-[state=active]:text-cream"
          >
            Seguindo ({followingUsers.length})
          </TabsTrigger>
          <TabsTrigger
            value="groups"
            className="font-body transition-colors duration-200 data-[state=active]:bg-burgundy data-[state=active]:text-cream"
          >
            Grupos ({groups.length})
          </TabsTrigger>
          <TabsTrigger
            value="invitations"
            className="font-body transition-colors duration-200 data-[state=active]:bg-burgundy data-[state=active]:text-cream relative"
          >
            Convites
            {pendingInvitations.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-gold text-burgundy-dark text-[10px] font-bold">
                {pendingInvitations.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="following" className="mt-4">
          <FriendsClient
            currentUserId={currentUser.id}
            initialFollowing={followingUsers}
          />
        </TabsContent>

        <TabsContent value="groups" className="mt-4">
          <GroupsManager
            currentUserId={currentUser.id}
            initialGroups={groups}
            following={followingUsers}
          />
        </TabsContent>

        <TabsContent value="invitations" className="mt-4">
          <GroupInvitationsList
            initialInvitations={pendingInvitations}
            currentUserId={currentUser.id}
          />
        </TabsContent>
      </Tabs>

      {/* Share profile */}
      <div className="pt-2 border-t border-cream-dark">
        <p className="font-body text-xs text-sage mb-3">
          Compartilhe seu perfil para que amigos possam te seguir
        </p>
        <ShareProfileButton userId={currentUser.id} />
      </div>
    </div>
  );
}
