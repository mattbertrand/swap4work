import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, ArrowLeft, Loader2, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function EditItem() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  const [formData, setFormData] = useState({
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

  const { data: item, isLoading: itemLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      const items = await base44.entities.Item.filter({ id: itemId });
      return items[0];
    },
    enabled: !!itemId
  });

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
        setCheckingAuth(false);
      } catch (error) {
        base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      }
    };

    checkProfile();
  }, []);

  useEffect(() => {
    if (item) {
      // Check if user owns this item
      if (user && item.offerer_id !== user.id) {
        navigate(createPageUrl("MyListings"));
        return;
      }

      // Check if item can be edited
      if (!['active', 'in_negotiation'].includes(item.status)) {
        navigate(createPageUrl("MyListings"));
        return;
      }

      setFormData({
        title: item.title || "",
        description: item.description || "",
        category: item.category || "Electronics",
        condition: item.condition || "Good",
        required_hours: item.required_hours?.toString() || "",
        location: item.location || "",
        latitude: item.latitude || null,
        longitude: item.longitude || null,
        suggested_tasks: item.suggested_tasks || "",
        offerer_terms: item.offerer_terms || "",
        estimated_value: item.estimated_value?.toString() || "",
        photos: item.photos || []
      });
    }
  }, [item, user, navigate]);

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
      }
    );
  };

  let geocodeTimeout;
  const geocodeLocation = async (locationString) => {
    if (!locationString) return;
    
    try {
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
    setFormData(prev => ({...prev, location: newLocation}));
    
    clearTimeout(geocodeTimeout);
    if (newLocation.length > 5) {
      geocodeTimeout = setTimeout(() => geocodeLocation(newLocation), 1000);
    } else {
      setFormData(prev => ({...prev, latitude: null, longitude: null}));
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

  const updateItemMutation = useMutation({
    mutationFn: (data) => base44.entities.Item.update(itemId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['item', itemId]);
      queryClient.invalidateQueries(['myItems']);
      navigate(createPageUrl("MyListings"));
    }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.photos.length < 3) {
      alert("Please upload at least 3 photos");
      return;
    }

    if (!formData.latitude || !formData.longitude) {
      await geocodeLocation(formData.location);
    }

    setLoading(true);
    try {
      await updateItemMutation.mutateAsync({
        ...formData,
        required_hours: parseFloat(formData.required_hours),
        estimated_value: parseFloat(formData.estimated_value) || 0,
      });
    } catch (error) {
      console.error("Error updating item:", error);
      alert("Failed to update item. Please try again.");
    }
    setLoading(false);
  };

  if (checkingAuth || itemLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Item not found</h2>
          <Button onClick={() => navigate(createPageUrl("MyListings"))}>
            Back to My Listings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("MyListings"))}
          className="mb-6 hover:bg-orange-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to My Listings
        </Button>

        <Card className="border-orange-100 shadow-xl">
          <CardHeader className="border-b border-orange-100">
            <CardTitle className="text-2xl font-bold">Edit Item Listing</CardTitle>
            <p className="text-gray-500">Update the details about your item</p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Photos Upload */}
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

              {/* Basic Info */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">Item Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., MacBook Pro 2020"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Electronics">Electronics</SelectItem>
                      <SelectItem value="Home Goods">Home Goods</SelectItem>
                      <SelectItem value="Furniture">Furniture</SelectItem>
                      <SelectItem value="Appliances">Appliances</SelectItem>
                      <SelectItem value="Tools">Tools</SelectItem>
                      <SelectItem value="Sports Equipment">Sports Equipment</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="condition">Condition <span className="text-red-500">*</span></Label>
                  <Select value={formData.condition} onValueChange={(value) => setFormData({...formData, condition: value})}>
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

                <div>
                  <Label htmlFor="required_hours">Required Work Hours <span className="text-red-500">*</span></Label>
                  <Input
                    id="required_hours"
                    type="number"
                    min="1"
                    step="0.5"
                    value={formData.required_hours}
                    onChange={(e) => setFormData({...formData, required_hours: e.target.value})}
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
                    <p className="text-xs text-green-600 mt-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> Coordinates detected</p>
                  ) : (
                    formData.location && <p className="text-xs text-gray-500 mt-1">Geocoding location...</p>
                  )}
                </div>

                <div>
                  <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                  <Input
                    id="estimated_value"
                    type="number"
                    min="0"
                    value={formData.estimated_value}
                    onChange={(e) => setFormData({...formData, estimated_value: e.target.value})}
                    placeholder="e.g., 1200"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed description of the item..."
                  rows={4}
                  required
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="suggested_tasks">Suggested Tasks</Label>
                <Textarea
                  id="suggested_tasks"
                  value={formData.suggested_tasks}
                  onChange={(e) => setFormData({...formData, suggested_tasks: e.target.value})}
                  placeholder="e.g., Clean garage, organize storage, help with moving..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="offerer_terms">Your Terms (non-negotiable)</Label>
                <Textarea
                  id="offerer_terms"
                  value={formData.offerer_terms}
                  onChange={(e) => setFormData({...formData, offerer_terms: e.target.value})}
                  placeholder="e.g., Must pick up item in person, work must be completed within 2 weeks..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(createPageUrl("MyListings"))}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || formData.photos.length < 3 || (!formData.latitude || !formData.longitude)}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Item"
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