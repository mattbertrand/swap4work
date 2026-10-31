import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { authLoginUrl } from "@/lib/authNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import PhoneVerificationField from "@/components/profile/PhoneVerificationField";
import LocationFields, { parseLocationString, buildLocationString } from "@/components/location/LocationFields";
import { verifyLocationOnline } from "@/lib/locationValidation";
import { isValidPhone, normalizePhoneToE164 } from "@/lib/phone";
import { useUnsavedChanges } from "@/hooks/useUnsavedChanges";
import UnsavedChangesDialog from "@/components/forms/UnsavedChangesDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { parseSkills } from "@/lib/skills";
import TermsDialog from "@/components/terms/TermsDialog";
import CustomSkillInput from "@/components/profile/CustomSkillInput";
import { isValidCityName } from "@/lib/location";
import { toast } from "sonner";
import { useAuth } from "@/lib/AuthContext";
import { useLanguage } from '@/i18n/LanguageContext';
import { skillLabel } from '@/i18n/skillLabels';

const SKILL_CATEGORIES = {
  "Home Repairs / Maintenance": ["Handyman work","Furniture assembly","Mounting (TVs, shelves)","Minor plumbing","Minor electrical","Painting","Drywall patching","Appliance installation","Pressure washing","HVAC filter change"],
  "Home Cleaning & Organization": ["Regular house cleaning","Deep cleaning","Move-in / move-out cleaning","Laundry & folding","Closet / home organization","Dishwashing","Garage / attic clean-out"],
  "Outdoor / Yard Work": ["Lawn mowing","Weeding","Hedge trimming","Tree trimming (light)","Garden maintenance","Leaf removal","Snow removal","Gutter cleaning"],
  "Errands & Personal Assistance": ["Grocery shopping","Package drop-off/pick-up","Waiting in line","Personal assistant tasks","Pet sitting / pet walking","House sitting","Transportation"],
  "Moving & Delivery": ["Help moving","Packing / unpacking","Small deliveries","Item pickup & drop-off"],
  "Digital & Professional Services": ["Basic graphic design","Social media help","Photography","Basic bookkeeping","Resume writing","Transcription","Tutoring","Tech support"],
  "Child / Family Support": ["Babysitting","Homework help","Senior assistance (non-medical)"],
  "Creative / Craft": ["Custom crafts","Sewing / alterations","Event decoration","Handmade art creation"]
};

const ITEM_CATEGORIES = ["Electronics","Home Goods","Furniture","Appliances","Tools","Sports Equipment","Other"];
const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const TIME_SLOTS = ["Morning (6am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–9pm)","Night (9pm+)"];

export default function CompleteProfile() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  // Only allow relative paths to prevent open redirect
  const rawReturnUrl = urlParams.get('returnUrl') || createPageUrl("Home");
  const returnUrl = rawReturnUrl.startsWith('/') && !rawReturnUrl.startsWith('//') && !rawReturnUrl.includes('\\')
    ? rawReturnUrl
    : createPageUrl("Home");
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [zipError, setZipError] = useState("");
  const [locationFields, setLocationFields] = useState({ street: "", city: "", state: "", zip: "" });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [existingTerms, setExistingTerms] = useState(null);
  const [initialSnapshot, setInitialSnapshot] = useState(null);
  const [locationErrors, setLocationErrors] = useState({});
  const [verifyingLocation, setVerifyingLocation] = useState(false);

  const [phoneVerified, setPhoneVerified] = useState(false);
  const [formData, setFormData] = useState({
    phone: "",
    location: "",
    bio: "",
    skills: "",
    availability: "",
    photo_url: "",
    user_role: "both",
    trading_interests: [],
    latitude: null,
    longitude: null
  });
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);

  useEffect(() => {
    base44.auth.me().then(async userData => {
      setUser(userData);
      const parsedLoc = parseLocationString(userData.location || "");
      const availabilityParts = userData.availability ? userData.availability.split(' | ') : [];
      const days = availabilityParts[0] ? availabilityParts[0].split(', ').filter(Boolean) : [];
      const times = availabilityParts[1] ? availabilityParts[1].split(', ').filter(Boolean) : [];
      const formValues = {
        phone: userData.phone || "",
        location: userData.location || "",
        bio: userData.bio || "",
        skills: userData.skills || "",
        availability: userData.availability || "",
        photo_url: userData.photo_url || "",
        user_role: userData.user_role || "both",
        trading_interests: Array.isArray(userData.trading_interests) ? userData.trading_interests : [],
        latitude: userData.latitude || null,
        longitude: userData.longitude || null
      };
      setFormData(formValues);
      setLocationFields(parsedLoc);
      setSelectedDays(days);
      setSelectedTimes(times);
      // Phone confirmation comes from the server-written PhoneVerification
      // record (created by the verification function) — never a client flag
      let phoneIsVerified = false;
      try {
        const verifications = await base44.entities.PhoneVerification.filter({ user_id: userData.id });
        phoneIsVerified = verifications.some(v => v.phone && v.phone === (userData.phone || ""));
      } catch (err) {
        // Don't block profile completion if this lookup fails
      }
      setPhoneVerified(phoneIsVerified);

      // Check if the user has already accepted the terms
      let hasAccepted = false;
      try {
        const acceptances = await base44.entities.TermsAcceptance.filter({ user_id: userData.id });
        if (acceptances.length > 0) {
          setExistingTerms(acceptances[0]);
          setTermsAccepted(true);
          hasAccepted = true;
        }
      } catch (err) {
        // Don't block profile completion if this lookup fails
      }
      // Snapshot the loaded state for unsaved-changes detection
      setInitialSnapshot(JSON.stringify({
        ...formValues,
        locationFields: parsedLoc,
        selectedDays: [...days].sort(),
        selectedTimes: [...times].sort(),
        phoneVerified: phoneIsVerified,
        termsAccepted: hasAccepted
      }));
    }).catch(() => {
      navigate(authLoginUrl(window.location.pathname + window.location.search));
    });
  }, []);

  // --- Unsaved changes protection ---
  const captureCompleteState = () => JSON.stringify({
    ...formData,
    locationFields,
    selectedDays: [...selectedDays].sort(),
    selectedTimes: [...selectedTimes].sort(),
    phoneVerified,
    termsAccepted
  });
  const isDirty = !!user && !!initialSnapshot && captureCompleteState() !== initialSnapshot;
  const { blocker, markClean } = useUnsavedChanges(isDirty);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData(prev => ({ ...prev, photo_url: file_url }));
      toast.success(t('complete.photo_ok'));
    } catch (error) {
      console.error("Error uploading photo:", error);
      toast.error(t('complete.photo_error'));
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.phone) {
      toast.error(t('complete.phone_required'));
      return;
    }
    if (!isValidPhone(formData.phone)) {
      toast.error(t('profile.err_phone'));
      return;
    }
    // --- Required location validation (City, ZIP, State; street optional) ---
    const locErrors = {};
    if (!locationFields.city) locErrors.city = t('profile.err_city_required');
    else if (!isValidCityName(locationFields.city)) locErrors.city = t('profile.err_city_invalid');
    if (!locationFields.state) locErrors.state = t('profile.err_state_required');
    if (!locationFields.zip) locErrors.zip = t('profile.err_zip_required');
    else if (!/^\d{5}(-\d{4})?$/.test(locationFields.zip)) locErrors.zip = t('profile.zip_invalid');
    if (Object.keys(locErrors).length > 0) {
      setLocationErrors(locErrors);
      toast.error(t('profile.err_location'));
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
        toast.success(t('profile.toast_verified', { city: geo.city, state: locationFields.state }));
      }
    } else {
      // Validation service unreachable: fall back to the format checks above so
      // a temporary outage never permanently blocks a legitimate save.
      toast.warning(t('profile.toast_geo_offline'));
    }
    const locationString = buildLocationString(finalLocationFields);
    setFormData(prev => ({ ...prev, location: locationString }));

    if (!termsAccepted) {
      toast.error(t('complete.terms_required'));
      return;
    }

    const availabilityString = [
      selectedDays.join(', '),
      selectedTimes.join(', ')
    ].filter(Boolean).join(' | ');

    setLoading(true);
    try {
      console.log('💾 Saving profile:', formData);
      await base44.auth.updateMe({
        ...formData,
        location: locationString,
        latitude: formData.latitude ?? (geo.status === "valid" ? geo.latitude : null),
        longitude: formData.longitude ?? (geo.status === "valid" ? geo.longitude : null),
        phone: normalizePhoneToE164(formData.phone) || formData.phone,
        availability: availabilityString,
        profile_completed: true
      });
      if (!existingTerms) {
        await base44.entities.TermsAcceptance.create({
          user_id: user.id,
          terms_version: "1.0",
          accepted_at: new Date().toISOString()
        });
      }
      await refreshUser();
      toast.success(t('complete.success'));
      markClean();
      navigate(returnUrl);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error(t('complete.error'));
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('profile.complete_your_profile')}</h1>
          <p className="text-gray-600">{t('complete.sub')}</p>
        </div>

        <Card className="border-orange-100 shadow-xl">
          <CardHeader className="border-b border-orange-100 bg-white">
            <CardTitle>{t('complete.info')}</CardTitle>
            <p className="text-sm text-gray-500 mt-1">{t('complete.trust')}</p>
          </CardHeader>

          <CardContent className="p-6 bg-white">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Profile Photo */}
              <div className="flex flex-col items-center">
                <Label className="text-base font-semibold mb-3">{t('complete.photo')}</Label>
                <div className="relative">
                  {formData.photo_url ? (
                    <img
                      src={formData.photo_url}
                      alt={t('complete.photo')}
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
                {uploading && <p className="text-sm text-gray-500 mt-2">{t('common.uploading')}</p>}
              </div>

              {/* Phone */}
              <PhoneVerificationField
                value={formData.phone}
                onChange={(val) => setFormData(p => ({ ...p, phone: val }))}
                isVerified={phoneVerified}
                onVerified={() => setPhoneVerified(true)}
                onUnverified={() => setPhoneVerified(false)}
                userEmail={user?.email}
              />

              {/* Location */}
              <div>
                <Label className="text-base font-semibold">
                  {t('create.location')} <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-gray-500 mb-2">{t('complete.location_help')}</p>
                <LocationFields
                  value={locationFields}
                  errors={{ ...locationErrors, zip: locationErrors.zip || zipError }}
                  onChange={(fields, locationStr, coords) => {
                    setLocationFields(fields);
                    setLocationErrors({});
                    setZipError(fields.zip && !/^\d{5}(-\d{4})?$/.test(fields.zip) ? t('profile.zip_invalid') : '');
                    setFormData(prev => ({
                      ...prev,
                      location: locationStr,
                      // Manual edits clear coordinates (same as Profile) so a
                      // stale "Locate Me" location is never saved with a new city
                      latitude: coords ? coords.latitude : null,
                      longitude: coords ? coords.longitude : null
                    }));
                  }}
                />
              </div>

              {/* User Role */}
              <div>
                <Label htmlFor="user_role">{t('profile.interested_in')}</Label>
                <Select value={formData.user_role} onValueChange={(value) => setFormData({...formData, user_role: value})}>
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="worker">{t('profile.role_worker')}</SelectItem>
                    <SelectItem value="offerer">{t('profile.role_offerer')}</SelectItem>
                    <SelectItem value="both">{t('profile.role_both')}</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-2">{t('profile.interested_in_note')}</p>
              </div>

              {/* Bio */}
              <div>
                <Label htmlFor="bio">{t('complete.about')}</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  placeholder={t('complete.bio_ph')}
                  rows={4}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('complete.bio_help')}
                </p>
              </div>

              {/* Skills (workers/both) or item-interest picker (offerer) */}
              {formData.user_role === "offerer" ? (
                <div>
                  <Label>{t('complete.interests')}</Label>
                  <p className="text-xs text-gray-500 mb-2">{t('complete.interests_help')}</p>
                  <div className="mt-2 border rounded-lg p-4 bg-gray-50">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {ITEM_CATEGORIES.map((cat) => (
                        <div key={cat} className="flex items-center space-x-2">
                          <Checkbox
                            id={`cp-interest-${cat}`}
                            checked={formData.trading_interests.includes(cat)}
                            onCheckedChange={(checked) => {
                              const interests = checked
                                ? [...formData.trading_interests, cat]
                                : formData.trading_interests.filter((c) => c !== cat);
                              setFormData({ ...formData, trading_interests: interests });
                            }}
                          />
                          <label htmlFor={`cp-interest-${cat}`} className="text-sm cursor-pointer">{t(`category.${cat}`)}</label>
                        </div>
                      ))}
                    </div>
                    {formData.trading_interests.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {formData.trading_interests.map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{t(`category.${c}`)}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
              <div>
                <Label>{t('profile.skills_services')}</Label>
                <div className="mt-2 border rounded-lg p-4 bg-gray-50 max-h-80 overflow-y-auto">
                  <Accordion type="multiple" className="w-full">
                    {Object.entries(SKILL_CATEGORIES).map(([category, skills]) => (
                      <AccordionItem key={category} value={category}>
                        <AccordionTrigger className="text-sm font-semibold hover:no-underline py-2">
                          {category}
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2">
                            {skills.map((skill) => {
                              const currentSkills = parseSkills(formData.skills);
                              const isSelected = currentSkills.includes(skill);
                              return (
                                <div key={skill} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`cp-skill-${skill}`}
                                    checked={isSelected}
                                    onCheckedChange={(checked) => {
                                      let newSkills = [...currentSkills];
                                      if (checked) { if (!newSkills.includes(skill)) newSkills.push(skill); }
                                      else { newSkills = newSkills.filter(s => s !== skill); }
                                      setFormData({...formData, skills: newSkills.join(';;')});
                                    }}
                                  />
                                  <label htmlFor={`cp-skill-${skill}`} className="text-sm cursor-pointer">{skillLabel(t, skill)}</label>
                                </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
                {formData.skills && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {parseSkills(formData.skills).map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{skillLabel(t, s)}</Badge>
                    ))}
                  </div>
                )}
                <CustomSkillInput
                  currentSkills={parseSkills(formData.skills)}
                  onAdd={(skills) => setFormData({ ...formData, skills: skills.join(';;') })}
                />
              </div>
              )}

              {/* Availability */}
              <div>
                <Label>{t('profile.availability')}</Label>
                <div className="mt-2 border rounded-lg p-4 bg-gray-50 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">{t('profile.days_available')}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {DAYS.map(day => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day}`}
                            checked={selectedDays.includes(day)}
                            onCheckedChange={(checked) => {
                              setSelectedDays(prev => checked ? [...prev, day] : prev.filter(d => d !== day));
                            }}
                          />
                          <label htmlFor={`day-${day}`} className="text-sm cursor-pointer">{t(`day.${day}`)}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">{t('profile.time_slots')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {TIME_SLOTS.map(slot => (
                        <div key={slot} className="flex items-center space-x-2">
                          <Checkbox
                            id={`time-${slot}`}
                            checked={selectedTimes.includes(slot)}
                            onCheckedChange={(checked) => {
                              setSelectedTimes(prev => checked ? [...prev, slot] : prev.filter(t => t !== slot));
                            }}
                          />
                          <label htmlFor={`time-${slot}`} className="text-sm cursor-pointer">{t(`slot.${slot}`)}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Terms & Conditions */}
              <div className="border border-orange-200 rounded-lg p-4 bg-orange-50/60">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="terms-accept"
                    checked={termsAccepted}
                    onCheckedChange={setTermsAccepted}
                    className="mt-0.5"
                  />
                  <label htmlFor="terms-accept" className="text-sm text-gray-700 leading-relaxed">
                    {t('complete.terms_before')}{' '}
                    <button
                      type="button"
                      onClick={() => setTermsOpen(true)}
                      className="text-orange-600 font-medium underline hover:text-orange-700"
                    >
                      {t('footer.terms')}
                    </button>{" "}
                    {t('complete.terms_after')}{' '}
                    <span className="text-red-500">*</span>
                  </label>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || uploading || verifyingLocation}
                className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
              >
                {loading || verifyingLocation ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    {t(loading ? 'common.saving' : 'profile.verifying_location')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    {t('complete.save')}
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <UnsavedChangesDialog blocker={blocker} />
      <TermsDialog open={termsOpen} onOpenChange={setTermsOpen} />
    </div>
  );
}