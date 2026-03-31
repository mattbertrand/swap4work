import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Star, CheckCircle2, Clock, Package, LogOut, MapPin, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import LocationFields, { parseLocationString } from "@/components/location/LocationFields";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";

const SKILL_CATEGORIES = {
  "Home Repairs / Maintenance": [
    "Handyman work", "Furniture assembly", "Mounting (TVs, shelves)", "Minor plumbing",
    "Minor electrical", "Painting", "Drywall patching", "Appliance installation",
    "Pressure washing", "HVAC filter change"
  ],
  "Home Cleaning & Organization": [
    "Regular house cleaning", "Deep cleaning", "Move-in / move-out cleaning",
    "Laundry & folding", "Closet / home organization", "Dishwashing", "Garage / attic clean-out"
  ],
  "Outdoor / Yard Work": [
    "Lawn mowing", "Weeding", "Hedge trimming", "Tree trimming (light)",
    "Garden maintenance", "Leaf removal", "Snow removal", "Gutter cleaning"
  ],
  "Errands & Personal Assistance": [
    "Grocery shopping", "Package drop-off/pick-up", "Waiting in line",
    "Personal assistant tasks", "Pet sitting / pet walking", "House sitting", "Transportation"
  ],
  "Moving & Delivery": [
    "Help moving", "Packing / unpacking", "Small deliveries", "Item pickup & drop-off"
  ],
  "Digital & Professional Services": [
    "Basic graphic design", "Social media help", "Photography", "Basic bookkeeping",
    "Resume writing", "Transcription", "Tutoring", "Tech support"
  ],
  "Child / Family Support": [
    "Babysitting", "Homework help", "Senior assistance (non-medical)"
  ],
  "Creative / Craft": [
    "Custom crafts", "Sewing / alterations", "Event decoration", "Handmade art creation"
  ]
};
import { format } from "date-fns";
import KarmaDisplay from "../components/profile/KarmaDisplay";
import AuthModal from "@/components/auth/AuthModal";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const TIME_SLOTS = ["Morning (6am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–9pm)","Night (9pm+)"];

export default function Profile() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
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
  const [locationFields, setLocationFields] = useState({ street: "", city: "", state: "", zip: "" });
  const [zipError, setZipError] = useState("");

  const [authChecked, setAuthChecked] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);

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
      setLocationFields(parseLocationString(userData.location || ""));
      // Parse availability into days/times
      if (userData.availability) {
        const parts = userData.availability.split(' | ');
        if (parts[0]) setSelectedDays(parts[0].split(', ').filter(Boolean));
        if (parts[1]) setSelectedTimes(parts[1].split(', ').filter(Boolean));
      }
      setAuthChecked(true);
    }).catch(() => { setUser(null); setAuthChecked(true); });
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

  const { data: workerProfile } = useQuery({
    queryKey: ['myWorkerProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const workers = await base44.entities.Worker.filter({ user_id: user.id });
      return workers[0] || null;
    },
    enabled: !!user?.id
  });

  const [workerData, setWorkerData] = useState({
    is_visible: false,
    availability: "",
    skills: "",
    bio: "",
    max_concurrent_offers: 10
  });

  useEffect(() => {
    if (workerProfile) {
      setWorkerData({
        is_visible: workerProfile.is_visible,
        availability: workerProfile.availability || "",
        skills: workerProfile.skills || "",
        bio: workerProfile.bio || "",
        max_concurrent_offers: workerProfile.max_concurrent_offers || 10
      });
    } else if (user) {
      // Pre-fill from user data if no worker profile exists
      setWorkerData(prev => ({
        ...prev,
        skills: user.skills || "",
        bio: user.bio || ""
      }));
    }
  }, [workerProfile, user]);

  const updateWorkerMutation = useMutation({
    mutationFn: async (data) => {
      if (workerProfile) {
        return base44.entities.Worker.update(workerProfile.id, data);
      } else {
        return base44.entities.Worker.create({
          user_id: user.id,
          ...data,
          // Sync basic info
          full_name: formData.full_name,
          location: formData.location,
          latitude: formData.latitude,
          longitude: formData.longitude,
          photo_url: user.photo_url,
          email: user.email,
          phone: formData.phone
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myWorkerProfile']);
    }
  });

  const handleSave = async () => {
    if (zipError) return;
    const profileComplete = !!(formData.location && formData.phone && locationFields.city && locationFields.state && locationFields.zip);
    const availabilityString = [selectedDays.join(', '), selectedTimes.join(', ')].filter(Boolean).join(' | ');

    await updateProfileMutation.mutateAsync({
      ...formData,
      availability: availabilityString,
      profile_completed: profileComplete
    });

    // Sync to Worker entity if it exists or if we are making it visible
    if (workerProfile || workerData.is_visible) {
      if (workerData.is_visible && !workerData.skills) {
        alert("You must select at least one skill to be visible as a worker.");
        return;
      }

      await updateWorkerMutation.mutateAsync({
        ...workerData,
        availability: availabilityString,
        full_name: formData.full_name,
        location: formData.location,
        latitude: formData.latitude,
        longitude: formData.longitude,
        photo_url: user.photo_url,
        phone: formData.phone
      });
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Camera className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Profile</h2>
            <p className="text-gray-600 mb-6">Create an account or log in to view and manage your profile.</p>
            <Button onClick={() => setAuthModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-amber-600 px-8">
              Log In to Continue
            </Button>
          </div>
        </div>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} message="Create an account or log in to view and manage your profile." />
      </>
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

                <KarmaDisplay karma={user.karma_points || 0} user={user} showDetails />

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
                    <Label className="text-sm font-medium">Location</Label>
                    <div className="mt-2">
                      <LocationFields
                        value={locationFields}
                        disabled={!isEditing}
                        errors={{ zip: zipError }}
                        onChange={(fields, locationStr) => {
                          setLocationFields(fields);
                          const hasZip = fields.zip && !/^\d{5}(-\d{4})?$/.test(fields.zip);
                          setZipError(hasZip ? "Enter a valid 5-digit ZIP code" : "");
                          setFormData(prev => ({ ...prev, location: locationStr, latitude: null, longitude: null }));
                        }}
                      />
                    </div>
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
                    <Label>Skills & Services</Label>
                    <div className="mt-2 space-y-2 border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                      {isEditing ? (
                        <Accordion type="multiple" className="w-full">
                          {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                            <AccordionItem key={category} value={category}>
                              <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2">
                                {category}
                              </AccordionTrigger>
                              <AccordionContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                                  {skills.map((skill) => {
                                    const currentSkills = (workerData.skills || formData.skills || "").split(',').map(s => s.trim()).filter(Boolean);
                                    const isSelected = currentSkills.includes(skill);
                                    
                                    return (
                                      <div key={skill} className="flex items-center space-x-2">
                                        <Checkbox 
                                          id={`skill-${skill}`}
                                          checked={isSelected}
                                          onCheckedChange={(checked) => {
                                            let newSkills = [...currentSkills];
                                            if (checked) {
                                              if (!newSkills.includes(skill)) newSkills.push(skill);
                                            } else {
                                              newSkills = newSkills.filter(s => s !== skill);
                                            }
                                            const skillString = newSkills.join(', ');
                                            setWorkerData({...workerData, skills: skillString});
                                            setFormData({...formData, skills: skillString}); // Sync both
                                          }}
                                        />
                                        <label
                                          htmlFor={`skill-${skill}`}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                          {skill}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {(formData.skills || "").split(',').filter(Boolean).map((skill, i) => (
                            <Badge key={i} variant="secondary" className="bg-white border-gray-200">
                              {skill.trim()}
                            </Badge>
                          ))}
                          {!formData.skills && <p className="text-sm text-gray-500 italic">No skills selected</p>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Worker Settings */}
            <Card className="border-orange-100 shadow-lg">
              <CardHeader className="border-b border-orange-100">
                <CardTitle>Worker Profile Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">Offer Services</p>
                      <p className="text-sm text-gray-500">List your profile in "Find People"</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={workerData.is_visible}
                        onChange={(e) => setWorkerData({...workerData, is_visible: e.target.checked})}
                        disabled={!isEditing}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  {workerData.is_visible && (
                  <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div>
                      <Label>Availability</Label>
                      <div className="mt-2 border rounded-lg p-4 bg-gray-50 space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Days available</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {DAYS.map(day => (
                              <div key={day} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`profile-day-${day}`}
                                  checked={selectedDays.includes(day)}
                                  disabled={!isEditing}
                                  onCheckedChange={(checked) => {
                                    setSelectedDays(prev => checked ? [...prev, day] : prev.filter(d => d !== day));
                                  }}
                                />
                                <label htmlFor={`profile-day-${day}`} className={`text-sm ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>{day}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">Time slots</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {TIME_SLOTS.map(slot => (
                              <div key={slot} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`profile-time-${slot}`}
                                  checked={selectedTimes.includes(slot)}
                                  disabled={!isEditing}
                                  onCheckedChange={(checked) => {
                                    setSelectedTimes(prev => checked ? [...prev, slot] : prev.filter(t => t !== slot));
                                  }}
                                />
                                <label htmlFor={`profile-time-${slot}`} className={`text-sm ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>{slot}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                      
                      <div>
                        <Label htmlFor="max_offers">Max Concurrent Offers</Label>
                        <Input
                          id="max_offers"
                          type="number"
                          min="1"
                          max="50"
                          value={workerData.max_concurrent_offers || 10}
                          onChange={(e) => setWorkerData({...workerData, max_concurrent_offers: parseInt(e.target.value) || 10})}
                          disabled={!isEditing}
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">Maximum number of active negotiations you can handle at once.</p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                        <p>Your worker profile uses the name, location, and skills from your main profile above.</p>
                      </div>
                    </div>
                  )}
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