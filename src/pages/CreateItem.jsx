import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X, ArrowLeft, Loader2, MapPin, Package, Briefcase } from "lucide-react";
import LocationFields, { parseLocationString } from "@/components/location/LocationFields";
import { normalizeCityName, isValidCityName } from "@/lib/location";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import UnsavedChangesDialog from "@/components/forms/UnsavedChangesDialog";
import AuthModal from "@/components/auth/AuthModal";
import ServicePhotosSection from "@/components/forms/ServicePhotosSection";
import ServiceDetailsFields from "@/components/forms/ServiceDetailsFields";
import HoursMinutesInput from "@/components/forms/HoursMinutesInput";
import { getServiceCover } from "@/lib/serviceCovers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function CreateItem() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [listingType, setListingType] = useState("item");

  // Location state
  const [locFields, setLocFields] = useState({ street: "", city: "", state: "", zip: "" });
  const [locString, setLocString] = useState("");
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const geocodeTimerRef = useRef(null);

  const [formData, setFormData] = useState({
    listing_type: "item",
    accepts: "service",
    title: "",
    description: "",
    category: "Electronics",
    condition: "Good",
    required_hours: "",
    suggested_tasks: "",
    offerer_terms: "",
    estimated_value: "",
    photos: []
  });

  useEffect(() => {
    const checkProfile = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        if (!userData.profile_completed || !userData.location || !userData.phone) {
          const currentUrl = window.location.pathname + window.location.search;
          navigate(createPageUrl(`CompleteProfile?returnUrl=${encodeURIComponent(currentUrl)}`));
          return;
        }

        // Pre-fill location from user profile
        if (userData.location) {
          const parsed = parseLocationString(userData.location);
          setLocFields(parsed);
          setLocString(userData.location);
        }
        if (userData.latitude && userData.longitude) {
          setCoords({ latitude: userData.latitude, longitude: userData.longitude });
        }

        setCheckingAuth(false);
      } catch (error) {
        setCheckingAuth(false);
        setAuthModalOpen(true);
      }
    };
    checkProfile();
  }, [navigate]);

  // Geocode whenever locString changes (debounced)
  useEffect(() => {
    clearTimeout(geocodeTimerRef.current);
    if (!locString || locString.length < 5) {
      setCoords({ latitude: null, longitude: null });
      return;
    }
    geocodeTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locString)}&limit=1`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          setCoords({ latitude: parseFloat(data[0].lat), longitude: parseFloat(data[0].lon) });
        } else {
          setCoords({ latitude: null, longitude: null });
        }
      } catch {
        setCoords({ latitude: null, longitude: null });
      }
    }, 900);
  }, [locString]);

  // --- Unsaved changes protection ---
  // Snapshot taken after the form (and profile location prefill) loads.
  // Coordinates are excluded: they are derived, not user-entered.
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const captureCreateState = () => JSON.stringify({ listingType, formData, locFields });
  useEffect(() => {
    if (user && initialSnapshot === null) {
      setInitialSnapshot(captureCreateState());
    }
  }, [user]);
  const isDirty = !!initialSnapshot && captureCreateState() !== initialSnapshot;
  const { blocker, markClean } = useUnsavedChanges(isDirty);

  const handleLocationChange = (fields, locationString) => {
    setLocFields(fields);
    setLocString(locationString);
  };

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setUploading(true);
    try {
      const results = await Promise.all(files.map(file => base44.integrations.Core.UploadFile({ file })));
      const urls = results.map(r => r.file_url);
      setFormData(prev => ({ ...prev, photos: [...prev.photos, ...urls] }));
    } catch {
      alert("Failed to upload photos. Please try again.");
    }
    setUploading(false);
  };

  const removePhoto = (index) => {
    setFormData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (listingType === "item" && formData.photos.length < 3) {
      alert("Please upload at least 3 photos for items");
      return;
    }

    if (!formData.required_hours) {
      alert("Please enter a valid work time (at least 5 minutes, e.g. 00:05).");
      return;
    }

    if (!locFields.city || !locFields.state) {
      alert("Please enter at least a city and state for your location");
      return;
    }
    if (!isValidCityName(locFields.city)) {
      alert("Please enter a valid city name for your location");
      return;
    }

    if (!coords.latitude || !coords.longitude) {
      alert("Could not verify your location coordinates. Please check your address and try again.");
      return;
    }

    // Build the public-safe location string: canonical "City, ST" only — no street, no ZIP
    const publicLocation = [normalizeCityName(locFields.city), locFields.state].filter(Boolean).join(", ");

    setLoading(true);
    try {
      await base44.entities.Item.create({
        ...formData,
        listing_type: listingType,
        ...(listingType === "service" ? { cover_image: getServiceCover(formData.category) } : {}),
        required_hours: formData.required_hours,
        estimated_value: parseFloat(formData.estimated_value) || 0,
        location: publicLocation,
        latitude: coords.latitude,
        longitude: coords.longitude,
        offerer_id: user.id,
        offerer_name: user.full_name,
        offerer_rating: user.rating || 0,
        offerer_total_ratings: user.total_ratings || 0,
        status: "active"
      });
      markClean();
      navigate(createPageUrl("MyListings"));
    } catch {
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
              {/* Listing Type */}
              <div className="bg-gray-50 p-4 rounded-lg border-2 border-gray-200">
                <Label className="text-base font-semibold mb-3 block">What are you listing?</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => { setListingType("item"); setFormData(p => ({...p, listing_type: "item", accepts: "service", category: "Electronics"})); }}
                    className={`p-4 rounded-lg border-2 transition-all ${listingType === "item" ? "border-orange-500 bg-orange-50" : "border-gray-300 bg-white hover:border-gray-400"}`}
                  >
                    <Package className={`w-8 h-8 mx-auto mb-2 ${listingType === "item" ? "text-orange-600" : "text-gray-400"}`} />
                    <p className={`font-semibold ${listingType === "item" ? "text-orange-600" : "text-gray-600"}`}>Physical Item</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setListingType("service"); setFormData(p => ({...p, listing_type: "service", accepts: "both", category: "Home Repairs"})); }}
                    className={`p-4 rounded-lg border-2 transition-all ${listingType === "service" ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white hover:border-gray-400"}`}
                  >
                    <Briefcase className={`w-8 h-8 mx-auto mb-2 ${listingType === "service" ? "text-blue-600" : "text-gray-400"}`} />
                    <p className={`font-semibold ${listingType === "service" ? "text-blue-600" : "text-gray-600"}`}>Service Offering</p>
                  </button>
                </div>
              </div>

              {/* What do you accept */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  What do you accept in exchange? <span className="text-red-500">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "item", label: "Items Only", icon: <Package className="w-5 h-5 mx-auto mb-1" />, color: "orange" },
                    { value: "service", label: "Services Only", icon: <Briefcase className="w-5 h-5 mx-auto mb-1" />, color: "blue" },
                    { value: "both", label: "Both", icon: <div className="flex gap-1 justify-center mb-1"><Package className="w-4 h-4" /><Briefcase className="w-4 h-4" /></div>, color: "purple" },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData(p => ({...p, accepts: opt.value}))}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        formData.accepts === opt.value
                          ? `border-${opt.color}-500 bg-${opt.color}-50 text-${opt.color}-700`
                          : "border-gray-300 bg-white text-gray-600 hover:border-gray-400"
                      }`}
                    >
                      {opt.icon}
                      <p className="text-sm font-semibold">{opt.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Photos */}
              {listingType === "service" && (
                <ServicePhotosSection
                  category={formData.category}
                  photos={formData.photos}
                  uploading={uploading}
                  onFilesSelected={handleFileUpload}
                  onRemovePhoto={removePhoto}
                />
              )}

              {listingType === "item" && (
                <div>
                  <Label className="text-base font-semibold mb-3 block">
                    Item Photos <span className="text-red-500">*</span> (minimum 3)
                  </Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {formData.photos.map((photo, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-orange-200">
                        <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                        <button type="button" onClick={() => removePhoto(index)} className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    {formData.photos.length < 5 && (
                      <label className="aspect-square border-2 border-dashed border-orange-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-colors">
                        <input type="file" accept="image/*" multiple onChange={handleFileUpload} className="hidden" disabled={uploading} />
                        {uploading ? <Loader2 className="w-8 h-8 text-orange-400 animate-spin" /> : <><Upload className="w-8 h-8 text-orange-400 mb-2" /><span className="text-sm text-gray-600">Upload</span></>}
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Basic Info */}
              {listingType === "item" ? (
              <>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="title">Item Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                    placeholder="e.g., MacBook Pro 2020"
                    required
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="category">Category <span className="text-red-500">*</span></Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData(p => ({ ...p, category: value }))}>
                    <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
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

                {listingType === "item" && (
                  <div>
                    <Label htmlFor="condition">Condition <span className="text-red-500">*</span></Label>
                    <Select value={formData.condition} onValueChange={(value) => setFormData(p => ({ ...p, condition: value }))}>
                      <SelectTrigger className="mt-2"><SelectValue /></SelectTrigger>
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
                    Work Hours Required <span className="text-red-500">*</span>
                  </Label>
                  <HoursMinutesInput
                    id="required_hours"
                    value={formData.required_hours}
                    onChange={(value) => setFormData(p => ({ ...p, required_hours: value }))}
                  />
                </div>

                {listingType === "item" && (
                  <div>
                    <Label htmlFor="estimated_value">Estimated Value ($)</Label>
                    <Input
                      id="estimated_value"
                      type="number"
                      min="0"
                      value={formData.estimated_value}
                      onChange={(e) => setFormData(p => ({ ...p, estimated_value: e.target.value }))}
                      placeholder="e.g., 1200"
                      className="mt-2"
                    />
                  </div>
                )}
              </div>
              </>
              ) : null}

              {/* Location */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <Label className="text-base font-semibold mb-3 block">
                  Location <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-500 ml-2">(Only your town & state will be shown publicly)</span>
                </Label>
                <LocationFields value={locFields} onChange={handleLocationChange} required={{ city: true, state: true, zip: false }} />
                <div className="mt-2">
                  {coords.latitude && coords.longitude ? (
                    <p className="text-xs text-green-600 flex items-center gap-1"><MapPin className="w-3 h-3" /> Location verified</p>
                  ) : locString ? (
                    <p className="text-xs text-amber-600">Verifying location…</p>
                  ) : null}
                </div>
              </div>

              {listingType === "item" ? (
              <>
              <div>
                <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
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
                  onChange={(e) => setFormData(p => ({ ...p, suggested_tasks: e.target.value }))}
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
                  onChange={(e) => setFormData(p => ({ ...p, offerer_terms: e.target.value }))}
                  placeholder="e.g., Must pick up item in person, work must be completed within 2 weeks..."
                  rows={3}
                  className="mt-2"
                />
              </div>
              </>
              ) : (
                <ServiceDetailsFields formData={formData} setFormData={setFormData} />
              )}

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => { markClean(); navigate(-1); }} className="flex-1">
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || (listingType === "item" && formData.photos.length < 3) || !coords.latitude || !coords.longitude}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                >
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</> : `List ${listingType === "item" ? "Item" : "Service"}`}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <UnsavedChangesDialog blocker={blocker} />
    </div>
  );
}