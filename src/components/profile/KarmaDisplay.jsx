import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Award, AlertTriangle } from "lucide-react";
import { useLanguage } from '@/i18n/LanguageContext';
import { formatDate } from '@/i18n/formatters';

export default function KarmaDisplay({ karma, user, showDetails = true }) {
  const { t, tn, locale } = useLanguage();
  // Support both 'karma' prop (number) and 'user' prop (object)
  const karmaPoints = karma !== undefined ? karma : (user?.karma_points || 0);
  
  const getKarmaTier = (points) => {
    if (points >= 100) return { label: t('trust.elite'), color: "bg-purple-100 text-purple-700", icon: Award };
    if (points >= 50) return { label: t('trust.trusted'), color: "bg-blue-100 text-blue-700", icon: TrendingUp };
    if (points >= 10) return { label: t('trust.reliable'), color: "bg-green-100 text-green-700", icon: TrendingUp };
    if (points >= 0) return { label: t('common.new_member'), color: "bg-gray-100 text-gray-700", icon: TrendingUp };
    return { label: t('trust.review'), color: "bg-red-100 text-red-700", icon: AlertTriangle };
  };

  const tier = getKarmaTier(karmaPoints);
  const Icon = tier.icon;

  return (
    <Card className="border-orange-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${karmaPoints >= 0 ? 'text-orange-600' : 'text-red-600'}`} />
            <span className="font-semibold text-gray-900">{t('trust.title')}</span>
          </div>
          <Badge className={tier.color}>
            {tier.label}
          </Badge>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{new Intl.NumberFormat(locale).format(karmaPoints)}</span>
          <span className="text-sm text-gray-500">{t('trust.points')}</span>
        </div>

        {showDetails && user && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            {karmaPoints < 0 && user.is_suspended && (
              <div className="flex items-start gap-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  {t('trust.suspended', { date: user.suspension_end_date ? formatDate(user.suspension_end_date, locale) : t('trust.admin_review') })}
                </p>
              </div>
            )}
            
            {user.cancellation_count > 0 && (
              <p className="text-xs text-gray-500">
                {tn('trust.cancellations', user.cancellation_count)}
              </p>
            )}

            <p className="text-xs text-gray-500">
              {t('trust.earn')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}