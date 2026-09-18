import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { parseSkills } from "@/lib/skills";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock, MapPin, Star, CheckCircle2, Users } from "lucide-react";

// Calculate distance between two coordinates using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get approximate location (city/state) — never an exact address
const getApproximateLocation = (fullLocation) => {
  if (!fullLocation) return null;
  const parts = fullLocation.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ');
  }
  return fullLocation;
};

export default function NearbyWorkers() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ["workers"],
    queryFn: async () => {
      try {
        return await base44.entities.Worker.filter({ is_visible: true });
      } catch (error) {
        console.log("Could not fetch workers list", error);
        return [];
      }
    },
  });

  const workers = React.useMemo(() => {
    const potentialWorkers = allUsers.filter(
      (w) => w.is_visible && w.user_id !== user?.id
    );

    if (user?.latitude && user?.longitude) {
      return potentialWorkers
        .map((worker) => {
          if (!worker.latitude || !worker.longitude) return { ...worker, distance: null };
          const distance = calculateDistance(
            user.latitude, user.longitude, worker.latitude, worker.longitude
          );
          return { ...worker, distance: distance.toFixed(1) };
        })
        .filter((worker) => worker.distance && parseFloat(worker.distance) <= 100)
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
        .slice(0, 6);
    }

    return potentialWorkers.slice(0, 6);
  }, [allUsers, user?.latitude, user?.longitude, user?.id]);

  return (
    <div className="py-16 px-4 bg-white border-t border-orange-100">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-12 gap-4">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Skilled People {user?.latitude && user?.longitude ? "Near You" : "in Your Area"}
            </h2>
            <p className="text-gray-600">
              {user?.latitude && user?.longitude
                ? "Members within 100 miles offering their skills and time"
                : "People offering their skills and time for items they need"}
            </p>
          </div>
          <Link to={createPageUrl("BrowseUsers")} className="hidden md:block">
            <Button variant="outline" className="bg-white hover:bg-gray-50 text-blue-600 border-blue-200 hover:border-blue-300">
              View All People
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-100 rounded-2xl h-64 animate-pulse" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {user?.latitude && user?.longitude
                ? "No members found within 100 miles"
                : "No visible member profiles yet"}
            </h3>
            <p className="text-gray-500 mb-4">
              {user?.latitude && user?.longitude
                ? "Try browsing items — new people join as the community grows"
                : "As members complete their profiles, their skills appear here"}
            </p>
            {user && !user.profile_completed && (
              <Link to={createPageUrl("Profile")}>
                <Button className="bg-orange-600 hover:bg-orange-700">
                  Complete Your Profile
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workers.map((worker) => (
              <Link key={worker.id} to={createPageUrl(`PublicProfile?userId=${worker.user_id}`)}>
                <Card className="hover:shadow-xl transition-shadow border-orange-100">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {worker.photo_url ? (
                        <img
                          src={worker.photo_url}
                          alt={worker.full_name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-orange-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xl font-bold">
                            {worker.full_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 truncate">{worker.full_name}</h3>
                        </div>
                        {worker.rating > 0 && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-sm font-semibold">{worker.rating.toFixed(1)}</span>
                            <span className="text-sm text-gray-500">({worker.total_ratings})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{worker.bio || "No bio available"}</p>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {parseSkills(worker.skills).slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-lg font-bold">{worker.hours_completed || 0}</span>
                        </div>
                        <span className="text-xs text-gray-500">Hours Worked</span>
                      </div>
                      <div className="text-center">
                        <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                          <Star className="w-4 h-4" />
                          <span className="text-lg font-bold">{worker.total_ratings || 0}</span>
                        </div>
                        <span className="text-xs text-gray-500">Reviews</span>
                      </div>
                    </div>

                    {(worker.distance || worker.location) && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-orange-600" />
                          <span className="font-medium">
                            {worker.distance
                              ? `${worker.distance} miles away`
                              : getApproximateLocation(worker.location)}
                          </span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:hidden">
          <Link to={createPageUrl("BrowseUsers")}>
            <Button variant="outline" className="bg-white text-blue-600 border-blue-200">
              View All People
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}