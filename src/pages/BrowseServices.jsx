import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, MapPin, Clock, Filter, Briefcase, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

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
        }
      })
      .catch(() => setUser(null));
  }, []);

  const { data: services = [], isLoading } = useQuery({
    queryKey: ['services', sortBy],
    queryFn: () => base44.entities.Service.filter({ status: "active" }, sortBy),
  });

  const handleSearch = () => {
    setSearchTerm(searchInput.trim());
  };

  const handleClearSearch = () => {
    setSearchInput("");
    setSearchTerm("");
  };

  const filteredServices = services.filter(service => {
    const matchesSearch = searchTerm === "" || 
                         service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         service.skills?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || service.category === categoryFilter;
    
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
    
    return matchesSearch && matchesCategory && matchesDistance;
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
            Browse <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">Services</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find services offered by community members in exchange for your items or services.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white rounded-2xl shadow-md p-6 border border-blue-100">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search services..."
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
                Search
              </Button>
            </div>

            {searchTerm && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Searching for:</span>
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
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Home Repairs">Home Repairs</SelectItem>
                  <SelectItem value="Cleaning">Cleaning</SelectItem>
                  <SelectItem value="Outdoor Work">Outdoor Work</SelectItem>
                  <SelectItem value="Errands">Errands</SelectItem>
                  <SelectItem value="Moving">Moving</SelectItem>
                  <SelectItem value="Digital Services">Digital Services</SelectItem>
                  <SelectItem value="Tutoring">Tutoring</SelectItem>
                  <SelectItem value="Creative">Creative</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full md:w-48 h-12">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-created_date">Newest First</SelectItem>
                  <SelectItem value="hours_offered">Fewest Hours</SelectItem>
                  <SelectItem value="-hours_offered">Most Hours</SelectItem>
                </SelectContent>
              </Select>

              {useLocation && userLocation && (
                <Button
                  onClick={() => setUseLocation(false)}
                  variant="outline"
                  className="h-12 border-blue-300 text-blue-600 hover:bg-blue-50"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Within {maxDistance[0]} mi
                  <X className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {userLocation && useLocation && (
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Distance from your location
                  </Label>
                  <Badge variant="outline" className="text-blue-600 border-blue-300">
                    <MapPin className="w-3 h-3 mr-1" />
                    Within {maxDistance[0]} miles
                  </Badge>
                </div>
                <Slider
                  value={maxDistance}
                  onValueChange={setMaxDistance}
                  min={5}
                  max={100}
                  step={5}
                  className="flex-1"
                />
              </div>
            )}

            {userLocation && !useLocation && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1 text-sm text-blue-900">
                  <p className="font-medium">Enable location-based search</p>
                  <p className="text-blue-700 mt-1">
                    Filter services by distance to see only nearby opportunities.
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
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                Showing <span className="font-semibold text-gray-900">{filteredServices.length}</span> of <span className="font-semibold text-gray-900">{services.length}</span> services
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
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Clear All Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-96 animate-pulse" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-16">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service) => (
              <Link key={service.id} to={createPageUrl(`ServiceDetail?id=${service.id}`)}>
                <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-blue-100 bg-white h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <Badge className="bg-blue-100 text-blue-700">
                        {service.category}
                      </Badge>
                      <Badge variant="outline">
                        {service.wants_in_return === "both" ? "Item/Service" : 
                         service.wants_in_return === "item" ? "Wants Item" : "Wants Service"}
                      </Badge>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                      {service.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                      {service.description}
                    </p>

                    {service.skills && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {service.skills.split(',').slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {skill.trim()}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-blue-600 font-bold">
                        <Clock className="w-5 h-5" />
                        <span>{service.hours_offered}h</span>
                      </div>
                      {service.distance && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span>{service.distance} mi</span>
                        </div>
                      )}
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