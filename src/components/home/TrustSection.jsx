import React from "react";
import { base44 } from "@/api/base44Client";
import { displayName } from "@/lib/names";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, Package, Users, TrendingUp } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

// Every metric on this page comes from live database records, and every
// sample/demo record (marked is_hidden) is excluded. Nothing is hardcoded,
// and no placeholder rating is shown when genuine data doesn't exist yet.
export default function TrustSection() {
  const { t } = useLanguage();
  // Active, genuine item listings (sample listings are hidden and excluded)
  const { data: activeItemCount = 0 } = useQuery({
    queryKey: ["statsActiveItems"],
    queryFn: () =>
      base44.entities.Item.count({
        status: "active",
        listing_type: "item",
        is_hidden: { $ne: true },
      }),
  });

  // Member profiles completed by registered members
  const { data: members = [] } = useQuery({
    queryKey: ["statsMembers"],
    queryFn: () => base44.entities.Worker.list(),
  });

  // Completed agreements, excluding those reserved over hidden sample listings
  const { data: completedAgreements = [] } = useQuery({
    queryKey: ["statsCompleted"],
    queryFn: () => base44.entities.Agreement.filter({ status: "completed" }),
  });

  const { data: hiddenItems = [] } = useQuery({
    queryKey: ["statsHiddenItems"],
    queryFn: () => base44.entities.Item.filter({ is_hidden: true }),
  });

  const completedExchanges = React.useMemo(() => {
    const hiddenIds = new Set(hiddenItems.map((i) => i.id));
    return completedAgreements.filter((a) => !hiddenIds.has(a.item_id));
  }, [completedAgreements, hiddenItems]);

  // Ratings tied to genuine completed exchanges only
  const { data: allRatings = [] } = useQuery({
    queryKey: ["statsRatings"],
    queryFn: () => base44.entities.Rating.filter({ published: true }),
  });

  const genuineRatings = React.useMemo(() => {
    const validAgreementIds = new Set(completedExchanges.map((a) => a.id));
    return allRatings
      .filter((r) => validAgreementIds.has(r.agreement_id))
      .sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [allRatings, completedExchanges]);

  const avgRating = React.useMemo(() => {
    if (!genuineRatings.length) return null;
    return (genuineRatings.reduce((sum, r) => sum + r.stars, 0) / genuineRatings.length).toFixed(1);
  }, [genuineRatings]);

  const stats = [
    { icon: Package, color: "bg-orange-100 text-orange-600", value: activeItemCount, label: t("home.stat_active_items") },
    { icon: Users, color: "bg-blue-100 text-blue-600", value: members.length, label: t("home.stat_members") },
    { icon: CheckCircle2, color: "bg-green-100 text-green-600", value: completedExchanges.length, label: t("home.stat_completed") },
    {
      icon: TrendingUp,
      color: "bg-purple-100 text-purple-600",
      value: avgRating ?? t("home.not_yet_rated"),
      label: t("home.stat_rating"),
    },
  ];

  return (
    <div className="py-16 px-4 bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t("home.trust_title")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("home.trust_sub")}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-14">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div className={`w-16 h-16 ${s.color} rounded-full flex items-center justify-center mx-auto mb-3`}>
                <s.icon className="w-8 h-8" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{s.value}</div>
              <div className="text-gray-600 text-sm">{s.label}</div>
            </div>
          ))}
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">{t("home.community_says")}</h3>
        <p className="text-gray-600 text-center mb-8">{t("home.reviews_from")}</p>

        {genuineRatings.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-orange-100 max-w-xl mx-auto">
            <Star className="w-12 h-12 mx-auto mb-3 text-orange-200" />
            <p className="text-gray-600 text-sm">
              {t("home.reviews_empty")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {genuineRatings.slice(0, 6).map((rating) => (
              <Card key={rating.id} className="bg-white border-orange-100 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < rating.stars ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                          }`}
                        />
                      ))}
                    </div>
                    <Badge className="bg-green-100 text-green-700 border-0">
                      {t("home.completed_exchange")}
                    </Badge>
                  </div>

                  <p className="text-gray-700 text-sm mb-4 line-clamp-4">"{rating.review}"</p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{displayName(rating.from_user_name)}</p>
                      <p className="text-xs text-gray-500">{t("home.reviewed", { name: displayName(rating.to_user_name) })}</p>
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}