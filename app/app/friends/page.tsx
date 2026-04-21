import { redirect } from "next/navigation";
import { getCurrentUser } from "@/app/actions/auth";
import FriendsClient from "@/components/friends/FriendsClient";
import GroupsManager from "@/components/friends/GroupsManager";
import { getFollowing } from "@/app/actions/social";
import { getFriendGroups } from "@/app/actions/groups";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default async function FriendsPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");

  const [following, groups] = await Promise.all([
    getFollowing(currentUser.id),
    getFriendGroups(currentUser.id),
  ]);

  const followingUsers = following.map((f) => f.following);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Amigos</h1>
        <p className="text-sm text-gray-500">Gerencie seus amigos e grupos</p>
      </div>

      <Tabs defaultValue="following">
        <TabsList>
          <TabsTrigger value="following">
            Seguindo ({followingUsers.length})
          </TabsTrigger>
          <TabsTrigger value="groups">
            Grupos ({groups.length})
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
      </Tabs>
    </div>
  );
}
