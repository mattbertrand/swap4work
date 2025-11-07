import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, MapPin, Clock, Filter, Crosshair } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import ItemCard from "../components/browse/ItemCard";

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
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortBy, setSortBy] = useState("-created_date");
  const [maxDistance, setMaxDistance] = useState([50]); // miles
  const [useLocation, setUseLocation] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  useEffect(() => {
    base44.auth.me()
      .then(userData => {
        setUser(userData);
        if (userData.latitude && userData.longitude) {
          setUserLocation({ lat: userData.latitude, lng: userData.longitude });
          setUseLocation(true);
        }
      })
      .catch(() => setUser(null));
  }, []);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['items'],
    queryFn: () => base44.entities.Item.filter({ status: "active" }, sortBy),
  });

  const filteredItems = items.filter(item => {
    const matchesSearch = item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    
    let matchesDistance = true;
    if (useLocation && userLocation && item.latitude && item.longitude) {
      const distance = calculateDistance(
        userLocation.lat,
        userLocation.lng,
        item.latitude,
        item.longitude
      );
      matchesDistance = distance <= maxDistance[0];
    }
    
    return matchesSearch && matchesCategory && matchesDistance;
  }).map(item => {
    // Add distance to each item for display
    if (useLocation && userLocation && item.latitude && item.longitude) {
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
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search items..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-12 border-gray-200"
                />
              </div>
              
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
            </div>

            {/* Distance Filter */}
            {userLocation && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="useLocation"
                      checked={useLocation}
                      onChange={(e) => setUseLocation(e.target.checked)}
                      className="w-4 h-4 text-orange-600 rounded"
                    />
                    <label htmlFor="useLocation" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Filter by distance from my location
                    </label>
                  </div>
                  {useLocation && (
                    <Badge variant="outline" className="text-orange-600 border-orange-300">
                      <MapPin className="w-3 h-3 mr-1" />
                      Within {maxDistance[0]} miles
                    </Badge>
                  )}
                </div>
                {useLocation && (
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
                )}
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
                  <button className="text-sm font-medium text-blue-600 hover:text-blue-700 whitespace-nowrap">
                    Update Profile
                  </button>
                </Link>
              </div>
            )}
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {filteredItems.length} of {items.length} items
            {useLocation && userLocation && ` within ${maxDistance[0]} miles`}
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
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <ItemCard key={item.id} item={item} showDistance={useLocation && userLocation} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}