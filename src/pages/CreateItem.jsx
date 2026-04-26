import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, ArrowLeft, Loader2, MapPin, Package, Briefcase } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [listingType, setListingType] = useState("item"); // "item" or "service"
  const [formData, setFormData] = useState({
    listing_type: "item",
    accepts: "service",
    title: "",
    description: "",
    category: "Electronics",
    condition: "Good",
    required_hours: "",
    location: "",
    latitude: null,
    longitude: null,
    suggested_tasks: "",
    offerer_terms: "",
    estimated_value: "",
    photos: []
  });
  const [gettingLocation, setGettingLocation] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData); // Set user data

        // Check if profile is complete
        if (!userData.profile_completed || !userData.location || !userData.phone) {
          const currentUrl = window.location.pathname + window.location.search;
          navigate(createPageUrl(`CompleteProfile?returnUrl=${encodeURIComponent(currentUrl)}`));
          return;
        }

        // Pre-fill location from user profile (including coords so submit isn't blocked)
        const lat = userData.latitude ?? null;
        const lng = userData.longitude ?? null;
        setFormData(prev => ({
          ...prev,
          location: userData.location || "",
          latitude: lat,
          longitude: lng
        }));
        // If user has a location string but no coords, geocode it automatically
        if (userData.location && !lat && !lng) {
          try {
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(userData.location)}&limit=1`
            );
            const geoData = await geoRes.json();
            if (geoData && geoData.length > 0) {
              setFormData(prev => ({
                ...prev,
                latitude: parseFloat(geoData[0].lat),
                longitude: parseFloat(geoData[0].lon)
              }));
            }
          } catch (e) {
            // coords stay null, user will see the amber hint
          }
        }

        setCheckingAuth(false);
      } catch (error) {
        // Not authenticated - show modal instead of redirect
        setCheckingAuth(false);
        setAuthModalOpen(true);
      }
    };

    checkProfile();
  }, [navigate]);

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
          // Use Nominatim OpenStreetMap for reverse geocoding
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
          // If reverse geocoding fails, at least save the coordinates
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
      }
    );
  };

  let geocodeTimeout; // To debounce geocoding calls
  const geocodeLocation = async (locationString) => {
    if (!locationString) return;

    try {
      // Use Nominatim OpenStreetMap for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}`
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
    setFormData(prev => ({ ...prev, location: newLocation }));

    clearTimeout(geocodeTimeout); // Clear previous timeout
    if (newLocation.length > 5) { // Only geocode if the input is reasonably long
      geocodeTimeout = setTimeout(() => geocodeLocation(newLocation), 1000);
    } else {
      // Clear coordinates if location is too short or empty
      setFormData(prev => ({ ...prev, latitude: null, longitude: null }));
    }
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = files.map(file =>
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...urls]
      }));
    } catch (error) {
      console.error("Error uploading files:", error);
      alert("Failed to upload photos. Please try again.");
    }
    setUploading(false);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Photos are required for items, optional for services
    if (listingType === "item" && formData.photos.length < 3) {
      alert("Please upload at least 3 photos for items");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      alert("Please ensure your location has valid coordinates");
      return;
    }

    setLoading(true);
    try {
      await base44.entities.Item.create({
        ...formData,
        listing_type: listingType,
        required_hours: parseFloat(formData.required_hours),
        estimated_value: parseFloat(formData.estimated_value) || 0,
        offerer_id: user.id,
        offerer_name: user.full_name,
        status: "active"
      });
      navigate(createPageUrl("MyListings"));
    } catch (error) {
      console.error("Error creating listing:", error);
      alert("Failed to create listing. Please try again.");
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Create a Listing</h2>
            <p className="text-gray-600 mb-6">Create an account or log in to list your items or services for trade.</p>
            <Button onClick={() => setAuthModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-amber-600 px-8">
              Get Started
            </Button>
          </div>
        </div>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} message="Create an account or log in to create a listing." />
      </>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-orange-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <Card className="border-orange-100 shadow-xl">
          <CardHeader className="border-b border-orange-100">
            <CardTitle className="text-2xl font-bold">Create a New Listing</CardTitle>
            <p className="text-gray-500">List an item or service for trade</p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Listing Type Selection */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                <Label className="text-base font-semibold mb-3 block">What are you listing?</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setListingType("item");
                      setFormData({...formData, listing_type: "item", accepts: "service", category: "Electronics"});
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      listingType === "item"
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <Package className={`w-8 h-8 mx-auto mb-2 ${listingType === "item" ? "text-orange-600" : "text-gray-400"}`} />
                    <p className={`font-semibold ${listingType === "item" ? "text-orange-600" : "text-gray-600"}`}>Physical Item</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setListingType("service");
                      setFormData({...formData, listing_type: "service", accepts: "both", category: "Home Repairs"});
                    }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      listingType === "service"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-300 bg-white hover:border-gray-400"
                    }`}
                  >
                    <Briefcase className={`w-8 h-8 mx-auto mb-2 ${listingType === "service" ? "text-blue-600" : "text-gray-400"}`} />
                    <p className={`font-semibold ${listingType === "service" ? "text-blue-600" : "text-gray-600"}`}>Service Offering</p>
                  </button>
                </div>
              </div>

              {/* What do you accept in return */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  What do you accept in exchange? <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, accepts: "item"})}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.accepts === "item"
                        ? "border-orange-500 bg-orange-50 text-orange-700"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <Package className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-sm font-semibold">Items Only</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, accepts: "service"})}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.accepts === "service"
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <Briefcase className="w-5 h-5 mx-auto mb-1" />
                    <p className="text-sm font-semibold">Services Only</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, accepts: "both"})}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.accepts === "both"
                        ? "border-purple-500 bg-purple-50 text-purple-700"
                        : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                    }`}
                  >
                    <div className="flex gap-1 justify-center mb-1">
                      <Package className="w-4 h-4" />
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <p className="text-sm font-semibold">Both</p>
                  </button>
                </div>
              </div>

              {/* Photos Upload - Only for items */}
              {listingType === "item" && (
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  Item Photos <span className="text-red-500">*</span> (minimum 3)
                </Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-orange-200">
                      <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePhoto(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {formData.photos.length < 5 && (
                    <label className="aspect-square border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                      {uploading ? (
                        <Loader2 className="w-8 h-8 text-orange-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-8 h-8 text-orange-400 mb-2" />
                          <span className="text-sm text-gray-600">Upload</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>
              )}

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">{listingType === "item" ? "Item" : "Service"} Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder={listingType === "item" ? "e.g., MacBook Pro 2020" : "e.g., Professional House Cleaning"}
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {listingType === "item" ? (
                        <>
                          <SelectItem value="Electronics">Electronics</SelectItem>
                          <SelectItem value="Home Goods">Home Goods</SelectItem>
                          <SelectItem value="Furniture">Furniture</SelectItem>
                          <SelectItem value="Appliances">Appliances</SelectItem>
                          <SelectItem value="Tools">Tools</SelectItem>
                          <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Home Repairs">Home Repairs</SelectItem>
                          <SelectItem value="Cleaning">Cleaning</SelectItem>
                          <SelectItem value="Yard Work">Yard Work</SelectItem>
                          <SelectItem value="Digital Services">Digital Services</SelectItem>
                          <SelectItem value="Tutoring">Tutoring</SelectItem>
                          <SelectItem value="Personal Assistance">Personal Assistance</SelectItem>
                          <SelectItem value="Creative Services">Creative Services</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {listingType === "item" && (
                  <div>
                    <Label htmlFor="condition">Condition <span className="text-red-500">*</span></Label>
                    <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="New">New</SelectItem>
                        <SelectItem value="Like New">Like New</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Fair">Fair</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div>
                  <Label htmlFor="required_hours">
                    {listingType === "item" ? "Work Hours Required" : "Service Hours Offered"} <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="required_hours"
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.required_hours}
                    onChange={(e) => setFormData({ ...formData, required_hours: e.target.value })}
                    placeholder="e.g., 40"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={handleLocationChange}
                      placeholder="City or ZIP code"
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={gettingLocation}
                      variant="outline"
                      className="whitespace-nowrap flex items-center justify-center"
                    >
                      {gettingLocation ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPin className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {formData.latitude && formData.longitude ? (
                    <p className="text-xs text-green-600 mt-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> Location verified</p>
                  ) : formData.location ? (
                    <p className="text-xs text-amber-600 mt-1">Could not verify coordinates — try clicking the locate button or editing the address.</p>
                  ) : null}
                </div>

                {listingType === "item" && (
                  <div>
                    <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                    <Input
                      id="estimated_value"
                      type="number"
                      min="0"
                      value={formData.estimated_value}
                      onChange={(e) => setFormData({ ...formData, estimated_value: e.target.value })}
                      placeholder="e.g., 1200"
                      className="mt-2"
                    />
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={listingType === "item" 
                    ? "Detailed description of the item..." 
                    : "Describe the service you're offering, your experience, and what's included..."}
                  rows={4}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="suggested_tasks">
                  {listingType === "item" ? "Suggested Tasks" : "Service Details"}
                </Label>
                <Textarea
                  id="suggested_tasks"
                  value={formData.suggested_tasks}
                  onChange={(e) => setFormData({ ...formData, suggested_tasks: e.target.value })}
                  placeholder={listingType === "item"
                    ? "e.g., Clean garage, organize storage, help with moving..."
                    : "e.g., Includes materials, takes 2-3 hours, flexible schedule..."}
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="offerer_terms">Your Terms (non-negotiable)</Label>
                <Textarea
                  id="offerer_terms"
                  value={formData.offerer_terms}
                  onChange={(e) => setFormData({ ...formData, offerer_terms: e.target.value })}
                  placeholder="e.g., Must pick up item in person, work must be completed within 2 weeks..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || (listingType === "item" && formData.photos.length < 3) || (!formData.latitude || !formData.longitude)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    `List ${listingType === "item" ? "Item" : "Service"}`
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}