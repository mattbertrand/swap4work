import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Clock, MapPin, Star, CheckCircle2,
  AlertCircle, MessageSquare, Eye, User, Crosshair, Calendar, Flag
} from "lucide-react";
import ReportModal from "@/components/moderation/ReportModal";
import AuthModal from "@/components/auth/AuthModal";
import StartNegotiationModal from "@/components/negotiation/StartNegotiationModal";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

// Calculate distance between two coordinates
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Helper to extract only city and state (never street) from location string
const getCityState = (location) => {
  if (!location) return "Location not specified";
  const parts = location.split(',').map(p => p.trim());
  const cleanParts = parts.map(p => p.replace(/\d{5}(-\d{4})?/g, '').trim()).filter(p => p.length > 0);
  if (cleanParts.length === 0) return location;
  if (cleanParts.length === 1) return cleanParts[0];
  const state = cleanParts[cleanParts.length - 1];
  const city = cleanParts[cleanParts.length - 2];
  return `${city}, ${state}`;
};

export default function ItemDetail() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [startNegModalOpen, setStartNegModalOpen] = useState(false);
  const [startNegLoading, setStartNegLoading] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      const items = await base44.entities.Item.filter({ id: itemId });
      return items[0];
    },
    enabled: !!itemId
  });

  // Check all negotiations for this user + item (including closed/declined)
  const { data: allUserNegotiations = [] } = useQuery({
    queryKey: ['allUserNegotiations', itemId, user?.id],
    queryFn: async () => {
      if (!user) return [];
      const negotiations = await base44.entities.Negotiation.filter({
        item_id: itemId,
        bidder_id: user.id
      });
      return negotiations;
    },
    enabled: !!itemId && !!user
  });

  // Check existing active negotiations for this item (for all users)
  const { data: activeNegotiations = [] } = useQuery({
    queryKey: ['negotiations', itemId],
    queryFn: async () => {
      const negotiations = await base44.entities.Negotiation.filter({
        item_id: itemId,
        status: { $in: ['active', 'accepted'] }
      });
      return negotiations;
    },
    enabled: !!itemId
  });

  // Check if user is on waitlist
  const { data: userWaitlist } = useQuery({
    queryKey: ['waitlist', itemId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const waitlist = await base44.entities.ItemWaitlist.filter({
        item_id: itemId,
        user_id: user.id
      });
      return waitlist[0];
    },
    enabled: !!itemId && !!user
  });

  // Determine user's negotiation status with this item
  const userActiveNegotiation = user ? allUserNegotiations.find(n => ['active', 'accepted'].includes(n.status)) : null;
  const userDeclinedNegotiation = user ? allUserNegotiations.find(n => n.status === 'declined') : null;
  const userClosedNegotiation = user ? allUserNegotiations.find(n => n.status === 'closed') : null;

  // Show waitlist only if:
  // 1. Item has 3 active negotiations AND
  // 2. User doesn't have an active/accepted negotiation AND
  // 3. User wasn't declined or closed previously
  const shouldShowWaitlist =
    activeNegotiations.length >= 3 &&
    !userActiveNegotiation &&
    !userDeclinedNegotiation &&
    !userClosedNegotiation;

  // Calculate distance if both user and item have coordinates
  const distance = userLocation && item?.latitude && item?.longitude
    ? calculateDistance(userLocation.lat, userLocation.lng, item.latitude, item.longitude)
    : null;

  const isWithinRange = distance !== null && distance <= 50;

  const getUserLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by your browser"));
        return;
      }

      setGettingLocation(true);
      setLocationError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setGettingLocation(false);
          resolve(location);
        },
        (error) => {
          setGettingLocation(false);
          let errorMessage = "Unable to get your location. ";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage += "Please enable location permissions in your browser.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage += "Location information is unavailable.";
              break;
            case error.TIMEOUT:
              errorMessage += "Location request timed out.";
              break;
            default:
              errorMessage += "An unknown error occurred.";
          }
          setLocationError(errorMessage);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    });
  };

  const handleJoinWaitlist = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    // Check if already on waitlist
    if (userWaitlist) {
      toast.info('You are already on the waitlist for this item');
      return;
    }

    try {
      await base44.entities.ItemWaitlist.create({
        item_id: item.id,
        item_title: item.title,
        user_id: user.id,
        user_name: user.full_name,
        user_email: user.email
      });

      toast.success('Added to waitlist! We\'ll notify you when a negotiation spot opens up.');
      
      // Invalidate query to reflect the change
      queryClient.invalidateQueries(['waitlist', itemId, user.id]);
    } catch (error) {
      console.error('Error joining waitlist:', error);
      toast.error('Failed to join waitlist');
    }
  };

  const handleStartNegotiation = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    // Check if profile is complete
    if (!user.profile_completed || !user.location || !user.phone) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(createPageUrl(`CompleteProfile?returnUrl=${encodeURIComponent(currentUrl)}`));
      return;
    }

    // Check if user already has an active negotiation
    if (userActiveNegotiation) {
      navigate(createPageUrl(`Negotiation?id=${userActiveNegotiation.id}`));
      return;
    }

    // Check negotiation limit (max 3 active per item)
    if (activeNegotiations.length >= 3) {
      toast.info('This item has reached its negotiation limit');
      return;
    }

    // Get user location if not already obtained
    let currentLocation = userLocation;
    if (!currentLocation) {
      try {
        currentLocation = await getUserLocation();
      } catch (error) {
        return;
      }
    }

    // Check if item has coordinates
    if (!item.latitude || !item.longitude) {
      setLocationError("This item doesn't have location coordinates. Cannot verify distance.");
      return;
    }

    // Calculate distance
    const calculatedDistance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      item.latitude,
      item.longitude
    );

    if (calculatedDistance > 50) {
      setLocationError(`This item is ${calculatedDistance.toFixed(1)} miles away. You must be within 50 miles to start a negotiation.`);
      return;
    }

    // All checks passed — open the review modal
    setStartNegModalOpen(true);
  };

  const handleConfirmOffer = async ({ hours, work_type, message }) => {
    setStartNegLoading(true);
    try {
      const negotiation = await base44.entities.Negotiation.create({
        item_id: item.id,
        item_title: item.title,
        offerer_id: item.offerer_id,
        offerer_name: item.offerer_name,
        bidder_id: user.id,
        bidder_name: user.full_name,
        initial_offer_hours: hours,
        work_type: work_type || "",
        status: "active",
        current_offer_by: user.id,
        offer_history: [{
          offered_by: user.id,
          offered_by_name: user.full_name,
          hours,
          work_type: work_type || "",
          message: message || "",
          timestamp: new Date().toISOString()
        }],
        last_activity: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      });

      const offerText = `${user.full_name} offered ${hours} hours${work_type ? ` for ${work_type}` : ''}${message ? `\n\n${message}` : ''}`;

      await base44.entities.Message.create({
        negotiation_id: negotiation.id,
        from_user_id: user.id,
        from_user_name: user.full_name,
        to_user_id: item.offerer_id,
        text: offerText,
        message_type: "offer",
        proposal_hours: hours
      });

      await base44.entities.Notification.create({
        user_id: item.offerer_id,
        type: 'new_negotiation',
        title: 'New negotiation started',
        message: `${user.full_name} wants to trade work for your ${item.title}`,
        related_id: negotiation.id,
        related_type: 'negotiation',
        link_url: createPageUrl(`Negotiation?id=${negotiation.id}`),
        from_user_id: user.id,
        from_user_name: user.full_name
      });

      setStartNegModalOpen(false);
      navigate(createPageUrl(`Negotiation?id=${negotiation.id}`));
    } finally {
      setStartNegLoading(false);
    }
  };

  const handleRequestInspection = async () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    // Check if profile is complete
    if (!user.profile_completed || !user.location || !user.phone) {
      const currentUrl = window.location.pathname + window.location.search;
      navigate(createPageUrl(`CompleteProfile?returnUrl=${encodeURIComponent(currentUrl)}`));
      return;
    }

    // Get location for inspection request too
    let currentLocation = userLocation;
    if (!currentLocation) {
      try {
        currentLocation = await getUserLocation();
      } catch (error) {
        return;
      }
    }

    if (!item.latitude || !item.longitude) {
      setLocationError("This item doesn't have location coordinates. Cannot verify distance.");
      return;
    }

    const calculatedDistance = calculateDistance(
      currentLocation.lat,
      currentLocation.lng,
      item.latitude,
      item.longitude
    );

    if (calculatedDistance > 50) {
      setLocationError(`This item is ${calculatedDistance.toFixed(1)} miles away. You must be within 50 miles to request an inspection.`);
      return;
    }

    // Create negotiation first
    if (userActiveNegotiation) {
      navigate(createPageUrl(`Negotiation?id=${userActiveNegotiation.id}`));
      return;
    }

    const negotiation = await base44.entities.Negotiation.create({
      item_id: item.id,
      item_title: item.title,
      offerer_id: item.offerer_id,
      offerer_name: item.offerer_name,
      bidder_id: user.id,
      bidder_name: user.full_name,
      initial_offer_hours: item.required_hours,
      status: "active",
      current_offer_by: user.id,
      last_activity: new Date().toISOString(),
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    });

    await base44.entities.Message.create({
      negotiation_id: negotiation.id,
      from_user_id: user.id,
      from_user_name: user.full_name,
      to_user_id: item.offerer_id,
      text: "I would like to request an in-person inspection of this item before proceeding with the negotiation.",
      message_type: "text"
    });

    navigate(createPageUrl(`Negotiation?id=${negotiation.id}`));
  };

  if (isLoading) {
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
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Item not found</h2>
          <Button onClick={() => navigate(createPageUrl("Browse"))}>
            Browse Items
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.offerer_id;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-orange-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Carousel */}
            <Card className="overflow-hidden border-orange-100 shadow-xl">
              <Carousel className="w-full">
                <CarouselContent>
                  {item.photos?.map((photo, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-[4/3] bg-gray-100">
                        <img
                          src={photo}
                          alt={`${item.title} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {item.photos?.length > 1 && (
                  <>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                  </>
                )}
              </Carousel>
            </Card>

            {/* Description */}
            <Card className="border-orange-100 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
              </CardContent>
            </Card>

            {/* Suggested Tasks */}
            {item.suggested_tasks && (
              <Card className="border-orange-100 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Suggested Tasks</h2>
                  <p className="text-gray-700 whitespace-pre-line">{item.suggested_tasks}</p>
                </CardContent>
              </Card>
            )}

            {/* Offerer Terms */}
            {item.offerer_terms && (
              <Card className="border-orange-100 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Terms & Conditions</h2>
                  <p className="text-gray-700 whitespace-pre-line">{item.offerer_terms}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sticky Info Card */}
          <div className="lg:sticky lg:top-8 h-fit">
            <Card className="border-orange-100 shadow-xl">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{item.title}</h1>
                  <div className="flex gap-2 mb-4">
                    <Badge className="bg-orange-100 text-orange-700">
                      {item.category}
                    </Badge>
                    <Badge className="bg-green-100 text-green-700">
                      {item.condition}
                    </Badge>
                  </div>
                  {/* Time posted */}
                  <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                    <Calendar className="w-4 h-4" />
                    <span>Posted {formatDistanceToNow(new Date(item.created_date?.endsWith('Z') ? item.created_date : item.created_date + 'Z'), { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 font-medium">Required Work</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-orange-600" />
                    <span className="text-4xl font-bold text-gray-900">{item.required_hours}</span>
                    <span className="text-xl text-gray-600">hours</span>
                  </div>
                  {item.estimated_value > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      Est. value: ${item.estimated_value}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{getCityState(item.location)}</span>
                  </div>
                  {distance !== null && (
                    <div className="flex items-center gap-3 text-gray-700">
                      <Crosshair className="w-5 h-5 text-gray-400" />
                      <span className={isWithinRange ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                        {distance.toFixed(1)} miles away {isWithinRange ? "✓" : "(Too far)"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Location verification banner */}
                {!isOwner && !userActiveNegotiation && !userLocation && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <Crosshair className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-900 text-sm">
                      📍 You'll need to verify your location (within 50 miles) to start negotiating for this item.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Location error */}
                {locationError && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    <AlertDescription className="text-red-900 text-sm">
                      {locationError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Active Negotiations Badge - Only show if not owner and user does not have an active negotiation */}
                {!isOwner && activeNegotiations.length > 0 && !userActiveNegotiation && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-sm text-blue-900">
                      <strong>{activeNegotiations.length}</strong> active negotiation{activeNegotiations.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}

                {/* Waitlist Feature */}
                {!isOwner && shouldShowWaitlist && (
                  <Alert className="bg-purple-50 border-purple-200">
                    <AlertCircle className="w-4 h-4 text-purple-600" />
                    <AlertDescription>
                      <p className="text-purple-900 font-semibold mb-2">
                        This item has reached its negotiation limit (3/3)
                      </p>
                      {userWaitlist ? (
                        <div className="flex items-center gap-2 text-purple-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-sm">You're on the waitlist! We'll notify you when a spot opens.</span>
                        </div>
                      ) : (
                        <Button
                          onClick={handleJoinWaitlist}
                          size="sm"
                          className="mt-2 bg-purple-600 hover:bg-purple-700"
                        >
                          Join Waitlist
                        </Button>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Offerer Info - Link to Public Profile */}
                <Link to={createPageUrl(`PublicProfile?userId=${item.offerer_id}`)}>
                  <Card className="bg-gray-50 border-gray-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer group">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {item.offerer_photo_url ? (
                          <img
                            src={item.offerer_photo_url}
                            alt={item.offerer_name}
                            className="w-12 h-12 rounded-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center group-hover:scale-105 transition-transform">
                            <span className="text-white font-bold text-lg">
                              {item.offerer_name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors">
                              {item.offerer_name}
                            </p>
                            <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-orange-600 opacity-0 group-hover:opacity-100 transition-all" />
                          </div>
                          <p className="text-xs text-gray-500">View other items from this user</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Action Buttons */}
                {!isOwner && (
                  <div className="space-y-3">
                    {userActiveNegotiation ? (
                      <Button
                        onClick={() => navigate(createPageUrl(`Negotiation?id=${userActiveNegotiation.id}`))}
                        className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700"
                      >
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Continue Negotiation
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={handleStartNegotiation}
                          disabled={activeNegotiations.length >= 3 || gettingLocation}
                          className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                        >
                          {gettingLocation ? (
                            <>
                              <Crosshair className="w-5 h-5 mr-2 animate-spin" />
                              Verifying Location...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="w-5 h-5 mr-2" />
                              {activeNegotiations.length >= 3 ? 'Negotiation Limit Reached' : 'Start Negotiation'}
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleRequestInspection}
                          disabled={activeNegotiations.length >= 3 || gettingLocation}
                          variant="outline"
                          className="w-full h-12"
                        >
                          <Eye className="w-5 h-5 mr-2" />
                          Request Inspection
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {isOwner && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-blue-900">
                      This is your listing
                    </p>
                  </div>
                )}

                {!isOwner && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setReportModalOpen(true)}
                    className="w-full text-gray-400 hover:text-red-600"
                  >
                    <Flag className="w-4 h-4 mr-2" />
                    Report this listing
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} message="Create an account or log in to interact with this listing." />
      <StartNegotiationModal
        open={startNegModalOpen}
        onClose={() => setStartNegModalOpen(false)}
        item={item}
        onConfirm={handleConfirmOffer}
        loading={startNegLoading}
      />
      <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        currentUser={user}
        targetType="item"
        targetId={item.id}
        targetName={item.title}
        reportedUserId={item.offerer_id}
        reportedUserName={item.offerer_name}
      />
    </div>
  );
}