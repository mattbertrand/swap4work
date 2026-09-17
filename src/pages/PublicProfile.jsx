import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { parseSkills } from "@/lib/skills";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Star, MapPin, CheckCircle2, Clock, Package, Briefcase, MessageSquare, Filter, MoreVertical, Flag, Ban } from "lucide-react";
import ReportModal from "@/components/moderation/ReportModal";
import BlockUserDialog from "@/components/moderation/BlockUserDialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import KarmaDisplay from "../components/profile/KarmaDisplay";
import ItemCard from "../components/browse/ItemCard";
import AuthModal from "@/components/auth/AuthModal";

export default function PublicProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const userId = urlParams.get('userid') || urlParams.get('userId');
  const workerId = urlParams.get('workerid') || urlParams.get('workerId');
  const nameFromUrl = urlParams.get('name') || "";

  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => setCurrentUser(null));
  }, []);

  const { data: userProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['publicProfile', userId, workerId],
    queryFn: async () => {
      // Try by user_id first, then by worker record id directly
      let worker = null;
      if (userId) {
        const workers = await base44.entities.Worker.filter({ user_id: userId });
        worker = workers[0];
      }
      // Fallback: look up worker directly by its own id
      if (!worker && workerId) {
        try {
          const workers = await base44.entities.Worker.filter({ id: workerId });
          worker = workers[0];
        } catch {}
      }
      if (worker) {
        const resolvedUserId = userId || worker.user_id;
        return {
          id: resolvedUserId,
          full_name: worker.full_name,
          photo_url: worker.photo_url,
          location: worker.location,
          bio: worker.bio,
          skills: worker.skills,
          email: worker.email,
          hours_completed: worker.hours_completed,
          completed_trades: worker.completed_trades,
          rating: worker.rating,
          total_ratings: worker.total_ratings,
          karma_points: 0,
        };
      }
      // Fallback: try to get basic info from any of their items (any status)
      const items = await base44.entities.Item.filter({ offerer_id: userId }, '-created_date', 1);
      if (items[0]) {
        return {
          id: userId,
          full_name: items[0].offerer_name || nameFromUrl,
          photo_url: null,
          location: items[0].location,
          bio: null,
          skills: null,
          hours_completed: 0,
          completed_trades: 0,
          rating: 0,
          total_ratings: 0,
          karma_points: 0,
        };
      }
      // Last resort: if we have a name from URL, show a minimal profile
      if (nameFromUrl) {
        return {
          id: userId,
          full_name: nameFromUrl,
          photo_url: null,
          location: null,
          bio: null,
          skills: null,
          hours_completed: 0,
          completed_trades: 0,
          rating: 0,
          total_ratings: 0,
          karma_points: 0,
        };
      }
      return null;
    },
    enabled: !!(userId || workerId)
  });

  // Resolved userId: prefer URL param, fallback to worker's user_id from profile
  const resolvedUserId = userId || userProfile?.id;

  const { data: userItems = [], isLoading: itemsLoading } = useQuery({
    queryKey: ['userActiveItems', resolvedUserId],
    queryFn: () => base44.entities.Item.filter({ 
      offerer_id: resolvedUserId, 
      status: 'active' 
    }, '-created_date'),
    enabled: !!resolvedUserId
  });

  const { data: ratings = [] } = useQuery({
    queryKey: ['userRatings', resolvedUserId],
    queryFn: () => base44.entities.Rating.filter({ 
      to_user_id: resolvedUserId, 
      published: true 
    }, '-created_date', 10),
    enabled: !!resolvedUserId
  });

  const { data: workerEntity } = useQuery({
    queryKey: ['workerEntity', resolvedUserId, workerId],
    queryFn: async () => {
      if (resolvedUserId) {
        const workers = await base44.entities.Worker.filter({ user_id: resolvedUserId });
        if (workers[0]) return workers[0];
      }
      if (workerId) {
        const workers = await base44.entities.Worker.filter({ id: workerId });
        return workers[0];
      }
      return null;
    },
    enabled: !!(resolvedUserId || workerId)
  });

  const { data: userRecord } = useQuery({
    queryKey: ['userRecord', resolvedUserId],
    queryFn: async () => {
      if (!resolvedUserId) return null;
      const users = await base44.entities.User.filter({ id: resolvedUserId });
      return users[0];
    },
    enabled: !!resolvedUserId
  });

  const { data: karmaTransactions = [] } = useQuery({
    queryKey: ['karmaTransactions', resolvedUserId],
    queryFn: () => base44.entities.KarmaTransaction.filter({ user_id: resolvedUserId }),
    enabled: !!resolvedUserId
  });

  const karmaPoints = React.useMemo(() => {
    return karmaTransactions.reduce((sum, t) => sum + (t.type === 'gain' ? t.points : -Math.abs(t.points)), 0);
  }, [karmaTransactions]);

  const { data: activeNegotiations = [] } = useQuery({
    queryKey: ['workerActiveNegotiations', resolvedUserId],
    queryFn: () => base44.entities.Negotiation.filter({ 
      bidder_id: resolvedUserId, 
      status: { $in: ['active', 'accepted'] } 
    }),
    enabled: !!resolvedUserId
  });

  const { data: myItems = [] } = useQuery({
    queryKey: ['myItems', currentUser?.id],
    queryFn: () => base44.entities.Item.filter({ 
      offerer_id: currentUser.id, 
      status: 'active' 
    }),
    enabled: !!currentUser
  });

  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [serviceNote, setServiceNote] = useState("");
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [reviewSort, setReviewSort] = useState("newest");
  const [reviewFilter, setReviewFilter] = useState("all");
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

  const filteredAndSortedRatings = React.useMemo(() => {
    let result = [...ratings];
    if (reviewFilter !== "all") {
      result = result.filter(r => r.stars === parseInt(reviewFilter));
    }
    if (reviewSort === "newest") result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    else if (reviewSort === "oldest") result.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    else if (reviewSort === "highest") result.sort((a, b) => b.stars - a.stars);
    else if (reviewSort === "lowest") result.sort((a, b) => a.stars - b.stars);
    return result;
  }, [ratings, reviewSort, reviewFilter]);

  const avgRating = React.useMemo(() => {
    if (!ratings.length) return 0;
    return (ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length).toFixed(1);
  }, [ratings]);

  const createNegotiationMutation = useMutation({
    mutationFn: async () => {
      const selectedItem = myItems.find(i => i.id === selectedItemId);
      if (!selectedItem) throw new Error("Item not found");

      const negotiation = await base44.entities.Negotiation.create({
        item_id: selectedItem.id,
        item_title: selectedItem.title,
        offerer_id: currentUser.id,
        offerer_name: currentUser.full_name,
        bidder_id: userId, // The worker is the bidder (providing service)
        bidder_name: userProfile.full_name,
        initial_offer_hours: selectedItem.required_hours, // Default to item's hours
        status: "active",
        current_offer_by: currentUser.id,
        offer_history: [{
          offered_by: currentUser.id,
          offered_by_name: currentUser.full_name,
          hours: selectedItem.required_hours,
          work_type: "Service Request",
          timestamp: new Date().toISOString()
        }],
        last_activity: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      });

      await base44.entities.Message.create({
        negotiation_id: negotiation.id,
        from_user_id: currentUser.id,
        from_user_name: currentUser.full_name,
        to_user_id: userId,
        text: `I'd like to request your service in exchange for my item "${selectedItem.title}".\n\nNote: ${serviceNote}`,
        message_type: "offer",
        proposal_hours: selectedItem.required_hours
      });

      await base44.entities.Notification.create({
        user_id: userId,
        type: 'new_negotiation',
        title: 'New service request',
        message: `${currentUser.full_name} requested your service in exchange for ${selectedItem.title}`,
        related_id: negotiation.id,
        related_type: 'negotiation',
        link_url: createPageUrl(`Negotiation?id=${negotiation.id}`),
        from_user_id: currentUser.id,
        from_user_name: currentUser.full_name
      });

      return negotiation;
    },
    onSuccess: (negotiation) => {
      toast.success("Service request sent!");
      setServiceModalOpen(false);
      navigate(createPageUrl(`Negotiation?id=${negotiation.id}`));
    },
    onError: () => {
      toast.error("Failed to send request");
    }
  });

  const handleRequestService = () => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    if (myItems.length === 0) {
      toast.error("You need to list an item to offer in exchange first.");
      return;
    }
    setServiceModalOpen(true);
  };

  const maxOffers = workerEntity?.max_concurrent_offers || 10;
  const isBusy = activeNegotiations.length >= maxOffers;

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">User not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  const isOwnProfile = currentUser?.id === userProfile.id;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - User Info */}
          <div className="lg:col-span-1">
            <Card className="border-gray-200 shadow-xl sticky top-8">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  {userProfile.photo_url ? (
                    <img
                      src={userProfile.photo_url}
                      alt={userProfile.full_name}
                      className="w-32 h-32 rounded-full object-cover border-4 border-gray-100 mx-auto"
                    />
                  ) : (
                    <div className="w-32 h-32 bg-gradient-to-br from-gray-400 to-gray-500 rounded-full flex items-center justify-center mx-auto border-4 border-gray-100">
                      <span className="text-white font-bold text-4xl">
                        {userProfile.full_name?.[0]?.toUpperCase()}
                      </span>
                    </div>
                  )}
                  {userProfile.id_verified && (
                    <div className="absolute bottom-0 right-0 bg-green-500 rounded-full p-2 border-2 border-white">
                      <CheckCircle2 className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>

                <h1 className="text-2xl font-bold text-gray-900 mb-1">{userProfile.full_name}</h1>
                <div className="flex justify-center items-center gap-1 text-gray-500 mb-4 text-sm">
                  <MapPin className="w-3 h-3" />
                  {(() => {
                    const parts = (userProfile.location || "").split(',').map(p => p.trim());
                    if (parts.length >= 2) return parts.slice(-2).join(', ');
                    return userProfile.location;
                  })()}
                </div>

                <div className="flex justify-center gap-2 mb-6">
                  {userProfile.id_verified && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700">ID Verified</Badge>
                  )}
                  {userProfile.phone_verified && (
                    <Badge variant="secondary" className="bg-green-50 text-green-700">Phone Verified</Badge>
                  )}
                </div>

                {/* Star rating summary */}
                {ratings.length > 0 && (
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <div className="flex">
                      {[1,2,3,4,5].map(star => (
                        <Star key={star} className={`w-5 h-5 ${star <= Math.round(avgRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <span className="font-semibold text-gray-800">{avgRating}</span>
                    <span className="text-sm text-gray-500">({ratings.length} {ratings.length === 1 ? 'review' : 'reviews'})</span>
                  </div>
                )}

                <KarmaDisplay karma={karmaPoints} showDetails={false} />

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{userRecord?.hours_completed ?? workerEntity?.hours_completed ?? 0}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Hours Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{userRecord?.completed_trades ?? workerEntity?.completed_trades ?? 0}</p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Trades</p>
                  </div>
                </div>

                {workerEntity?.availability && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                    <span className="font-semibold block mb-1">Availability:</span>
                    {workerEntity.availability}
                  </div>
                )}

                {!isOwnProfile && (
                  <>
                    <Button 
                      className="w-full mt-6 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                      onClick={handleRequestService}
                      disabled={isBusy}
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      {isBusy ? "Worker Busy (Max Offers)" : "Request Service"}
                    </Button>
                    <div className="flex justify-center mt-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-4 h-4 mr-1" />
                            More Options
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="center">
                          <DropdownMenuItem onClick={() => setReportModalOpen(true)} className="text-red-600 cursor-pointer">
                            <Flag className="w-4 h-4 mr-2" />
                            Report User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setBlockDialogOpen(true)} className="text-orange-600 cursor-pointer">
                            <Ban className="w-4 h-4 mr-2" />
                            Block User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </>
                )}

                {isOwnProfile && (
                  <Link to={createPageUrl("Profile")}>
                    <Button variant="outline" className="w-full mt-6">
                      Edit My Profile
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Details & Items */}
          <div className="lg:col-span-2 space-y-8">
            {/* Bio & Skills */}
            <Card className="border-gray-200">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Bio</h3>
                  <p className="text-gray-600 whitespace-pre-line">
                    {userProfile.bio || "No bio available."}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Skills & Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {(workerEntity?.skills || userProfile.skills) ? (
                      parseSkills(workerEntity?.skills || userProfile.skills)
                        .map((skill, i) => (
                          <Badge key={i} variant="secondary" className="px-3 py-1 bg-gray-100 text-gray-700">
                            {skill}
                          </Badge>
                        ))
                    ) : (
                      <span className="text-gray-500 italic">No skills listed</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Active Listings */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Active Listings</h2>
                <Badge variant="outline">{userItems.length}</Badge>
              </div>
              
              {itemsLoading ? (
                <div className="flex justify-center p-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>
              ) : userItems.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userItems.map(item => (
                    <ItemCard key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <Card className="bg-gray-50 border-dashed border-2 border-gray-200">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <Package className="w-10 h-10 text-gray-300 mb-2" />
                    <p className="text-gray-500 font-medium">No active listings</p>
                    <p className="text-sm text-gray-400">This user hasn't listed any items for trade yet.</p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Reviews */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Reviews {ratings.length > 0 && <span className="text-gray-500 font-normal text-base">({ratings.length})</span>}
                </h2>
                {ratings.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <Select value={reviewFilter} onValueChange={setReviewFilter}>
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Stars</SelectItem>
                        <SelectItem value="5">⭐⭐⭐⭐⭐ 5</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐ 4</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ 3</SelectItem>
                        <SelectItem value="2">⭐⭐ 2</SelectItem>
                        <SelectItem value="1">⭐ 1</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={reviewSort} onValueChange={setReviewSort}>
                      <SelectTrigger className="w-32 h-8 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest</SelectItem>
                        <SelectItem value="oldest">Oldest</SelectItem>
                        <SelectItem value="highest">Highest ★</SelectItem>
                        <SelectItem value="lowest">Lowest ★</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {filteredAndSortedRatings.length > 0 ? (
                <div className="space-y-4">
                  {filteredAndSortedRatings.map(rating => (
                    <Card key={rating.id} className="border-gray-100">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{rating.from_user_name}</span>
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${i < rating.stars ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'}`}
                                />
                              ))}
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {format(new Date(rating.created_date), 'MMM d, yyyy')}
                          </span>
                        </div>
                        {rating.review && <p className="text-gray-600 text-sm">{rating.review}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-gray-50 border-dashed border-2 border-gray-200">
                  <CardContent className="p-8 text-center text-gray-500">
                    {ratings.length > 0 ? "No reviews match this filter" : "No reviews yet"}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} message="Create an account or log in to request services." />

      <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        currentUser={currentUser}
        targetType="user"
        targetId={resolvedUserId || userProfile.id}
        targetName={userProfile.full_name}
        reportedUserId={resolvedUserId || userProfile.id}
        reportedUserName={userProfile.full_name}
      />
      <BlockUserDialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        currentUser={currentUser}
        blockedUserId={resolvedUserId || userProfile.id}
        blockedUserName={userProfile.full_name}
      />

      <Dialog open={serviceModalOpen} onOpenChange={setServiceModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Service from {userProfile.full_name}</DialogTitle>
            <DialogDescription>
              Select one of your items to offer in exchange for their service.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label>Offer Item</Label>
              <Select value={selectedItemId} onValueChange={setSelectedItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item..." />
                </SelectTrigger>
                <SelectContent>
                  {myItems.map(item => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.title} ({item.required_hours}h)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {myItems.length === 0 && (
                <p className="text-xs text-red-500 mt-1">
                  You have no active items. <Link to={createPageUrl("CreateItem")} className="underline">Create one first.</Link>
                </p>
              )}
            </div>

            <div>
              <Label>Message / Details</Label>
              <Textarea 
                placeholder="Describe what you need help with..."
                value={serviceNote}
                onChange={(e) => setServiceNote(e.target.value)}
                className="h-24"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setServiceModalOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => createNegotiationMutation.mutate()}
              disabled={!selectedItemId || !serviceNote || createNegotiationMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {createNegotiationMutation.isPending ? "Sending..." : "Send Request"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}