import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle2, Package, Users, TrendingUp } from "lucide-react";

export default function TrustSection() {
  const { data: allActiveItems = [] } = useQuery({
    queryKey: ["allActiveItems"],
    queryFn: () => base44.entities.Item.filter({ status: "active" }),
  });

  const { data: allMembers = [] } = useQuery({
    queryKey: ["allMembers"],
    queryFn: () => base44.entities.Worker.list(),
  });

  const { data: completedAgreements = [] } = useQuery({
    queryKey: ["completedAgreements"],
    queryFn: () => base44.entities.Agreement.filter({ status: "completed" }),
  });

  const { data: allRatings = [] } = useQuery({
    queryKey: ["allRatings"],
    queryFn: () => base44.entities.Rating.filter({ published: true }),
  });

  const { data: recentRatings = [], isLoading: ratingsLoading } = useQuery({
    queryKey: ["recentRatings"],
    queryFn: () => base44.entities.Rating.filter({ published: true }, "-created_date", 6),
  });

  const avgRating = React.useMemo(() => {
    if (!allRatings.length) return null;
    return (allRatings.reduce((sum, r) => sum + r.stars, 0) / allRatings.length).toFixed(1);
  }, [allRatings]);

  const stats = [
    { icon: Package, color: "bg-orange-100 text-orange-600", value: allActiveItems.filter((i) => !i.is_hidden).length, label: "Active Items" },
    { icon: Users, color: "bg-blue-100 text-blue-600", value: allMembers.length, label: "Community Members" },
    { icon: CheckCircle2, color: "bg-green-100 text-green-600", value: completedAgreements.length, label: "Completed Trades" },
    { icon: TrendingUp, color: "bg-purple-100 text-purple-600", value: avgRating ?? "—", label: "Avg Rating" },
  ];

  return (
    <div className="py-16 px-4 bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Built on Real Exchanges
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Reputation here comes from finished work — reviews, hours, and
            completed trades from real members.
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

        <h3 className="text-2xl font-bold text-gray-900 mb-2 text-center">What Our Community Says</h3>
        <p className="text-gray-600 text-center mb-8">Reviews from completed exchanges</p>

        {ratingsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
            ))}
          </div>
        ) : recentRatings.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-orange-100 max-w-xl mx-auto">
            <Star className="w-12 h-12 mx-auto mb-3 text-orange-200" />
            <p className="text-gray-600 text-sm">
              Reviews appear here as members complete their first exchanges.
              Every finished exchange builds a member's reputation.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentRatings.map((rating) => (
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
                      Completed exchange
                    </Badge>
                  </div>

                  <p className="text-gray-700 text-sm mb-4 line-clamp-4">"{rating.review}"</p>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{rating.from_user_name}</p>
                      <p className="text-xs text-gray-500">reviewed {rating.to_user_name}</p>
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