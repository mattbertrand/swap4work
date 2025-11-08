import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Award, AlertTriangle } from "lucide-react";

export default function KarmaDisplay({ user, showDetails = true }) {
  const karmaPoints = user.karma_points || 0;
  
  const getKarmaTier = (points) => {
    if (points >= 100) return { label: "Elite Trader", color: "bg-purple-100 text-purple-700", icon: Award };
    if (points >= 50) return { label: "Trusted Member", color: "bg-blue-100 text-blue-700", icon: TrendingUp };
    if (points >= 10) return { label: "Reliable Trader", color: "bg-green-100 text-green-700", icon: TrendingUp };
    if (points >= 0) return { label: "New Member", color: "bg-gray-100 text-gray-700", icon: TrendingUp };
    return { label: "Under Review", color: "bg-red-100 text-red-700", icon: AlertTriangle };
  };

  const tier = getKarmaTier(karmaPoints);
  const Icon = tier.icon;

  return (
    <Card className="border-orange-100">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Icon className={`w-5 h-5 ${karmaPoints >= 0 ? 'text-orange-600' : 'text-red-600'}`} />
            <span className="font-semibold text-gray-900">Trust Score</span>
          </div>
          <Badge className={tier.color}>
            {tier.label}
          </Badge>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-gray-900">{karmaPoints}</span>
          <span className="text-sm text-gray-500">karma points</span>
        </div>

        {showDetails && (
          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
            {karmaPoints < 0 && user.is_suspended && (
              <div className="flex items-start gap-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  Account suspended until {user.suspension_end_date ? new Date(user.suspension_end_date).toLocaleDateString() : 'admin review'}
                </p>
              </div>
            )}
            
            {user.cancellation_count > 0 && (
              <p className="text-xs text-gray-500">
                {user.cancellation_count} mid-agreement cancellation{user.cancellation_count > 1 ? 's' : ''}
              </p>
            )}

            <p className="text-xs text-gray-500">
              Earn karma by completing agreements and maintaining good standing
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}