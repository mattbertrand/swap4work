import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, Clock, MapPin, Star, CheckCircle2, 
  Briefcase, Package, Users, TrendingUp 
} from "lucide-react";

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

// Get approximate location (city/state) from exact coordinates
const getApproximateLocation = (fullLocation) => {
  if (!fullLocation) return null;
  // Extract city and state, hide exact address
  const parts = fullLocation.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // Return last two parts (typically City, State or City, State ZIP)
    return parts.slice(-2).join(', ');
  }
  return fullLocation;
};

export default function Home() {
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  const { data: featuredItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['featuredItems'],
    queryFn: () => base44.entities.Item.filter({ status: "active" }, '-created_date', 6),
  });

  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      try {
        return await base44.auth.listUsers();
      } catch (error) {
        console.log('Could not fetch users list', error);
        return [];
      }
    },
  });

  const { data: recentRatings = [], isLoading: ratingsLoading } = useQuery({
    queryKey: ['recentRatings'],
    queryFn: () => base44.entities.Rating.filter({ published: true }, '-created_date', 6),
  });

  // Filter workers with proper validation
  const workers = React.useMemo(() => {
    console.log('📊 Total users fetched:', allUsers.length);
    
    // Filter workers who have completed profiles with required data
    const potentialWorkers = allUsers.filter(u => {
      const hasProfile = u.profile_completed;
      const hasCoordinates = u.latitude && u.longitude;
      const hasSkills = u.skills;
      
      console.log(`User ${u.full_name}: profile=${hasProfile}, coords=${hasCoordinates}, skills=${hasSkills}`);
      
      return hasProfile && hasCoordinates && hasSkills;
    });

    console.log('✅ Qualified workers:', potentialWorkers.length);

    // If user has location, filter by distance and add distance to each worker
    if (user?.latitude && user?.longitude) {
      console.log(`📍 User location: ${user.latitude}, ${user.longitude}`);
      
      return potentialWorkers
        .map(worker => {
          const distance = calculateDistance(
            user.latitude,
            user.longitude,
            worker.latitude,
            worker.longitude
          );
          return { ...worker, distance: distance.toFixed(1) };
        })
        .filter(worker => {
          const withinRange = parseFloat(worker.distance) <= 100;
          console.log(`Worker ${worker.full_name}: ${worker.distance} miles ${withinRange ? '✓' : '✗'}`);
          return withinRange;
        })
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
        .slice(0, 6);
    }

    // If no user location, just return first 6 workers without distance
    console.log('ℹ️ No user location, showing first 6 workers');
    return potentialWorkers.slice(0, 6);
  }, [allUsers, user?.latitude, user?.longitude]);

  console.log('🎯 Final workers to display:', workers.length);

  return (
    <div className="min-h-screen">
      {/* Hero Section - Dual Options */}
      <div className="bg-white py-16 px-4 md:py-24">
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            How would you like to <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">connect?</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            WorkSwap connects people who need help with people who need items. No money changes hands.
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 md:gap-12">
          {/* Option A: I Need Help (Find Workers) */}
          <Link to={createPageUrl("BrowseUsers")} className="group">
            <div className="h-full bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-100 rounded-3xl p-8 md:p-12 hover:shadow-2xl hover:border-blue-300 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-8 h-8" />
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-blue-700 transition-colors">
                  I need help with a task
                </h2>
                <p className="text-lg text-gray-600 mb-8 flex-1">
                  Find skilled people in your area who can babysit, run errands, clean, or fix things in exchange for your items.
                </p>
                
                <div className="flex items-center text-blue-700 font-bold text-lg group-hover:translate-x-2 transition-transform">
                  Browse People <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              </div>
            </div>
          </Link>

          {/* Option B: I Have Something (Find Items) */}
          <Link to={createPageUrl("Browse")} className="group">
            <div className="h-full bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-100 rounded-3xl p-8 md:p-12 hover:shadow-2xl hover:border-orange-300 transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-100 rounded-bl-full opacity-50 group-hover:scale-110 transition-transform" />
              
              <div className="relative z-10 flex flex-col h-full">
                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-8 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  <Package className="w-8 h-8" />
                </div>
                
                <h2 className="text-3xl font-bold text-gray-900 mb-4 group-hover:text-orange-700 transition-colors">
                  I want to earn an item
                </h2>
                <p className="text-lg text-gray-600 mb-8 flex-1">
                  Offer your skills and time to complete tasks for others in exchange for furniture, electronics, and more.
                </p>
                
                <div className="flex items-center text-orange-700 font-bold text-lg group-hover:translate-x-2 transition-transform">
                  Browse Items <ArrowRight className="w-5 h-5 ml-2" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-white py-12 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-8 h-8 text-orange-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{featuredItems.length}+</div>
              <div className="text-gray-600">Active Items</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="w-8 h-8 text-blue-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{allUsers.length}+</div>
              <div className="text-gray-600">Community Members</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">{recentRatings.length}+</div>
              <div className="text-gray-600">Completed Trades</div>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <div className="text-3xl font-bold text-gray-900">4.8</div>
              <div className="text-gray-600">Avg Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Items Section */}
      <div className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Featured Items</h2>
              <p className="text-gray-600">Quality items available for work exchange</p>
            </div>
            <Link to={createPageUrl("Browse")}>
              <Button variant="outline" className="hidden md:flex">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {itemsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredItems.map((item) => (
                <Link key={item.id} to={createPageUrl(`ItemDetail?id=${item.id}`)}>
                  <Card className="group overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer border-orange-100 bg-white h-full">
                    <div className="relative h-48 overflow-hidden bg-gray-100">
                      {item.photos && item.photos.length > 0 ? (
                        <img
                          src={item.photos[0]}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
                          <Package className="w-16 h-16 text-orange-300" />
                        </div>
                      )}
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-white/90 text-gray-900 border-0 shadow-md">
                          {item.category}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardContent className="p-5">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
                        {item.title}
                      </h3>
                      
                      <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-orange-600 font-bold">
                          <Clock className="w-5 h-5" />
                          <span>{item.required_hours}h</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <MapPin className="w-4 h-4" />
                          <span className="truncate">{getApproximateLocation(item.location)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}

          <div className="text-center mt-8 md:hidden">
            <Link to={createPageUrl("Browse")}>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-600">
                View All Items
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Workers Section */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">
                Skilled Workers {user?.latitude && user?.longitude ? 'Near You' : 'in Your Area'}
              </h2>
              <p className="text-gray-600">
                {user?.latitude && user?.longitude
                  ? `Talented individuals within 100 miles offering their services` 
                  : 'Connect with talented individuals offering their services'}
              </p>
              {!user && (
                <p className="text-sm text-orange-600 mt-2">
                  Sign in and complete your profile to see workers near you
                </p>
              )}
            </div>
            <Link to={createPageUrl("BrowseUsers")}>
              <Button variant="outline" className="hidden md:flex bg-white hover:bg-gray-50 text-blue-600 border-blue-200 hover:border-blue-300">
                View All People
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {usersLoading ? (
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
                  ? 'No workers found within 100 miles'
                  : 'No worker profiles available yet'
                }
              </h3>
              <p className="text-gray-500 mb-4">
                {user?.latitude && user?.longitude
                  ? 'Try browsing items or check back soon as more people join the community'
                  : user 
                  ? 'Complete your profile to see workers in your area'
                  : 'Sign in to see workers in your area'
                }
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
                <Card key={worker.id} className="hover:shadow-xl transition-shadow border-orange-100">
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
                          {worker.id_verified && (
                            <CheckCircle2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          {worker.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-semibold">{worker.rating.toFixed(1)}</span>
                              <span className="text-sm text-gray-500">({worker.total_ratings})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{worker.bio || 'No bio available'}</p>

                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {worker.skills?.split(',').slice(0, 3).map((skill, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                            {skill.trim()}
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

                    {worker.distance && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-orange-600" />
                          <span className="font-medium">{worker.distance} miles away</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Show approximate location instead of exact coordinates */}
                    {!worker.distance && worker.location && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4 text-orange-600" />
                          <span>{getApproximateLocation(worker.location)}</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Ratings Section */}
      <div className="py-16 px-4 bg-gradient-to-b from-orange-50 to-amber-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">What Our Community Says</h2>
            <p className="text-gray-600">Real reviews from successful work exchanges</p>
          </div>

          {ratingsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-2xl h-48 animate-pulse" />
              ))}
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
                              i < rating.stars
                                ? 'text-yellow-500 fill-yellow-500'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <Badge className="bg-green-100 text-green-700 border-0">
                        Verified
                      </Badge>
                    </div>

                    <p className="text-gray-700 text-sm mb-4 line-clamp-4">
                      "{rating.review}"
                    </p>

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

      {/* How It Works Section */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">How WorkSwap Works</h2>
            <p className="text-gray-600">Get started in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Browse or List Items</h3>
              <p className="text-gray-600">
                Find items you need or list items you want to trade. Set the work hours you're offering or willing to complete.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Negotiate & Agree</h3>
              <p className="text-gray-600">
                Chat with the other party, inspect items if needed, agree on terms, and lock in your work exchange agreement.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Complete & Trade</h3>
              <p className="text-gray-600">
                Log your work hours, complete milestones, get approval, and receive your item. Leave a review to build trust!
              </p>
            </div>
          </div>

          <div className="text-center mt-12 flex justify-center gap-4">
            <Link to={createPageUrl("Browse")}>
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-lg px-8 py-6 h-auto">
                Start Trading
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-br from-orange-600 to-amber-600 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Join Our Community?</h2>
          <p className="text-xl mb-8 text-orange-50">
            Start trading your skills for the items you need today. No money, just work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={createPageUrl("CreateItem")}>
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 text-lg px-8 py-6 h-auto w-full sm:w-auto">
                List Your First Item
              </Button>
            </Link>
            <Link to={createPageUrl("Browse")}>
              <Button size="lg" className="border-2 border-white bg-transparent text-white hover:bg-white hover:text-orange-600 text-lg px-8 py-6 h-auto w-full sm:w-auto transition-all">
                Find Work Opportunities
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}