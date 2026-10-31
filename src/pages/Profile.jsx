import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { displayName } from "@/lib/names";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Camera, Star, CheckCircle2, Clock, Package, LogOut, MapPin, Loader2, ChevronDown, ChevronUp, Ban, UserX } from "lucide-react";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { parseSkills } from "@/lib/skills";
import { formatPublicLocation, isValidCityName } from "@/lib/location";
import { toast } from "sonner";
import { isValidPhone, normalizePhoneToE164 } from "@/lib/phone";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import UnsavedChangesDialog from "@/components/forms/UnsavedChangesDialog";
import PhoneVerificationField from "@/components/profile/PhoneVerificationField";
import LocationFields, { parseLocationString, buildLocationString } from "@/components/location/LocationFields";
import { verifyLocationOnline } from "@/lib/locationValidation";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CustomSkillInput from "@/components/profile/CustomSkillInput";
import LocationCheckCard from "@/components/location/LocationCheckCard";
import ExchangeAreasField from "@/components/location/ExchangeAreasField";
import { useLanguage } from "@/i18n/LanguageContext";

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
import { formatDate } from '@/i18n/formatters';
import { skillLabel } from '@/i18n/skillLabels';
import { formatDuration } from '@/lib/duration';
import KarmaDisplay from "../components/profile/KarmaDisplay";
import AuthModal from "@/components/auth/AuthModal";

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const TIME_SLOTS = ["Morning (6am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–9pm)","Night (9pm+)"];

export default function Profile() {
  const queryClient = useQueryClient();
  const { t, locale } = useLanguage();
  const [user, setUser] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    location: "",
    latitude: null,
    longitude: null,
    bio: "",
    skills: "",
    user_role: "both"
  });
  const [locationFields, setLocationFields] = useState({ street: "", city: "", state: "", zip: "" });
  const [zipError, setZipError] = useState("");

  const [authChecked, setAuthChecked] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [editSnapshot, setEditSnapshot] = useState(null);
  const [locationErrors, setLocationErrors] = useState({});
  const [verifyingLocation, setVerifyingLocation] = useState(false);
  const [visibilityError, setVisibilityError] = useState("");
  const [exchangeAreas, setExchangeAreas] = useState([]);

  useEffect(() => {
    base44.auth.me().then(async userData => {
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        phone: userData.phone || "",
        location: userData.location || "",
        latitude: userData.latitude || null,
        longitude: userData.longitude || null,
        bio: userData.bio || "",
        skills: userData.skills || "",
        user_role: userData.user_role || "both"
      });
      // Phone confirmation comes from the server-written PhoneVerification
      // record — never from a client-set flag on the user record
      try {
        const verifications = await base44.entities.PhoneVerification.filter({ user_id: userData.id });
        setPhoneVerified(verifications.some(v => v.phone && v.phone === (userData.phone || "")));
      } catch (err) {
        // Non-blocking: leave the badge off if the lookup fails
      }
      setLocationFields(parseLocationString(userData.location || ""));
      setExchangeAreas(Array.isArray(userData.exchange_areas) ? userData.exchange_areas : []);
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

  const { data: termsAcceptance } = useQuery({
    queryKey: ['termsAcceptance', user?.id],
    queryFn: async () => {
      const records = await base44.entities.TermsAcceptance.filter({ user_id: user.id });
      return records[0] || null;
    },
    enabled: !!user?.id
  });

  const { data: workerProfile } = useQuery({
    queryKey: ['myWorkerProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const workers = await base44.entities.Worker.filter({ user_id: user.id });
      return workers[0] || null;
    },
    enabled: !!user?.id
  });

  const { blocked, invalidate: invalidateBlocked } = useBlockedUsers(user?.id);

  const handleUnblock = async (blockedId, blockedName) => {
    try {
      const entries = await base44.entities.BlockedUser.filter({
        blocker_id: user.id,
        blocked_id: blockedId
      });
      await Promise.all(entries.map(e => base44.entities.BlockedUser.delete(e.id)));
      toast.success(t("profile.toast_unblocked", { name: blockedName }));
      invalidateBlocked();
    } catch (error) {
      toast.error(t("profile.toast_unblock_fail"));
    }
  };

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
          // Sync basic info — store only the canonical public "City, ST"
          full_name: formData.full_name,
          location: formatPublicLocation(data.location || formData.location) || "",
          latitude: data.latitude ?? formData.latitude,
          longitude: data.longitude ?? formData.longitude,
          photo_url: user.photo_url,
          email: user.email,
          phone: data.phone ?? (formData.phone ? (normalizePhoneToE164(formData.phone) || formData.phone) : "")
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myWorkerProfile']);
    }
  });

  // --- Unsaved changes protection (Edit Profile) ---
  // Snapshot is taken when editing starts; dirty = current form differs from it.
  const captureEditState = () => JSON.stringify({
    formData, locationFields, workerData, selectedDays, selectedTimes, phoneVerified, exchangeAreas
  });
  const isDirty = isEditing && !!editSnapshot && captureEditState() !== editSnapshot;
  const { blocker } = useUnsavedChanges(isDirty);

  const handleSave = async () => {
    // Guardrail: an "Offer Services" profile needs at least one skill
    if (workerData.is_visible && parseSkills(workerData.skills || formData.skills).length === 0) {
      setVisibilityError(t("profile.need_skill"));
      toast.error(t("profile.err_skill"));
      return;
    }
    setVisibilityError("");

    // --- Required location validation (City, ZIP, State; street optional) ---
    const locErrors = {};
    if (!locationFields.city) locErrors.city = t("profile.err_city_required");
    else if (!isValidCityName(locationFields.city)) locErrors.city = t("profile.err_city_invalid");
    if (!locationFields.state) locErrors.state = t("profile.err_state_required");
    if (!locationFields.zip) locErrors.zip = t("profile.err_zip_required");
    else if (!/^\d{5}(-\d{4})?$/.test(locationFields.zip)) locErrors.zip = t("profile.zip_invalid");
    if (Object.keys(locErrors).length > 0) {
      setLocationErrors(locErrors);
      toast.error(t("profile.err_location"));
      return;
    }
    setLocationErrors({});

    // --- Geographic verification of the manually entered location (OpenStreetMap) ---
    if (verifyingLocation) return;
    setVerifyingLocation(true);
    const geo = await verifyLocationOnline(locationFields, { t });
    setVerifyingLocation(false);

    let finalLocationFields = locationFields;
    if (geo.status === "invalid") {
      setLocationErrors({ [geo.field]: geo.message });
      toast.error(geo.message);
      return;
    }
    if (geo.status === "valid") {
      // Accept the canonical spelling ("petaluma" → "Petaluma") and show it to the user
      if (geo.city && geo.city !== locationFields.city) {
        finalLocationFields = { ...locationFields, city: geo.city };
        setLocationFields(finalLocationFields);
        toast.success(t("profile.toast_verified", { city: geo.city, state: locationFields.state }));
      }
    } else {
      // Validation service unreachable: fall back to the format checks above so
      // a temporary outage never permanently blocks a legitimate save.
      toast.warning(t("profile.toast_geo_offline"));
    }
    const locationString = buildLocationString(finalLocationFields);
    setFormData(prev => ({ ...prev, location: locationString }));

    // --- Phone validation & normalization (E.164) ---
    if (formData.phone && !isValidPhone(formData.phone)) {
      toast.error(t("profile.err_phone"));
      return;
    }
    const normalizedPhone = formData.phone ? (normalizePhoneToE164(formData.phone) || formData.phone) : "";
    const profileComplete = !!(locationString && normalizedPhone && locationFields.city && locationFields.state && locationFields.zip);
    const availabilityString = [selectedDays.join(', '), selectedTimes.join(', ')].filter(Boolean).join(' | ');

    await updateProfileMutation.mutateAsync({
      ...formData,
      location: locationString,
      latitude: formData.latitude ?? (geo.status === "valid" ? geo.latitude : null),
      longitude: formData.longitude ?? (geo.status === "valid" ? geo.longitude : null),
      phone: normalizedPhone,
      availability: availabilityString,
      exchange_areas: exchangeAreas,
      profile_completed: profileComplete
    });

    // Sync to Worker entity if it exists or if we are making it visible
    if (workerProfile || workerData.is_visible) {
      await updateWorkerMutation.mutateAsync({
        ...workerData,
        availability: availabilityString,
        full_name: formData.full_name,
        location: locationString,
        latitude: formData.latitude ?? (geo.status === "valid" ? geo.latitude : null),
        longitude: formData.longitude ?? (geo.status === "valid" ? geo.longitude : null),
        photo_url: user.photo_url,
        phone: normalizedPhone,
        exchange_areas: exchangeAreas
      });
    }
  };

  // Cancel: discard every unsaved edit — restore all fields from the saved
  // user/worker records and clear every validation message.
  const handleCancelEdit = () => {
    if (user) {
      setFormData({
        full_name: user.full_name || "",
        phone: user.phone || "",
        location: user.location || "",
        latitude: user.latitude || null,
        longitude: user.longitude || null,
        bio: user.bio || "",
        skills: user.skills || "",
        user_role: user.user_role || "both"
      });
      setLocationFields(parseLocationString(user.location || ""));
      setExchangeAreas(Array.isArray(user.exchange_areas) ? user.exchange_areas : []);
      const parts = (user.availability || "").split(" | ");
      setSelectedDays(parts[0] ? parts[0].split(", ").filter(Boolean) : []);
      setSelectedTimes(parts[1] ? parts[1].split(", ").filter(Boolean) : []);
      setWorkerData({
        is_visible: workerProfile ? workerProfile.is_visible : false,
        availability: workerProfile?.availability || "",
        skills: workerProfile?.skills || user.skills || "",
        bio: workerProfile?.bio || user.bio || "",
        max_concurrent_offers: workerProfile?.max_concurrent_offers || 10
      });
    }
    setLocationErrors({});
    setZipError("");
    setVisibilityError("");
    setEditSnapshot(null);
    setIsEditing(false);
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
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("profile.auth_title")}</h2>
            <p className="text-gray-600 mb-6">{t("profile.auth_sub")}</p>
            <Button onClick={() => setAuthModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-amber-600 px-8">
              {t("agree.login_continue")}
            </Button>
          </div>
        </div>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} message={t("profile.auth_sub")} />
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

                <h2 className="text-2xl font-bold text-gray-900 mb-1">{displayName(user.full_name)}</h2>
                <p className="text-gray-500 text-sm mb-4">{user.email}</p>

                <div className="flex justify-center gap-2 mb-4">
                  {phoneVerified && (
                    <Badge className="bg-green-100 text-green-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {t("profile.phone_saved")}
                    </Badge>
                  )}
                  {termsAcceptance && (
                    <Badge className="bg-amber-100 text-amber-700">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      {t("profile.terms_accepted", { date: formatDate(termsAcceptance.accepted_at, locale) })}
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
                      {(user.total_ratings || 0) === 1
                        ? t("pub.review_one", { n: user.total_ratings || 0 })
                        : t("pub.reviews_many", { n: user.total_ratings || 0 })}
                    </span>
                  </div>
                )}

                <KarmaDisplay karma={user.karma_points || 0} user={user} showDetails />

                {/* Stats Section */}
                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-200">
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {formatDuration(workerProfile?.hours_completed || 0)}
                    </p>
                    <p className="text-sm text-gray-600">{t("profile.hours_completed")}</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {new Intl.NumberFormat(locale).format(workerProfile?.completed_trades || 0)}
                    </p>
                    <p className="text-sm text-gray-600">{t("profile.completed_trades")}</p>
                  </div>
                </div>

                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full mt-6"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {t("profile.sign_out")}
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
                  <CardTitle>{t("profile.details")}</CardTitle>
                  {!isEditing ? (
                    <Button
                      onClick={() => {
                        setIsEditing(true);
                        setLocationErrors({});
                        setZipError("");
                        setVisibilityError("");
                        setEditSnapshot(captureEditState());
                      }}
                      variant="outline"
                    >
                      {t("profile.edit_profile")}
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button onClick={handleSave} disabled={verifyingLocation} className="bg-orange-600 hover:bg-orange-700">
                        {verifyingLocation ? t("profile.verifying_location") : t("profile.save_changes")}
                      </Button>
                      <Button onClick={handleCancelEdit} variant="outline">
                        {t("common.cancel")}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">{t("profile.full_name")}</Label>
                    <Input
                      id="full_name"
                      value={formData.full_name}
                      onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <PhoneVerificationField
                      value={formData.phone}
                      onChange={(val) => setFormData(p => ({ ...p, phone: val }))}
                      isVerified={phoneVerified}
                      onVerified={() => setPhoneVerified(true)}
                      onUnverified={() => setPhoneVerified(false)}
                      userEmail={user?.email}
                      disabled={!isEditing}
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium">{t("profile.primary_location")} <span className="text-gray-400 font-normal">{t("profile.self_reported")}</span></Label>
                    <div className="mt-2">
                      <LocationFields
                        value={locationFields}
                        disabled={!isEditing}
                        errors={{ ...locationErrors, zip: locationErrors.zip || zipError }}
                        onChange={(fields, locationStr, coords) => {
                          setLocationFields(fields);
                          setLocationErrors({});
                          const hasZip = fields.zip && !/^\d{5}(-\d{4})?$/.test(fields.zip);
                          setZipError(hasZip ? t("profile.zip_invalid") : "");
                          setFormData(prev => ({
                            ...prev,
                            location: locationStr,
                            latitude: coords ? coords.latitude : null,
                            longitude: coords ? coords.longitude : null
                          }));
                        }}
                      />
                    </div>
                    <div className="mt-4">
                      <LocationCheckCard
                        userId={user.id}
                        savedLocation={user.location}
                        hasUnsavedLocation={isEditing && formData.location !== (user.location || "")}
                      />
                    </div>
                  </div>

                  <ExchangeAreasField
                    areas={exchangeAreas}
                    onChange={setExchangeAreas}
                    disabled={!isEditing}
                  />

                  <div>
                    <Label>{t("profile.interested_in")}</Label>
                    <p className="text-xs text-gray-500 mt-1">{t("profile.interested_in_note")}</p>
                    <Select
                      value={formData.user_role}
                      onValueChange={(value) => setFormData({ ...formData, user_role: value })}
                      disabled={!isEditing}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="worker">{t("profile.role_worker")}</SelectItem>
                        <SelectItem value="offerer">{t("profile.role_offerer")}</SelectItem>
                        <SelectItem value="both">{t("profile.role_both")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bio">{t('pub.bio')}</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => setFormData({...formData, bio: e.target.value})}
                      placeholder={t("profile.bio_ph")}
                      rows={4}
                      disabled={!isEditing}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label>{t("profile.skills_services")}</Label>
                    <div className="mt-2 space-y-2 border rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto">
                      {isEditing ? (
                        <>
                        <Accordion type="multiple" className="w-full">
                          {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                            <AccordionItem key={category} value={category}>
                              <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2">
                                {skillLabel(t, category)}
                                                               </AccordionTrigger>
                              <AccordionContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                                  {skills.map((skill) => {
                                                    const currentSkills = parseSkills(workerData.skills || formData.skills);
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
                                            const skillString = newSkills.join(';;');
                                            setWorkerData({...workerData, skills: skillString});
                                            setFormData({...formData, skills: skillString}); // Sync both
                                          }}
                                        />
                                        <label
                                          htmlFor={`skill-${skill}`}
                                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                        >
                                          {skillLabel(t, skill)}
                                        </label>
                                      </div>
                                    );
                                  })}
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                        <CustomSkillInput
                          currentSkills={parseSkills(workerData.skills || formData.skills)}
                          onAdd={(skills) => {
                            const skillString = skills.join(';;');
                            setWorkerData({ ...workerData, skills: skillString });
                            setFormData({ ...formData, skills: skillString });
                          }}
                        />
                        </>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {parseSkills(formData.skills).map((skill, i) => (
                            <Badge key={i} variant="secondary" className="bg-white border-gray-200">
                              {skillLabel(t, skill)}
                            </Badge>
                          ))}
                          {!formData.skills && <p className="text-sm text-gray-500 italic">{t("profile.no_skills_selected")}</p>}
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
                <CardTitle>{t("profile.worker_settings")}</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{t("profile.offer_services")}</p>
                      <p className="text-sm text-gray-500">{t("profile.offer_services_sub")}</p>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={workerData.is_visible}
                        onChange={(e) => {
                          if (e.target.checked && formData.user_role === "offerer" && parseSkills(workerData.skills || formData.skills).length === 0) {
                            setVisibilityError(t("profile.err_visibility"));
                            return;
                          }
                          setVisibilityError("");
                          setWorkerData({...workerData, is_visible: e.target.checked});
                        }}
                        disabled={!isEditing}
                        className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500"
                      />
                    </div>
                  </div>
                  {visibilityError && (
                    <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg p-3">{visibilityError}</p>
                  )}

                  {workerData.is_visible && (
                  <div className="space-y-4 animate-in slide-in-from-top-2">
                    <div>
                      <Label>{t("profile.availability")}</Label>
                      <div className="mt-2 border rounded-lg p-4 bg-gray-50 space-y-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">{t("profile.days_available")}</p>
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
                                <label htmlFor={`profile-day-${day}`} className={`text-sm ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>{t(`day.${day}`)}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">{t("profile.time_slots")}</p>
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
                                <label htmlFor={`profile-time-${slot}`} className={`text-sm ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>{t(`slot.${slot}`)}</label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                      
                      <div>
                        <Label htmlFor="max_offers">{t("profile.max_offers")}</Label>
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
                        <p className="text-xs text-gray-500 mt-1">{t("profile.max_offers_note")}</p>
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
                        <p>{t("profile.worker_note")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Blocked Users */}
            <Card className="border-orange-100 shadow-lg">
              <CardHeader className="border-b border-orange-100">
                <CardTitle className="flex items-center gap-2">
                  <Ban className="w-5 h-5 text-gray-500" />
                  {t("profile.blocked_users")}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {blocked.length === 0 ? (
                  <div className="text-center py-6 text-gray-500">
                    <UserX className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p>{t("profile.no_blocked")}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blocked.map((blockedUser) => (
                      <div key={blockedUser.blocked_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {blockedUser.blocked_name?.[0]?.toUpperCase() || "?"}
                            </span>
                          </div>
                          <span className="font-medium text-gray-900">{displayName(blockedUser.blocked_name)}</span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnblock(blockedUser.blocked_id, blockedUser.blocked_name)}
                        >
                          {t("profile.unblock")}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Reviews */}
            <Card className="border-orange-100 shadow-lg">
              <CardHeader className="border-b border-orange-100">
                <CardTitle>{t("profile.reviews_feedback")}</CardTitle>
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
                          <span className="font-semibold text-gray-900">{displayName(rating.from_user_name)}</span>
                        </div>
                        {rating.review && (
                          <p className="text-gray-700 text-sm">{rating.review}</p>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {formatDate(rating.created_date, locale)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    {t("profile.no_reviews")}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <UnsavedChangesDialog blocker={blocker} />
    </div>
  );
}