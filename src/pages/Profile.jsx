
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Star, CheckCircle2, Clock, Package, LogOut } from "lucide-react";
import { format } from "date-fns"; // Added this import for date formatting

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
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
      // The updatedUserData is directly returned by updateMe if successful,
      // so we can use it to update the state without an extra `me()` call.
      setUser(updatedUserData); 
      setIsEditing(false);
      queryClient.invalidateQueries(['user', updatedUserData.id]); // Invalidate with the new user data's ID
    },
    onError: (error) => {
      console.error("Error updating profile:", error);
      // Optionally handle error, e.g., show a toast notification
    }
  });

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
    // Check if basic required fields are filled
    const profileComplete = !!(formData.location && formData.phone);
    
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
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Card */}
          <div className="space-y-6">
            <Card className="border-orange-100 shadow-lg">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="relative inline-block mb-4">
                    {user.photo_url ? (
                      <img
                        src={user.photo_url}
                        alt={user.full_name}
                        className="w-32 h-32 rounded-full object-cover border-4 border-orange-200"
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center border-4 border-orange-200">
                        <span className="text-white text-4xl font-bold">
                          {user.full_name?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-full cursor-pointer shadow-lg">
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
                  <p className="text-gray-600 mb-3">{user.email}</p>

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

                  {user.rating > 0 && (
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold">{user.rating.toFixed(1)}</span>
                      <span className="text-gray-500">({user.total_ratings} reviews)</span>
                    </div>
                  )}

                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full mt-4"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card className="border-orange-100 shadow-lg">
              <CardHeader className="border-b border-orange-100">
                <CardTitle className="text-lg">Statistics</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="w-5 h-5" />
                    <span>Hours Completed</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    {user.hours_completed || 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Package className="w-5 h-5" />
                    <span>Completed Trades</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    {completedAgreements.length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details & Reviews */}
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
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({...formData, location: e.target.value})}
                      placeholder="City, State or ZIP"
                      disabled={!isEditing}
                      className="mt-2"
                    />
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
