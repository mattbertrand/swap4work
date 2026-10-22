import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { displayName } from "@/lib/names";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { parseSkills } from "@/lib/skills";
import { formatPublicLocation } from "@/lib/location";
import { Search, MapPin, Star, Filter, Users, ArrowRight, X, Plus, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import SignInPromptBanner from "@/components/browse/SignInPromptBanner";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";
import LocationCheckedBadge from "@/components/location/LocationCheckedBadge";

// Calculate distance between two coordinates
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

export default function BrowseUsers() {
  // Shared session from AuthProvider — no per-page auth fetch, no sign-in flash
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [maxDistance, setMaxDistance] = useState([50]);
  const [useLocation, setUseLocation] = useState(false);



  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      try {
        // Fetch from the new Worker entity
        return await base44.entities.Worker.filter({ is_visible: true });
      } catch (error) {
        console.error('Could not fetch users', error);
        return [];
      }
    },
  });

  const { blockedUserIds } = useBlockedUsers(user?.id);

  const handleSearch = () => {
    setSearchTerm(searchInput.trim().toLowerCase());
  };

  const filteredUsers = React.useMemo(() => {
    let users = allUsers.filter(u => {
    // Basic validation
    if (!u.full_name) return false;
    
    // Hide own profile
    if (user && u.user_id === user.id) return false;

    // Hide blocked users
    if (blockedUserIds.includes(u.user_id)) return false;

    // Search filter
      if (searchTerm) {
        const nameMatch = u.full_name?.toLowerCase().includes(searchTerm);
        const bioMatch = u.bio?.toLowerCase().includes(searchTerm);
        const skillsMatch = u.skills?.toLowerCase().includes(searchTerm);
        if (!nameMatch && !bioMatch && !skillsMatch) return false;
      }
      
      return true;
    });

    // Add distance if current user has location
    if (user?.latitude && user?.longitude) {
      users = users.map(u => {
        if (u.latitude && u.longitude) {
          const dist = calculateDistance(user.latitude, user.longitude, u.latitude, u.longitude);
          return { ...u, distance: dist.toFixed(1) };
        }
        return u;
      });
      
      // Filter by distance if enabled
      if (useLocation) {
        users = users.filter(u => u.distance && parseFloat(u.distance) <= maxDistance[0]);
      }
    }

    // Sort
    users.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === 'distance' && user?.latitude) {
        if (!a.distance) return 1;
        if (!b.distance) return -1;
        return parseFloat(a.distance) - parseFloat(b.distance);
      } else if (sortBy === 'completed') {
        return (b.completed_trades || 0) - (a.completed_trades || 0);
      }
      return 0;
    });

    return users;
  }, [allUsers, searchTerm, user, sortBy, useLocation, maxDistance]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              {t("people.find_title_a")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">{t("people.find_title_b")}</span>
            </h1>
            <Link to={createPageUrl("Profile")}>
              <Button className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                {t("people.offer_services")}
              </Button>
            </Link>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto md:mx-0 mb-8 text-center md:text-left">
            {t("people.sub")}
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white rounded-2xl shadow-md p-6 border border-blue-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder={t("people.search_placeholder")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-12"
                />
              </div>
              <Button onClick={handleSearch} className="h-12 px-6 bg-blue-600 hover:bg-blue-700">
                {t("common.search")}
              </Button>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <SelectValue placeholder={t("filter.sort_by")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">{t("sort.highest_rated")}</SelectItem>
                <SelectItem value="completed">{t("sort.most_active")}</SelectItem>
                {user?.latitude && <SelectItem value="distance">{t("sort.nearest")}</SelectItem>}
              </SelectContent>
            </Select>

            {user?.latitude && user?.longitude && (
              <Button
                onClick={() => setUseLocation(!useLocation)}
                variant={useLocation ? "secondary" : "outline"}
                className={`h-12 px-4 ${useLocation ? 'bg-blue-100 text-blue-700 border-blue-200' : ''}`}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {useLocation ? t("browse.within_mi", { n: maxDistance[0] }) : t("people.filter_by_distance")}
                {useLocation && <X className="w-4 h-4 ml-2" />}
              </Button>
            )}
          </div>

          {/* Distance Filter Slider */}
          {useLocation && user?.latitude && (
            <div className="mt-6 pt-6 border-t border-gray-100 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-700">{t("people.max_distance")}</span>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                  {t("browse.within_miles", { n: maxDistance[0] })}
                </Badge>
              </div>
              <Slider
                value={maxDistance}
                onValueChange={setMaxDistance}
                min={1}
                max={100}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{t("listing.mi_away", { mi: 1 })}</span>
                <span>{t("listing.mi_away", { mi: 100 })}</span>
              </div>
            </div>
          )}

          {/* Enable Location banner */}
          {user?.latitude && user?.longitude && !useLocation && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-blue-900">
                <p className="font-medium">{t("browse.enable_location_title")}</p>
                <p className="text-blue-700 mt-1">{t("browse.enable_location_sub_people")}</p>
              </div>
              <Button
                onClick={() => setUseLocation(true)}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
              >
                {t("common.enable")}
              </Button>
            </div>
          )}

          {!user?.latitude && user && (
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
              <Crosshair className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 text-sm text-blue-900">
                <p className="font-medium">{t("browse.enable_location_title")}</p>
                <p className="text-blue-700 mt-1">{t("browse.update_location_sub_people")}</p>
              </div>
              <Link to={createPageUrl("Profile")}>
                <Button size="sm" className="whitespace-nowrap">
                  {t("profile.update_profile")}
                </Button>
              </Link>
            </div>
          )}

          {!user && (
            <div className="mt-6">
              <SignInPromptBanner message={t("browse.guest_prompt_people")} />
            </div>
          )}
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-16">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t("people.no_people")}</h3>
            <p className="text-gray-500">{t("people.no_people_sub")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(worker => (
              <Link key={worker.id} to={createPageUrl(`PublicProfile?userId=${worker.user_id}&workerId=${worker.id}&name=${encodeURIComponent(displayName(worker.full_name || ''))}`)}>

                <Card className="hover:shadow-xl transition-shadow border-blue-100 cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {worker.photo_url ? (
                        <img
                          src={worker.photo_url}
                          alt={worker.full_name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xl font-bold">
                            {worker.full_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg text-gray-900 truncate">{displayName(worker.full_name)}</h3>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          {formatPublicLocation(worker.location) && (
                            <span className="flex items-center gap-1 truncate text-sm text-gray-600">
                              <MapPin className="w-3 h-3" />
                              {formatPublicLocation(worker.location)}
                            </span>
                          )}
                        </div>
                        <div className="mb-1">
                          <LocationCheckedBadge userId={worker.user_id} location={worker.location} className="text-[10px] px-1.5 py-0" />
                        </div>
                        {Array.isArray(worker.exchange_areas) && worker.exchange_areas.length > 0 && (
                          <p className="text-xs text-gray-500 mb-1 truncate">{t("people.also_exchanges_in", { areas: worker.exchange_areas.join(" · ") })}</p>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          {worker.rating > 0 && (
                            <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                              <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                              {worker.rating.toFixed(1)} <span className="text-gray-400 font-normal">({worker.total_ratings})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {worker.bio || t("people.no_bio")}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {(() => {
                        const skills = parseSkills(worker.skills);
                        return (
                          <>
                            {skills.slice(0, 3).map((skill, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                {skill}
                              </Badge>
                            ))}
                            {skills.length > 3 && (
                              <Badge variant="outline" className="text-xs text-gray-500">
                                {t("people.more_skills", { n: skills.length - 3 })}
                              </Badge>
                            )}
                          </>
                        );
                      })()}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        {t("people.trades_completed", { n: worker.completed_trades || 0 })}
                      </div>
                      <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto font-medium">
                        {t("people.view_profile")} <ArrowRight className="w-3 h-3 ml-1" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}