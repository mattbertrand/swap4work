import { useQuery, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

/**
 * Fetches the current user's blocked and blocked-by relationships.
 * Returns helper predicates for filtering and guarding UI.
 */
export function useBlockedUsers(userId) {
  const queryClient = useQueryClient();

  const { data: blocked = [] } = useQuery({
    queryKey: ["blockedUsers", userId],
    queryFn: () => base44.entities.BlockedUser.filter({ blocker_id: userId }),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const { data: blockedBy = [] } = useQuery({
    queryKey: ["blockedByUsers", userId],
    queryFn: () => base44.entities.BlockedUser.filter({ blocked_id: userId }),
    enabled: !!userId,
    refetchInterval: 30000,
  });

  const blockedUserIds = blocked.map((b) => b.blocked_id);
  const blockedByUserIds = blockedBy.map((b) => b.blocker_id);

  const isBlocked = (otherUserId) => blockedUserIds.includes(otherUserId);
  const hasBlockedMe = (otherUserId) => blockedByUserIds.includes(otherUserId);
  const hasRelationship = (otherUserId) =>
    isBlocked(otherUserId) || hasBlockedMe(otherUserId);

  const invalidate = () => {
    queryClient.invalidateQueries(["blockedUsers", userId]);
    queryClient.invalidateQueries(["blockedByUsers", userId]);
  };

  return {
    blocked,
    blockedBy,
    blockedUserIds,
    blockedByUserIds,
    isBlocked,
    hasBlockedMe,
    hasRelationship,
    invalidate,
  };
}