import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, MapPin, Star, Filter, Users, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: allUsers = [], isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      try {
        return await base44.auth.listUsers();
      } catch (error) {
        console.error('Could not fetch users', error);
        return [];
      }
    },
  });

  const handleSearch = () => {
    setSearchTerm(searchInput.trim().toLowerCase());
  };

  const filteredUsers = React.useMemo(() => {
    let users = allUsers.filter(u => {
      // Basic validation - must have profile completed
      if (!u.profile_completed) return false;
      
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
  }, [allUsers, searchTerm, user, sortBy]);

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Skilled <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-600">People</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Connect with local community members ready to help with your tasks.
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 bg-white rounded-2xl shadow-md p-6 border border-blue-100">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by name, skills (e.g. carpentry, babysitting)..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10 h-12"
                />
              </div>
              <Button onClick={handleSearch} className="h-12 px-6 bg-blue-600 hover:bg-blue-700">
                Search
              </Button>
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-48 h-12">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="completed">Most Active</SelectItem>
                {user?.latitude && <SelectItem value="distance">Nearest</SelectItem>}
              </SelectContent>
            </Select>
          </div>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No people found</h3>
            <p className="text-gray-500">Try adjusting your search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredUsers.map(worker => (
              <Link key={worker.id} to={createPageUrl(`PublicProfile?userId=${worker.id}`)}>
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
                        <h3 className="font-bold text-lg text-gray-900 truncate">{worker.full_name}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                          {worker.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3" />
                              {worker.location.split(',')[0]}
                            </span>
                          )}
                          {worker.distance && (
                            <span className="text-xs bg-gray-100 px-1.5 py-0.5 rounded">
                              {worker.distance} mi
                            </span>
                          )}
                        </div>
                        {worker.rating > 0 && (
                          <div className="flex items-center gap-1 text-sm font-medium text-yellow-600">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            {worker.rating.toFixed(1)} <span className="text-gray-400 font-normal">({worker.total_ratings})</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
                      {worker.bio || "No bio available."}
                    </p>

                    <div className="flex flex-wrap gap-1 mb-4">
                      {worker.skills?.split(',').slice(0, 3).map((skill, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {skill.trim()}
                        </Badge>
                      ))}
                      {worker.skills?.split(',').length > 3 && (
                        <Badge variant="outline" className="text-xs text-gray-500">
                          +{worker.skills.split(',').length - 3} more
                        </Badge>
                      )}
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                      <div className="text-xs text-gray-500">
                        <span className="font-semibold text-gray-900">{worker.completed_trades || 0}</span> trades completed
                      </div>
                      <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-0 h-auto font-medium">
                        View Profile <ArrowRight className="w-3 h-3 ml-1" />
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