import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Star, CheckCircle2, Clock, Package, LogOut, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";
import KarmaDisplay from "../components/profile/KarmaDisplay";

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    latitude: null,
    longitude: null,
    bio: "",
    skills: ""
  });

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        phone: userData.phone || "",
        location: userData.location || "",
        latitude: userData.latitude || null,
        longitude: userData.longitude || null,
        bio: userData.bio || "",
        skills: userData.skills || ""
      });
    }).catch(() => setUser(null));
  }, []);

  const { data: ratings = [] } = useQuery({
    queryKey: ['ratings', user?.id],
    queryFn: () => base44.entities.Rating.filter({ to_user_id: user.id, published: true }, '-created_date'),
    enabled: !!user
  });

  const { data: completedAgreements = [] } = useQuery({
    queryKey: ['completedAgreements', user?.id],
    queryFn: async () => {
      const asWorker = await base44.entities.Agreement.filter({
        worker_id: user.id,
        status: 'completed'
      });
      const asOfferer = await base44.entities.Agreement.filter({
        offerer_id: user.id,
        status: 'completed'
      });
      return [...asWorker, ...asOfferer];
    },
    enabled: !!user
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: async (updatedUserData) => {
      setUser(updatedUserData);
      setIsEditing(false);
      queryClient.invalidateQueries(['user', updatedUserData.id]);
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
    }
  });

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const location = `${data.address.city || data.address.town || data.address.village || ''}, ${data.address.state || ''} ${data.address.postcode || ''}`.trim();

          setFormData(prev => ({
            ...prev,
            location: location,
            latitude,
            longitude
          }));
        } catch (error) {
          console.error("Error getting address:", error);
          setFormData(prev => ({
            ...prev,
            latitude,
            longitude
          }));
          alert("Could not determine address from coordinates, but location data is saved.");
        }
        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("Unable to get your current location. Please enter it manually.");
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  let geocodeTimeout;
  const geocodeLocation = async (locationString) => {
    if (!locationString || locationString.length < 5) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&limit=1`
      );
      const data = await response.json();

      if (data && data.length > 0) {
        setFormData(prev => ({
          ...prev,
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon)
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          latitude: null,
          longitude: null
        }));
      }
    } catch (error) {
      console.error("Error geocoding location:", error);
      setFormData(prev => ({
        ...prev,
        latitude: null,
        longitude: null
      }));
    }
  };

  const handleLocationChange = (e) => {
    const newLocation = e.target.value;
    setFormData(prev => ({...prev, location: newLocation}));

    clearTimeout(geocodeTimeout);
    if (newLocation.length > 5) {
      geocodeTimeout = setTimeout(() => geocodeLocation(newLocation), 1000);
    } else {
      setFormData(prev => ({...prev, latitude: null, longitude: null}));
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const updatedUser = await base44.auth.updateMe({ photo_url: file_url });
      setUser(updatedUser);
    } catch (error) {
      console.error("Error uploading photo:", error);
    }
    setUploading(false);
  };

  const handleSave = async () => {
    const profileComplete = !!(formData.location && formData.phone && formData.latitude && formData.longitude);

    await updateProfileMutation.mutateAsync({
      ...formData,
      profile_completed: profileComplete
    });
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your profile</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Card */}
          <div className="lg:col-span-1">
            <Card className="border-orange-100 shadow-xl sticky top-8">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  {user.photo_url ? (
                    <img
                      src={user.photo_url}
                      alt={user.full_name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-orange-200 mx-auto"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mx-auto border-4 border-orange-200">
                      <span className="text-white font-bold text-4xl">
                        {user.full_name?.[0]?.toUpperCase() || 'U'}
                      </span>
                    </div>
                  )}
                  {user.id_verified && (
                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2 border-2 border-white">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <label className="absolute bottom-0 left-0 bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-full cursor-pointer shadow-lg">
                    <Camera className="w-5 h-5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-1">{user.full_name}</h2>
                <p className="text-gray-500 text-sm mb-4">{user.email}</p>

                <div className="flex justify-center gap-2 mb-4">
                  {user.id_verified && (
                    <Badge className="bg-blue-100 text-blue-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      ID Verified
                    </Badge>
                  )}
                  {user.phone_verified && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Phone Verified
                    </Badge>
                  )}
                </div>

                {(user.rating || 0) > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= (user.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({user.total_ratings || 0} {(user.total_ratings || 0) === 1 ? 'review' : 'reviews'})
                    </span>
                  </div>
                )}

                {user && <KarmaDisplay karma={user.karma_points || 0} showDetails />}

                {/* Stats Section */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {user.hours_completed || 0}
                    </p>
                    <p className="text-sm text-gray-600">Hours Completed</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {user.completed_trades || 0}
                    </p>
                    <p className="text-sm text-gray-600">Completed Trades</p>
                  </div>
                </div>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full mt-6"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Profile Details & Reviews */}
          <div className="lg:col-span-2 space-y-6">
            {/* Profile Details */}
            <Card className="border-orange-100 shadow-lg">
              <CardHeader className="border-b border-orange-100">
                <div className="flex justify-between items-center">
                  <CardTitle>Profile Details</CardTitle>
                  {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} variant="outline">
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
                        Save Changes
                      </Button>
                      <Button onClick={() => setIsEditing(false)} variant="outline">
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Full Name</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={handleLocationChange}
                        placeholder="City, State or ZIP"
                        disabled={!isEditing}
                        className="flex-1"
                      />
                      {isEditing && (
                        <Button
                          type="button"
                          onClick={getCurrentLocation}
                          disabled={gettingLocation}
                          variant="outline"
                          className="whitespace-nowrap"
                        >
                          {gettingLocation ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <MapPin className="w-4 h-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    {formData.latitude && formData.longitude ? (
                      <p className="text-xs text-green-600 mt-1 flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        Coordinates verified ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
                      </p>
                    ) : (
                      formData.location && isEditing && (
                        <p className="text-xs text-amber-600 mt-1">Geocoding location...</p>
                      )
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder="Tell others about yourself..."
                      rows={4}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label htmlFor="skills">Skills & Interests</Label>
                    <Textarea
                      id="skills"
                      value={formData.skills}
                      onChange={(e) => setFormData({...formData, skills: e.target.value})}
                      placeholder="e.g., Carpentry, Gardening, Tech Support..."
                      rows={3}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="border-orange-100 shadow-lg">
              <CardHeader className="border-b border-orange-100">
                <CardTitle>Reviews & Feedback</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {ratings.length > 0 ? (
                  <div className="space-y-4">
                    {ratings.map((rating) => (
                      <div key={rating.id} className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
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
                          <span className="font-semibold text-gray-900">{rating.from_user_name}</span>
                        </div>
                        {rating.review && (
                          <p className="text-gray-700 text-sm">{rating.review}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {format(new Date(rating.created_date), 'MMMM d, yyyy')}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No reviews yet
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}