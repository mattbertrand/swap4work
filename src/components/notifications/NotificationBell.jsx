import React from "react";
import useNotificationCount from '@/hooks/useNotificationCount';
import { useLanguage } from '@/i18n/LanguageContext';
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NotificationBell({ user }) {
  const { t, tn } = useLanguage();
  const { data: unreadCount = 0 } = useNotificationCount(user?.id);

  return (
    <Link to={createPageUrl("Notifications")} className="relative" aria-label={`${t('nav.notifications')}: ${tn('notif.unread', unreadCount)}`}>
      <span className="inline-flex p-2 hover:bg-orange-100 rounded-lg transition-colors relative">
        <Bell className="w-5 h-5 text-gray-700" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </span>
    </Link>
  );
}