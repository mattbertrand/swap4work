import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationBell({ user }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['unreadNotifications', user?.id],
    queryFn: async () => {
      console.log('🔔 NotificationBell: Fetching unread notifications for user:', user.id);
      const unread = await base44.entities.Notification.filter({ 
        user_id: user.id,
        is_read: false 
      }, '-created_date');
      console.log(`🔔 NotificationBell: Found ${unread.length} unread notifications`);
      return unread;
    },
    enabled: !!user,
    refetchInterval: 5000, // Check every 5 seconds
    staleTime: 0, // Always fetch fresh
    cacheTime: 1000 // Keep in cache for 1 second
  });

  const unreadCount = notifications.length;
  console.log('🔔 NotificationBell: Displaying badge count:', unreadCount);

  return (
    <Link to={createPageUrl("Notifications")} className="relative">
      <button className="p-2 hover:bg-orange-100 rounded-lg transition-colors relative">
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </button>
    </Link>
  );
}