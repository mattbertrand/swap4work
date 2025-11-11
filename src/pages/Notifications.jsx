import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare, Clock, CheckCircle2, AlertCircle, Package } from "lucide-react";
import { format } from "date-fns";

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('📥 Fetching all notifications for user:', user.id);
      const allNotifications = await base44.entities.Notification.filter({ 
        user_id: user.id 
      }, '-created_date');
      console.log(`✅ Loaded ${allNotifications.length} total notifications`);
      console.log('📋 Notifications:', allNotifications.map(n => ({
        id: n.id,
        title: n.title,
        is_read: n.is_read,
        created: n.created_date
      })));
      return allNotifications;
    },
    enabled: !!user,
    refetchInterval: 5000,
    staleTime: 0, // Always fetch fresh data
    cacheTime: 0  // Don't cache notifications
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => {
      console.log('✓ Marking notification as read:', notificationId);
      return base44.entities.Notification.update(notificationId, { is_read: true });
    },
    onSuccess: () => {
      console.log('✅ Notification marked as read');
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      console.log(`✓ Marking ${unread.length} notifications as read`);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => {
      console.log('✅ All notifications marked as read');
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const handleNotificationClick = async (notification) => {
    console.log('👆 Notification clicked:', notification);
    
    // Mark as read
    if (!notification.is_read) {
      await markAsReadMutation.mutateAsync(notification.id);
    }
    
    // Navigate to the link
    if (notification.link_url) {
      console.log('🔗 Navigating to:', notification.link_url);
      navigate(notification.link_url);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_negotiation':
      case 'new_message':
        return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'new_offer':
      case 'counter_offer':
        return <Clock className="w-5 h-5 text-orange-600" />;
      case 'offer_accepted':
      case 'agreement_confirmed':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'offer_declined':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'work_completed':
        return <Package className="w-5 h-5 text-purple-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view notifications</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const readNotifications = notifications.filter(n => n.is_read);

  console.log(`🔍 Displaying ${unreadNotifications.length} unread, ${readNotifications.length} read (stable)`);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
            <p className="text-gray-500 mt-1">
              {unreadNotifications.length} unread notification{unreadNotifications.length !== 1 ? 's' : ''}
            </p>
          </div>
          {unreadNotifications.length > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              variant="outline"
              disabled={markAllAsReadMutation.isLoading}
            >
              Mark All as Read
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : notifications.length === 0 ? (
          <Card className="border-orange-100">
            <CardContent className="p-16 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No notifications yet</h3>
              <p className="text-gray-500">
                You'll see notifications here when you have activity on your items and agreements
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Unread Notifications */}
            {unreadNotifications.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  New ({unreadNotifications.length})
                </h2>
                <div className="space-y-3">
                  {unreadNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className="border-orange-200 bg-orange-50 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <h3 className="font-semibold text-gray-900">{notification.title}</h3>
                              <Badge className="bg-orange-500 text-white ml-2">New</Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{notification.message}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{format(new Date(notification.created_date), 'MMM d, h:mm a')}</span>
                              {notification.from_user_name && (
                                <>
                                  <span>•</span>
                                  <span>from {notification.from_user_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Read Notifications - STABLE SECTION */}
            {readNotifications.length > 0 && (
              <div className="opacity-100">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-gray-500" />
                  Earlier ({readNotifications.length})
                </h2>
                <div className="space-y-3">
                  {readNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer opacity-100"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1 opacity-60">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1">{notification.title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{format(new Date(notification.created_date), 'MMM d, h:mm a')}</span>
                              {notification.from_user_name && (
                                <>
                                  <span>•</span>
                                  <span>from {notification.from_user_name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}