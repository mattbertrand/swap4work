import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Filter, Briefcase, X, Crosshair } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import ServiceCard from "@/components/browse/ServiceCard";
import SignInPromptBanner from "@/components/browse/SignInPromptBanner";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from "@/i18n/LanguageContext";

// Calculate distance using Haversine
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export default function BrowseServices() {
  // Shared session from AuthProvider — no per-page auth fetch, no sign-in flash
  const { user } = useAuth();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("-created_date");
  const [maxDistance, setMaxDistance] = useState([50]);
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [acceptsFilter, setAcceptsFilter] = useState("all");

  // Sync the distance filter with the shared session's saved location
  useEffect(() => {
    if (user?.latitude && user?.longitude) {
      setUserLocation({ lat: user.latitude, lng: user.longitude });
    }
  }, [user]);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', sortBy],
    queryFn: () => base44.entities.Item.filter({ status: "active", listing_type: "service" }, sortBy),
  });

  const { blockedUserIds } = useBlockedUsers(user?.id);

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
  };

  const filteredServices = services.filter(service => {
    // Hide services hidden by moderation
    if (service.is_hidden) return false;

    // Hide services from blocked users
    if (blockedUserIds.includes(service.offerer_id)) return false;

    const matchesSearch = searchTerm === "" || 
                         service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    
    const matchesAccepts = acceptsFilter === "all" || service.accepts === acceptsFilter || service.accepts === "both";
    
    let matchesDistance = true;
    if (useLocation && userLocation) {
      if (!service.latitude || !service.longitude) {
        matchesDistance = false;
      } else {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          service.latitude,
          service.longitude
        );
        matchesDistance = distance <= maxDistance[0];
      }
    }
    
    return matchesSearch && matchesCategory && matchesDistance && matchesAccepts;
  }).map(service => {
    if (userLocation && service.latitude && service.longitude) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        service.latitude,
        service.longitude
      );
      return { ...service, distance: distance.toFixed(1) };
    }
    return service;
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t("browse.services_title_a")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">{t("browse.services_title_b")}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t("browse.services_sub")}
          </p>
        </div>

        <div className="mb-8 bg-white rounded-2xl shadow-md p-6 border border-blue-100">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder={t("browse.search_services")}
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                  className="pl-10 h-12 border-gray-200 pr-10"
                />
                {searchInput && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              <Button 
                onClick={handleSearch}
                className="h-12 px-8 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
              >
                <Search className="w-5 h-5 mr-2" />
                {t("common.search")}
              </Button>
            </div>

            {searchTerm && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">{t("browse.searching_for")}</span>
                <Badge variant="outline" className="text-blue-600 border-blue-300">
                  "{searchTerm}"
                  <button
                    onClick={handleClearSearch}
                    className="ml-2 hover:text-blue-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder={t("filter.category")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("browse.all_categories")}</SelectItem>
                  <SelectItem value="Home Repairs">{t("cat.Home Repairs")}</SelectItem>
                  <SelectItem value="Cleaning">{t("cat.Cleaning")}</SelectItem>
                  <SelectItem value="Yard Work">{t("cat.Yard Work")}</SelectItem>
                  <SelectItem value="Digital Services">{t("cat.Digital Services")}</SelectItem>
                  <SelectItem value="Tutoring">{t("cat.Tutoring")}</SelectItem>
                  <SelectItem value="Personal Assistance">{t("cat.Personal Assistance")}</SelectItem>
                  <SelectItem value="Creative Services">{t("cat.Creative Services")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={acceptsFilter} onValueChange={setAcceptsFilter}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue placeholder={t("filter.accepts")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.all_types")}</SelectItem>
                  <SelectItem value="item">{t("prefs.items_only")}</SelectItem>
                  <SelectItem value="service">{t("prefs.services_only")}</SelectItem>
                  <SelectItem value="both">{t("prefs.items_services")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue placeholder={t("filter.sort_by")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created_date">{t("sort.newest")}</SelectItem>
                  <SelectItem value="required_hours">{t("sort.fewest_hours")}</SelectItem>
                  <SelectItem value="-required_hours">{t("sort.most_hours")}</SelectItem>
                </SelectContent>
              </Select>

              {useLocation && userLocation && (
                <Button
                  onClick={() => setUseLocation(false)}
                  variant="outline"
                  className="h-12 border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {t("browse.within_mi", { n: maxDistance[0] })}
                  <X className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {userLocation && useLocation && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-700">
                    {t("browse.distance_from_location")}
                  </Label>
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    <MapPin className="w-3 h-3 mr-1" />
                    {t("browse.within_miles", { n: maxDistance[0] })}
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <Slider
                    value={maxDistance}
                    onValueChange={setMaxDistance}
                    min={5}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-medium text-gray-700 w-16 text-right">
                    {maxDistance[0]} mi
                  </span>
                </div>
              </div>
            )}

            {userLocation && !useLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-blue-900">
                  <p className="font-medium">{t("browse.enable_location_title")}</p>
                  <p className="text-blue-700 mt-1">
                    {t("browse.enable_location_sub_services")}
                  </p>
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

            {!userLocation && user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                <Crosshair className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-blue-900">
                  <p className="font-medium">{t("browse.enable_location_title")}</p>
                  <p className="text-blue-700 mt-1">
                    {t("browse.update_location_sub_services")}
                  </p>
                </div>
                <Link to={createPageUrl("Profile")}>
                  <Button size="sm" className="whitespace-nowrap">
                    {t("profile.update_profile")}
                  </Button>
                </Link>
              </div>
            )}

            {!user && (
              <SignInPromptBanner message={t("browse.guest_prompt_services")} />
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {useLocation && userLocation
                  ? t("browse.showing_within", { shown: filteredServices.length, total: services.length, miles: maxDistance[0] })
                  : t("browse.showing", { shown: filteredServices.length, total: services.length })}
              </span>
              {(searchTerm || categoryFilter !== "all" || acceptsFilter !== "all" || (useLocation && userLocation)) && (
                <Button
                  onClick={() => {
                    setSearchInput("");
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setAcceptsFilter("all");
                    setUseLocation(false);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  {t("filter.clear_all")}
                </Button>
              )}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-80 animate-pulse" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Briefcase className="w-12 h-12 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t("browse.no_services")}</h3>
            <p className="text-gray-500 mb-4">
              {t("browse.no_items_default")}
            </p>
            <Button
              onClick={() => {
                setSearchInput("");
                setSearchTerm("");
                setCategoryFilter("all");
                setAcceptsFilter("all");
                setUseLocation(false);
              }}
              className="bg-gradient-to-r from-blue-500 to-cyan-600"
            >
              {t("filter.clear")}
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}