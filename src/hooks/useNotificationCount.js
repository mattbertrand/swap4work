import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function useNotificationCount(userId) {
  const client = useQueryClient();
  useEffect(() => {
    if (!userId) return;
    return base44.entities.Notification.subscribe(() => {
      client.invalidateQueries({ queryKey: ['notificationCount', userId] });
      client.invalidateQueries({ queryKey: ['unreadNotifications', userId] });
      client.invalidateQueries({ queryKey: ['readNotifications', userId] });
    });
  }, [client, userId]);
  return useQuery({ queryKey: ['notificationCount', userId], queryFn: () => base44.entities.Notification.count({ user_id: userId, is_read: false }), enabled: !!userId });
}