import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, MapPin, Clock, Filter, Crosshair, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import ItemCard from "../components/browse/ItemCard";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";

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

export default function Browse() {
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("-created_date");
  const [maxDistance, setMaxDistance] = useState([50]);
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    base44.auth.me()
      .then(userData => {
        setUser(userData);
        if (userData.latitude && userData.longitude) {
          setUserLocation({ lat: userData.latitude, lng: userData.longitude });
          // Don't auto-enable location filter - let user choose
        }
      })
      .catch(() => setUser(null));
  }, []);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items', sortBy],
    queryFn: () => base44.entities.Item.filter({ status: "active" }, sortBy),
  });

  const { blockedUserIds } = useBlockedUsers(user?.id);

  // Fetch user's agreements for status indicators
  const { data: userAgreements = [] } = useQuery({
    queryKey: ['userAgreements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const [asWorker, asOfferer] = await Promise.all([
        base44.entities.Agreement.filter({ worker_id: user.id }),
        base44.entities.Agreement.filter({ offerer_id: user.id })
      ]);
      return [...asWorker, ...asOfferer];
    },
    enabled: !!user
  });

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
  };

  const filteredItems = items.filter(item => {
    // Hide items from blocked users
    if (blockedUserIds.includes(item.offerer_id)) return false;

    // Search filter
    const matchesSearch = searchTerm === "" || 
                         item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    // Distance filter - FIXED LOGIC
    let matchesDistance = true;
    if (useLocation && userLocation) {
      // If location filter is enabled, ONLY show items that have coordinates AND are within range
      if (!item.latitude || !item.longitude) {
        matchesDistance = false; // Exclude items without coordinates
      } else {
        const distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          item.latitude,
          item.longitude
        );
        matchesDistance = distance <= maxDistance[0];
      }
    }
    
    return matchesSearch && matchesCategory && matchesDistance;
  }).map(item => {
    // Add distance to items for display
    if (userLocation && item.latitude && item.longitude) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        item.latitude,
        item.longitude
      );
      return { ...item, distance: distance.toFixed(1) };
    }
    return item;
  });

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Hero Section */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Trade Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">Time</span> for Items
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Browse local items available in exchange for your skills and work hours. No money needed.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white rounded-2xl shadow-md p-6 border border-orange-100">
          <div className="flex flex-col gap-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search items by title or description..."
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
                className="h-12 px-8 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
              >
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            </div>

            {/* Active Search Term */}
            {searchTerm && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Searching for:</span>
                <Badge variant="outline" className="text-orange-600 border-orange-300">
                  "{searchTerm}"
                  <button
                    onClick={handleClearSearch}
                    className="ml-2 hover:text-orange-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              </div>
            )}

            {/* Filters Row */}
            <div className="flex flex-col md:flex-row gap-4">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Electronics">Electronics</SelectItem>
                  <SelectItem value="Home Goods">Home Goods</SelectItem>
                  <SelectItem value="Furniture">Furniture</SelectItem>
                  <SelectItem value="Appliances">Appliances</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created_date">Newest First</SelectItem>
                  <SelectItem value="required_hours">Fewest Hours</SelectItem>
                  <SelectItem value="-required_hours">Most Hours</SelectItem>
                </SelectContent>
              </Select>

              {useLocation && userLocation && (
                <Button
                  onClick={() => setUseLocation(false)}
                  variant="outline"
                  className="h-12 border-orange-300 text-orange-600 hover:bg-orange-50"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Within {maxDistance[0]} mi
                  <X className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Distance Filter */}
            {userLocation && useLocation && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Distance from your location
                  </Label>
                  <Badge variant="outline" className="text-orange-600 border-orange-300">
                    <MapPin className="w-3 h-3 mr-1" />
                    Within {maxDistance[0]} miles
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
                  <p className="font-medium">Enable location-based search</p>
                  <p className="text-blue-700 mt-1">
                    Filter items by distance to see only nearby opportunities.
                  </p>
                </div>
                <Button
                  onClick={() => setUseLocation(true)}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                >
                  Enable
                </Button>
              </div>
            )}

            {!userLocation && user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                <Crosshair className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-blue-900">
                  <p className="font-medium">Enable location-based search</p>
                  <p className="text-blue-700 mt-1">
                    Update your profile with your location to filter items by distance.
                  </p>
                </div>
                <Link to={createPageUrl("Profile")}>
                  <Button size="sm" className="whitespace-nowrap">
                    Update Profile
                  </Button>
                </Link>
              </div>
            )}

            {!user && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-start gap-3">
                <Crosshair className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-orange-900">
                  <p className="font-medium">Sign in for personalized results</p>
                  <p className="text-orange-700 mt-1">
                    Create an account to see items near you and start trading.
                  </p>
                </div>
                <Button 
                  onClick={() => base44.auth.redirectToLogin()}
                  size="sm"
                  className="bg-orange-600 hover:bg-orange-700 whitespace-nowrap"
                >
                  Sign In
                </Button>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredItems.length}</span> of <span className="font-semibold text-gray-900">{items.length}</span> items
                {useLocation && userLocation && ` within ${maxDistance[0]} miles`}
              </span>
              {(searchTerm || categoryFilter !== "all" || (useLocation && userLocation)) && (
                <Button
                  onClick={() => {
                    setSearchInput("");
                    setSearchTerm("");
                    setCategoryFilter("all");
                    setUseLocation(false);
                  }}
                  variant="ghost"
                  size="sm"
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Items Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-96 animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center">
              <Search className="w-12 h-12 text-orange-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No items found</h3>
            <p className="text-gray-500 mb-4">
              {useLocation && userLocation 
                ? `No items found within ${maxDistance[0]} miles of your location. Try increasing the distance or adjusting your filters.`
                : searchTerm 
                ? `No items match "${searchTerm}". Try different search terms.`
                : "Try adjusting your filters or search terms"
              }
            </p>
            <Button
              onClick={() => {
                setSearchInput("");
                setSearchTerm("");
                setCategoryFilter("all");
                if (useLocation && userLocation) {
                  setMaxDistance([100]);
                }
              }}
              className="bg-gradient-to-r from-orange-500 to-amber-600"
            >
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ItemCard 
                key={item.id} 
                item={item} 
                showDistance={useLocation && userLocation} 
                userAgreements={userAgreements}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}