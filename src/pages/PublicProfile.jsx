import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Star, MapPin, CheckCircle2, Clock, Package, Briefcase } from "lucide-react";
import { format } from "date-fns";
import KarmaDisplay from "../components/profile/KarmaDisplay";
import ItemCard from "../components/browse/ItemCard";

export default function PublicProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userId');

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['publicProfile', userId],
    queryFn: async () => {
      // Since we can't get a single user by ID easily with non-admin permissions,
      // we'll list users and find the one (not efficient but functional for now based on current SDK usage in Home.js)
      const users = await base44.auth.listUsers();
      return users.find(u => u.id === userId);
    },
    enabled: !!userId
  });

  const { data: userItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['userActiveItems', userId],
    queryFn: () => base44.entities.Item.filter({ 
      offerer_id: userId, 
      status: 'active' 
    }, '-created_date'),
    enabled: !!userId
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['userRatings', userId],
    queryFn: () => base44.entities.Rating.filter({ 
      to_user_id: userId, 
      published: true 
    }, '-created_date', 10),
    enabled: !!userId
  });

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">User not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userProfile.id;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - User Info */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200 shadow-xl sticky top-8">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  {userProfile.photo_url ? (
                    <img
                      src={userProfile.photo_url}
                      alt={userProfile.full_name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 mx-auto"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto border-4 border-gray-100">
                      <span className="text-white font-bold text-4xl">
                        {userProfile.full_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {userProfile.id_verified && (
                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2 border-2 border-white">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-1">{userProfile.full_name}</h1>
                <div className="flex justify-center items-center gap-1 text-gray-500 mb-4 text-sm">
                  <MapPin className="w-3 h-3" />
                  {userProfile.location}
                </div>

                <div className="flex justify-center gap-2 mb-6">
                  {userProfile.id_verified && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">ID Verified</Badge>
                  )}
                  {userProfile.phone_verified && (
                    <Badge variant="secondary" className="bg-green-50 text-green-700">Phone Verified</Badge>
                  )}
                </div>

                <KarmaDisplay user={userProfile} showDetails={false} />

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{userProfile.hours_completed || 0}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Hours Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{userProfile.completed_trades || 0}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Trades</p>
                  </div>
                </div>

                {isOwnProfile && (
                  <Link to={createPageUrl("Profile")}>
                    <Button variant="outline" className="w-full mt-6">
                      Edit My Profile
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details & Items */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio & Skills */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
                  <p className="text-gray-600 whitespace-pre-line">
                    {userProfile.bio || "No bio available."}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Skills & Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.skills ? (
                      userProfile.skills.split(',').map((skill, i) => (
                        <Badge key={i} variant="secondary" className="px-3 py-1 bg-gray-100 text-gray-700">
                          {skill.trim()}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-500 italic">No skills listed</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Listings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Active Listings</h2>
                <Badge variant="outline">{userItems.length}</Badge>
              </div>
              
              {itemsLoading ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>
              ) : userItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userItems.map(item => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <Card className="bg-gray-50 border-dashed border-2 border-gray-200">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <Package className="w-10 h-10 text-gray-300 mb-2" />
                    <p className="text-gray-500 font-medium">No active listings</p>
                    <p className="text-sm text-gray-400">This user hasn't listed any items for trade yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Reviews */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Reviews</h2>
              {ratings.length > 0 ? (
                <div className="space-y-4">
                  {ratings.map(rating => (
                    <Card key={rating.id} className="border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{rating.from_user_name}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < rating.stars ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(rating.created_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {rating.review && <p className="text-gray-600 text-sm">{rating.review}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-gray-50 border-dashed border-2 border-gray-200">
                  <CardContent className="p-8 text-center text-gray-500">
                    No reviews yet
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}