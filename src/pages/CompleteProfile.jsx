import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import LocationFields, { parseLocationString } from "@/components/location/LocationFields";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

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

const DAYS = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];
const TIME_SLOTS = ["Morning (6am–12pm)","Afternoon (12pm–5pm)","Evening (5pm–9pm)","Night (9pm+)"];

export default function CompleteProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const returnUrl = urlParams.get('returnUrl') || createPageUrl("Home");
  
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [zipError, setZipError] = useState("");
  const [locationFields, setLocationFields] = useState({ street: "", city: "", state: "", zip: "" });

  const [formData, setFormData] = useState({
    phone: "",
    location: "",
    bio: "",
    skills: "",
    availability: "",
    photo_url: "",
    user_role: "both",
    latitude: null,
    longitude: null
  });
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);

  useEffect(() => {
    base44.auth.me().then(userData => {
      setUser(userData);
      setFormData({
        phone: userData.phone || "",
        location: userData.location || "",
        bio: userData.bio || "",
        skills: userData.skills || "",
        availability: userData.availability || "",
        photo_url: userData.photo_url || "",
        user_role: userData.user_role || "both",
        latitude: userData.latitude || null,
        longitude: userData.longitude || null
      });
      setLocationFields(parseLocationString(userData.location || ""));
      // Parse availability back into days/times if it exists
      if (userData.availability) {
        const parts = userData.availability.split(' | ');
        if (parts[0]) setSelectedDays(parts[0].split(', ').filter(Boolean));
        if (parts[1]) setSelectedTimes(parts[1].split(', ').filter(Boolean));
      }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.phone) {
      toast.error("Please fill in your phone number");
      return;
    }
    if (!locationFields.city || !locationFields.state || !locationFields.zip) {
      toast.error("Please fill in city, state, and ZIP code");
      return;
    }
    if (zipError) {
      toast.error("Please enter a valid ZIP code");
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
        availability: availabilityString,
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
                <Label className="text-base font-semibold">
                  Location <span className="text-red-500">*</span>
                </Label>
                <p className="text-xs text-gray-500 mb-2">Used to connect you with nearby community members</p>
                <LocationFields
                  value={locationFields}
                  errors={{ zip: zipError }}
                  onChange={(fields, locationStr) => {
                    setLocationFields(fields);
                    setZipError(fields.zip && !/^\d{5}(-\d{4})?$/.test(fields.zip) ? "Enter a valid 5-digit ZIP code" : "");
                    setFormData(prev => ({ ...prev, location: locationStr }));
                  }}
                />
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
                <Label>Skills & Services</Label>
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
                              const currentSkills = (formData.skills || "").split(';;').map(s => s.trim()).filter(Boolean);
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
                                  <label htmlFor={`cp-skill-${skill}`} className="text-sm cursor-pointer">{skill}</label>
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
                    {formData.skills.split(';;').filter(Boolean).map((s, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{s.trim()}</Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Availability */}
              <div>
                <Label>Availability</Label>
                <div className="mt-2 border rounded-lg p-4 bg-gray-50 space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Days available</p>
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
                          <label htmlFor={`day-${day}`} className="text-sm cursor-pointer">{day}</label>
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
                            id={`time-${slot}`}
                            checked={selectedTimes.includes(slot)}
                            onCheckedChange={(checked) => {
                              setSelectedTimes(prev => checked ? [...prev, slot] : prev.filter(t => t !== slot));
                            }}
                          />
                          <label htmlFor={`time-${slot}`} className="text-sm cursor-pointer">{slot}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading || uploading}
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