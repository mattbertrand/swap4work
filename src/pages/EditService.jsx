import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { authLoginUrl } from "@/lib/authNavigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, MapPin } from "lucide-react";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import UnsavedChangesDialog from "@/components/forms/UnsavedChangesDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LocationFields, { parseLocationString } from "@/components/location/LocationFields";
import { normalizeCityName, isValidCityName } from "@/lib/location";
import ServicePhotosSection from "@/components/forms/ServicePhotosSection";
import ServiceDetailsFields from "@/components/forms/ServiceDetailsFields";
import { getServiceCover } from "@/lib/serviceCovers";

// Dedicated edit page for service listings — service-only categories and fields,
// no condition, no estimated value, no minimum-photo requirement. The category
// cover is auto-updated on save based on the selected category.
export default function EditService() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [user, setUser] = useState(null);

  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  const [formData, setFormData] = useState({
    title: "",
    category: "Home Repairs",
    required_hours: "",
    description: "",
    suggested_tasks: "",
    offerer_terms: "",
    photos: []
  });

  // Location state — same handling as the create form
  const [locFields, setLocFields] = useState({ street: "", city: "", state: "", zip: "" });
  const [locString, setLocString] = useState("");
  const [coords, setCoords] = useState({ latitude: null, longitude: null });
  const [originalLocation, setOriginalLocation] = useState(null);
  const geocodeTimerRef = useRef(null);

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
        navigate(authLoginUrl(window.location.pathname + window.location.search));
      }
    };

    checkProfile();
  }, []);

  useEffect(() => {
    if (item && user) {
      if (item.offerer_id !== user.id) {
        navigate(createPageUrl("MyListings"));
        return;
      }
      if (item.listing_type !== 'service') {
        navigate(createPageUrl(`EditItem?id=${item.id}`));
        return;
      }
      if (!['active', 'in_negotiation'].includes(item.status)) {
        navigate(createPageUrl("MyListings"));
        return;
      }

      setFormData({
        title: item.title || "",
        category: item.category || "Home Repairs",
        required_hours: item.required_hours?.toString() || "",
        description: item.description || "",
        suggested_tasks: item.suggested_tasks || "",
        offerer_terms: item.offerer_terms || "",
        photos: item.photos || []
      });

      const parsed = parseLocationString(item.location || "");
      setLocFields(parsed);
      setLocString(item.location || "");
      setOriginalLocation(item.location || "");
      setCoords({ latitude: item.latitude || null, longitude: item.longitude || null });
    }
  }, [item, user, navigate]);

  // Geocode whenever the location string changes (debounced) — same approach
  // as the create form. Stored coordinates are kept while the location is unchanged.
  useEffect(() => {
    if (originalLocation !== null && locString === originalLocation) return;
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
  // Coordinates are excluded: they are geocoded, not user-entered.
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const captureEditServiceState = () => JSON.stringify({ formData, locFields });
  useEffect(() => {
    if (item && user && initialSnapshot === null) {
      setInitialSnapshot(captureEditServiceState());
    }
  }, [item, user]);
  const isDirty = !!initialSnapshot && captureEditServiceState() !== initialSnapshot;
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
      const uploadPromises = files.map(file =>
        base44.integrations.Core.UploadPublicFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const urls = results.map(r => r.file_url);
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...urls].slice(0, 5)
      }));
    } catch {
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

    const publicLocation = [normalizeCityName(locFields.city), locFields.state].filter(Boolean).join(", ");

    setLoading(true);
    try {
      await base44.entities.Item.update(itemId, {
        title: formData.title,
        category: formData.category,
        required_hours: parseFloat(formData.required_hours),
        description: formData.description,
        suggested_tasks: formData.suggested_tasks,
        offerer_terms: formData.offerer_terms,
        photos: formData.photos,
        cover_image: getServiceCover(formData.category),
        location: publicLocation,
        latitude: coords.latitude,
        longitude: coords.longitude
      });
      markClean();
      queryClient.invalidateQueries(['item', itemId]);
      queryClient.invalidateQueries(['myItems']);
      navigate(createPageUrl("MyListings"));
    } catch {
      alert("Failed to update your service. Please try again.");
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service not found</h2>
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
            <CardTitle className="text-2xl font-bold">Edit Service Listing</CardTitle>
            <p className="text-gray-500">Update the details about your service</p>
          </CardHeader>

          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Cover + optional real work photos */}
              <ServicePhotosSection
                category={formData.category}
                photos={formData.photos}
                uploading={uploading}
                onFilesSelected={handleFileUpload}
                onRemovePhoto={removePhoto}
              />

              {/* Service fields */}
              <ServiceDetailsFields formData={formData} setFormData={setFormData} />

              {/* Location */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <Label className="text-base font-semibold mb-3 block">
                  Location <span className="text-red-500">*</span>
                  <span className="text-xs font-normal text-gray-500 ml-2">(Only your town &amp; state will be shown publicly)</span>
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

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { markClean(); navigate(createPageUrl("MyListings")); }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !coords.latitude || !coords.longitude}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Service"
                  )}
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