import React from "react";
import { base44 } from "@/api/base44Client";
import { displayName } from "@/lib/names";
import { useAuth } from "@/lib/AuthContext";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useNotificationCount from '@/hooks/useNotificationCount';
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { authLoginUrl } from "@/lib/authNavigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, MessageSquare, Clock, CheckCircle2, AlertCircle, Package } from "lucide-react";
import { formatDateTime } from '@/i18n/formatters';
import { useLanguage } from "@/i18n/LanguageContext";

export default function Notifications() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, tn, lang, locale } = useLanguage();
  // Session is shared and already resolved by AuthProvider before routes
  // render, so an authenticated user never briefly sees the sign-in prompt.
  const { user, isLoadingAuth } = useAuth();

  const { data: unreadCount = 0 } = useNotificationCount(user?.id);
  const fetchPage = async (isRead, cursor) => {
    const res = await base44.functions.invoke('getLocalizedNotifications', { language: lang, is_read: isRead, ...(cursor ? { cursor } : {}) });
    return res.data;
  };
  const unreadQuery = useInfiniteQuery({ queryKey: ['unreadNotifications', user?.id, lang], queryFn: ({ pageParam }) => fetchPage(false, pageParam), initialPageParam: null, getNextPageParam: page => page.has_more ? page.next_cursor : undefined, enabled: !!user });
  const readQuery = useInfiniteQuery({ queryKey: ['readNotifications', user?.id, lang], queryFn: ({ pageParam }) => fetchPage(true, pageParam), initialPageParam: null, getNextPageParam: page => page.has_more ? page.next_cursor : undefined, enabled: !!user });
  const unreadNotifications = unreadQuery.data?.pages.flatMap(page => page.items) || [];
  const readNotifications = readQuery.data?.pages.flatMap(page => page.items) || [];
  const unreadLoading = unreadQuery.isLoading;
  const readLoading = readQuery.isLoading;

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => {
      console.log('✓ Marking notification as read:', notificationId);
      return base44.entities.Notification.update(notificationId, { is_read: true });
    },
    onSuccess: () => {
      console.log('✅ Notification marked as read, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications', user.id] });
      queryClient.invalidateQueries({ queryKey: ['readNotifications', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount', user.id] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      console.log(`✓ Marking ${unreadNotifications.length} notifications as read`);
      let result;
      do {
        result = await base44.entities.Notification.updateMany({ user_id: user.id, is_read: false }, { $set: { is_read: true } });
      } while (result.has_more);
    },
    onSuccess: () => {
      console.log('✅ All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['unreadNotifications', user.id] });
      queryClient.invalidateQueries({ queryKey: ['readNotifications', user.id] });
      queryClient.invalidateQueries({ queryKey: ['notificationCount', user.id] });
    }
  });

  const handleNotificationClick = async (notification) => {
    console.log('👆 Notification clicked:', notification.id);
    
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

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{t("notif.sign_in_prompt")}</p>
          <Button onClick={() => navigate(authLoginUrl(window.location.pathname + window.location.search))}>
            {t("nav.sign_in")}
          </Button>
        </div>
      </div>
    );
  }

  const isLoading = unreadLoading || readLoading;
  console.log(`🔍 Rendering: ${unreadNotifications.length} unread, ${readNotifications.length} read (STABLE)`);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t("nav.notifications")}</h1>
            <p className="text-gray-500 mt-1">
              {tn('notif.unread', unreadCount)}
            </p>
          </div>
          {unreadNotifications.length > 0 && (
            <Button
              onClick={() => markAllAsReadMutation.mutate()}
              variant="outline"
              disabled={markAllAsReadMutation.isPending}
            >
              {t("notif.mark_all_read")}
            </Button>
          )}
        </div>

        {(unreadQuery.isError || readQuery.isError) && <p role="alert" className="mb-4 text-destructive">{t('notif.load_error')} <Button variant="outline" onClick={() => { unreadQuery.refetch(); readQuery.refetch(); }}>{t('common.retry')}</Button></p>}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          </div>
        ) : unreadNotifications.length === 0 && readNotifications.length === 0 ? (
          <Card className="border-orange-100">
            <CardContent className="p-16 text-center">
              <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("notif.no_notifications")}</h3>
              <p className="text-gray-500">
                {t("notif.no_notifications_sub")}
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
                  {t("notif.new_section", { n: unreadNotifications.length })}
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
                              <h3 className="font-semibold text-gray-900">{notification.display_title}</h3>
                              <Badge className="bg-orange-500 text-white ml-2">{t("notif.new_badge")}</Badge>
                            </div>
                            <p className="text-sm text-gray-700 mb-2">{notification.display_message}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatDateTime(notification.created_date, locale)}</span>
                              {notification.from_user_name && (
                                <>
                                  <span>•</span>
                                  <span>{t("notif.from", { name: displayName(notification.from_user_name) })}</span>
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

            {/* Read Notifications - PERMANENTLY STABLE */}
            {readNotifications.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-gray-500" />
                  {t("notif.earlier", { n: readNotifications.length })}
                </h2>
                <div className="space-y-3">
                  {readNotifications.map((notification) => (
                    <Card
                      key={notification.id}
                      className="border-gray-200 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 mt-1 opacity-60">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 mb-1">{notification.display_title}</h3>
                            <p className="text-sm text-gray-600 mb-2">{notification.display_message}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatDateTime(notification.created_date, locale)}</span>
                              {notification.from_user_name && (
                                <>
                                  <span>•</span>
                                  <span>{t("notif.from", { name: displayName(notification.from_user_name) })}</span>
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
        {unreadQuery.hasNextPage && <Button variant="outline" disabled={unreadQuery.isFetchingNextPage} onClick={() => unreadQuery.fetchNextPage()}>{t('common.load_more')} · {t('notif.new_badge')}</Button>}
        {readQuery.hasNextPage && <Button variant="outline" disabled={readQuery.isFetchingNextPage} onClick={() => readQuery.fetchNextPage()}>{t('common.load_more')}</Button>}
      </div>
    </div>
  );
}