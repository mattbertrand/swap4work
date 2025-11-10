import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, CheckCircle2, MapPin } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function CompleteProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const returnUrl = urlParams.get('returnUrl') || createPageUrl("Home");
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const locationTimeoutRef = useRef(null);

  const [formData, setFormData] = useState({
    phone: "",
    location: "",
    bio: "",
    skills: "",
    photo_url: "",
    user_role: "both",
    latitude: null,
    longitude: null
  });

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      setFormData({
        phone: userData.phone || "",
        location: userData.location || "",
        bio: userData.bio || "",
        skills: userData.skills || "",
        photo_url: userData.photo_url || "",
        user_role: userData.user_role || "both",
        latitude: userData.latitude || null,
        longitude: userData.longitude || null
      });
    }).catch(() => {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
    });
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
      toast.success('Photo uploaded!');
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error('Failed to upload photo');
    }
    setUploading(false);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        console.log('📍 Got location:', latitude, longitude);
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          
          const addressParts = [];
          if (data.address.road) addressParts.push(data.address.road);
          if (data.address.city || data.address.town || data.address.village) {
            addressParts.push(data.address.city || data.address.town || data.address.village);
          }
          if (data.address.state) addressParts.push(data.address.state);
          if (data.address.postcode) addressParts.push(data.address.postcode);
          const location = addressParts.filter(Boolean).join(', ');

          setFormData(prev => ({
            ...prev,
            location: location || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude
          }));
          
          console.log('✅ Location set:', location);
          toast.success('Location detected!');
        } catch (error) {
          console.error("Error getting address:", error);
          setFormData(prev => ({
            ...prev,
            location: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
            latitude,
            longitude
          }));
          toast.info('Location coordinates saved');
        }
        setGettingLocation(false);
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error('Unable to get your location. Please enter it manually.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const geocodeLocation = async (locationString) => {
    if (!locationString || locationString.length < 5) {
      setFormData(prev => ({...prev, latitude: null, longitude: null}));
      return;
    }
    
    console.log('🔍 Geocoding location:', locationString);
    setGeocoding(true);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&limit=1`
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        console.log('✅ Geocoded to:', lat, lon);
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lon
        }));
        toast.success('Location verified!');
      } else {
        console.log('❌ No geocoding results');
        setFormData(prev => ({...prev, latitude: null, longitude: null}));
        toast.warning('Could not verify location. Try using "Locate Me" button.');
      }
    } catch (error) {
      console.error("Error geocoding location:", error);
      setFormData(prev => ({...prev, latitude: null, longitude: null}));
    }
    
    setGeocoding(false);
  };

  const handleLocationChange = (e) => {
    const newLocation = e.target.value;
    setFormData(prev => ({...prev, location: newLocation}));
    
    if (locationTimeoutRef.current) {
      clearTimeout(locationTimeoutRef.current);
    }

    if (newLocation.length > 5) {
      locationTimeoutRef.current = setTimeout(() => geocodeLocation(newLocation), 1500);
    } else {
      setFormData(prev => ({ ...prev, latitude: null, longitude: null }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.location || !formData.phone) {
      toast.error("Please fill in all required fields (location and phone)");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      toast.error("Please ensure your location has valid coordinates. Try using the 'Locate Me' button.");
      return;
    }

    setLoading(true);
    try {
      console.log('💾 Saving profile:', formData);
      await base44.auth.updateMe({
        ...formData,
        profile_completed: true
      });
      toast.success('Profile completed!');
      navigate(returnUrl);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error('Failed to update profile. Please try again.');
    }
    setLoading(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600">Let's set up your profile to get started on WorkSwap</p>
        </div>

        <Card className="border-orange-100 shadow-xl">
          <CardHeader className="border-b border-orange-100 bg-white">
            <CardTitle>Profile Information</CardTitle>
            <p className="text-sm text-gray-500 mt-1">This information helps build trust in our community</p>
          </CardHeader>

          <CardContent className="p-6 bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                <Label className="text-base font-semibold mb-3">Profile Photo</Label>
                <div className="relative">
                  {formData.photo_url ? (
                    <img
                      src={formData.photo_url}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-orange-200"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center border-4 border-orange-200">
                      <span className="text-white text-4xl font-bold">
                        {user.full_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full cursor-pointer shadow-lg">
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
                {uploading && <p className="text-sm text-gray-500 mt-2">Uploading...</p>}
              </div>

              {/* Phone */}
              <div>
                <Label htmlFor="phone">
                  Phone Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="e.g., +1-555-0123"
                  required
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used for verification and coordination
                </p>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="location">
                  Location <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2 mt-2">
                  <div className="flex-1 relative">
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={handleLocationChange}
                      placeholder="e.g., Austin, TX 78701"
                      required
                      className="pr-10"
                    />
                    {geocoding && (
                      <Loader2 className="w-4 h-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-orange-600" />
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={getCurrentLocation}
                    disabled={gettingLocation}
                    className="flex-shrink-0"
                  >
                    {gettingLocation ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                    <span className="ml-1 hidden sm:inline">Locate Me</span>
                  </Button>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {formData.latitude && formData.longitude ? (
                    <p className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Location verified ({formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)})
                    </p>
                  ) : formData.location && formData.location.length > 5 ? (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      {geocoding ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Verifying location...
                        </>
                      ) : (
                        <>
                          <MapPin className="w-3 h-3" />
                          Waiting for location verification...
                        </>
                      )}
                    </p>
                  ) : (
                    <p className="text-xs text-gray-500">
                      Enter your city or ZIP code, or use "Locate Me"
                    </p>
                  )}
                </div>
              </div>

              {/* User Role */}
              <div>
                <Label htmlFor="user_role">I'm interested in</Label>
                <Select value={formData.user_role} onValueChange={(value) => setFormData({...formData, user_role: value})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">Offering my work/skills</SelectItem>
                    <SelectItem value="offerer">Trading my items</SelectItem>
                    <SelectItem value="both">Both working and trading</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">About You</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder="Tell the community about yourself..."
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional but helps others get to know you
                </p>
              </div>

              {/* Skills */}
              <div>
                <Label htmlFor="skills">Skills & Interests</Label>
                <Textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => setFormData({...formData, skills: e.target.value})}
                  placeholder="e.g., Carpentry, Cleaning, Tech Support, Gardening..."
                  rows={3}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated list of your skills
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || uploading || gettingLocation || geocoding || !formData.latitude || !formData.longitude}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Complete Profile
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}