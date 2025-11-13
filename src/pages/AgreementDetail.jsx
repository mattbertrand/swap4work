import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle2, Clock, AlertCircle, Star } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import ReviewModal from "../components/agreement/ReviewModal";

export default function AgreementDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const agreementId = urlParams.get('id');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: agreement, isLoading } = useQuery({
    queryKey: ['agreement', agreementId],
    queryFn: async () => {
      const results = await base44.entities.Agreement.filter({ id: agreementId });
      return results[0];
    },
    enabled: !!agreementId,
    refetchInterval: 3000
  });

  // Check if user has already rated the other party
  const { data: existingRating } = useQuery({
    queryKey: ['rating', agreementId, user?.id],
    queryFn: async () => {
      if (!user || !agreement) return null;
      const ratings = await base44.entities.Rating.filter({
        agreement_id: agreementId,
        from_user_id: user.id
      });
      return ratings[0];
    },
    enabled: !!agreementId && !!user && !!agreement
  });

  const updateAgreementMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agreement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agreement', agreementId]);
    }
  });

  const handleConfirmHandover = async () => {
    if (!user || !agreement) return;

    const isOfferer = user.id === agreement.offerer_id;
    
    // Update confirmation status
    const updateData = isOfferer 
      ? { offerer_handover_confirmed: true }
      : { worker_handover_confirmed: true };
    
    await updateAgreementMutation.mutateAsync({
      id: agreementId,
      data: updateData
    });

    // Re-fetch to get updated data
    const updated = await base44.entities.Agreement.filter({ id: agreementId });
    const updatedAgreement = updated[0];

    // Check if both confirmed
    if (updatedAgreement.offerer_handover_confirmed && updatedAgreement.worker_handover_confirmed) {
      // Both confirmed! Complete the agreement
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      await base44.entities.Agreement.update(agreementId, {
        status: 'completed',
        completion_date: new Date().toISOString()
      });

      // Update both users' stats
      const offererUser = await base44.entities.User.filter({ id: agreement.offerer_id });
      const workerUser = await base44.entities.User.filter({ id: agreement.worker_id });

      if (offererUser[0]) {
        await base44.entities.User.update(agreement.offerer_id, {
          hours_completed: (offererUser[0].hours_completed || 0) + agreement.agreed_hours,
          completed_trades: (offererUser[0].completed_trades || 0) + 1
        });
      }

      if (workerUser[0]) {
        await base44.entities.User.update(agreement.worker_id, {
          hours_completed: (workerUser[0].hours_completed || 0) + agreement.agreed_hours,
          completed_trades: (workerUser[0].completed_trades || 0) + 1
        });
      }

      // Notify the other party
      const otherUserId = isOfferer ? agreement.worker_id : agreement.offerer_id;
      await base44.entities.Notification.create({
        user_id: otherUserId,
        type: 'agreement_confirmed',
        title: 'Agreement completed!',
        message: `The handover for ${agreement.item_title} has been confirmed by both parties`,
        related_id: agreementId,
        related_type: 'agreement',
        link_url: createPageUrl(`AgreementDetail?id=${agreementId}`),
        from_user_id: user.id,
        from_user_name: user.full_name
      });

      toast.success('Agreement completed! 🎉');
      
      // Show review modal after a short delay
      setTimeout(() => {
        setShowReviewModal(true);
      }, 1500);
    } else {
      toast.success('Handover confirmed! Waiting for other party...');
    }
  };

  const handleSubmitReview = async ({ stars, review }) => {
    if (!user || !agreement) return;

    setIsSubmittingReview(true);
    try {
      const isOfferer = user.id === agreement.offerer_id;
      const otherUserId = isOfferer ? agreement.worker_id : agreement.offerer_id;
      const otherUserName = isOfferer ? agreement.worker_name : agreement.offerer_name;

      // Create rating
      await base44.entities.Rating.create({
        agreement_id: agreementId,
        from_user_id: user.id,
        to_user_id: otherUserId,
        from_user_name: user.full_name,
        to_user_name: otherUserName,
        stars,
        review: review || "",
        published: true
      });

      // Update rated user's average rating
      const allRatings = await base44.entities.Rating.filter({ to_user_id: otherUserId });
      const totalStars = allRatings.reduce((sum, r) => sum + r.stars, 0);
      const avgRating = totalStars / allRatings.length;

      await base44.entities.User.update(otherUserId, {
        rating: avgRating,
        total_ratings: allRatings.length
      });

      // Award karma based on rating
      let karmaPoints = 0;
      if (stars === 5) karmaPoints = 10;
      else if (stars === 4) karmaPoints = 5;
      else if (stars === 3) karmaPoints = 0;
      else if (stars === 2) karmaPoints = -5;
      else if (stars === 1) karmaPoints = -10;

      if (karmaPoints !== 0) {
        const ratedUser = await base44.entities.User.filter({ id: otherUserId });
        if (ratedUser[0]) {
          await base44.entities.User.update(otherUserId, {
            karma_points: (ratedUser[0].karma_points || 0) + karmaPoints
          });

          await base44.entities.KarmaTransaction.create({
            user_id: otherUserId,
            user_name: otherUserName,
            type: karmaPoints > 0 ? 'gain' : 'loss',
            reason: stars >= 4 ? 'positive_review' : 'negative_review',
            points: Math.abs(karmaPoints),
            agreement_id: agreementId,
            description: `Received ${stars}-star review from ${user.full_name}`
          });
        }
      }

      // Notify the rated user
      await base44.entities.Notification.create({
        user_id: otherUserId,
        type: 'rating_received',
        title: 'New rating received!',
        message: `${user.full_name} rated your work ${stars} stars for ${agreement.item_title}`,
        related_id: agreementId,
        related_type: 'agreement',
        link_url: createPageUrl(`Profile`),
        from_user_id: user.id,
        from_user_name: user.full_name
      });

      toast.success('Review submitted! Thank you for your feedback.');
      setShowReviewModal(false);
      queryClient.invalidateQueries(['rating', agreementId, user.id]);
      
      setTimeout(() => {
        navigate(createPageUrl('MyAgreements'));
      }, 1000);
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!agreement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agreement not found</h2>
          <Button onClick={() => navigate(createPageUrl("MyAgreements"))}>
            Back to My Agreements
          </Button>
        </div>
      </div>
    );
  }

  const isOfferer = user.id === agreement.offerer_id;
  const isWorker = user.id === agreement.worker_id;
  const otherParty = isOfferer ? agreement.worker_name : agreement.offerer_name;

  // Check if user already confirmed
  const userConfirmed = isOfferer 
    ? agreement.offerer_handover_confirmed 
    : agreement.worker_handover_confirmed;
  
  const otherConfirmed = isOfferer 
    ? agreement.worker_handover_confirmed 
    : agreement.offerer_handover_confirmed;

  const bothConfirmed = userConfirmed && otherConfirmed;
  const isCompleted = agreement.status === 'completed';

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
          <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-1">{agreement.item_title}</CardTitle>
                <p className="text-gray-600">Agreement with {otherParty}</p>
              </div>
              <Badge className={isCompleted ? "bg-gray-100 text-gray-700" : "bg-green-100 text-green-700"}>
                {isCompleted ? 'Completed' : 'Ready for Handover'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6 space-y-6">
            {isCompleted && !existingRating && (
              <Alert className="bg-blue-50 border-blue-200">
                <Star className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-900 flex items-center justify-between">
                  <span>Would you like to leave a review for {otherParty}?</span>
                  <Button
                    onClick={() => setShowReviewModal(true)}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 ml-4"
                  >
                    Leave Review
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {existingRating && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  You rated {otherParty} {existingRating.stars} stars. Thank you for your feedback!
                </AlertDescription>
              </Alert>
            )}

            {!isCompleted && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  <strong>Work completed!</strong> The worker has completed all required hours. Please confirm the handover to finalize this agreement.
                </AlertDescription>
              </Alert>
            )}

            {/* Agreement Summary */}
            <div className="bg-gray-50 rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-lg text-gray-900">Agreement Summary</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Agreed Hours</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-600" />
                    {agreement.agreed_hours} hours
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Hours Logged</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    {agreement.hours_logged || 0} hours
                  </p>
                </div>
              </div>

              {agreement.task_description && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Work Description</p>
                  <p className="text-gray-900">{agreement.task_description}</p>
                </div>
              )}
            </div>

            {/* Handover Confirmation Section */}
            {!isCompleted && (
              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6 border-2 border-blue-200">
                <h3 className="font-semibold text-lg text-gray-900 mb-4">Handover Confirmation</h3>
                
                {bothConfirmed ? (
                  <Alert className="bg-green-100 border-green-300">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-900">
                      Both parties have confirmed the handover. This agreement is now complete!
                    </AlertDescription>
                  </Alert>
                ) : userConfirmed ? (
                  <Alert className="bg-blue-100 border-blue-300">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <AlertDescription className="text-blue-900">
                      You have confirmed the handover. Waiting for {otherParty} to confirm...
                    </AlertDescription>
                  </Alert>
                ) : otherConfirmed ? (
                  <Alert className="bg-orange-100 border-orange-300">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <AlertDescription className="text-orange-900">
                      {otherParty} has confirmed the handover. Please review and confirm on your end.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <p className="text-gray-700 mb-4">
                    Both parties need to confirm that the work has been completed satisfactorily and the item has been handed over.
                  </p>
                )}

                {!userConfirmed && (
                  <Button
                    onClick={handleConfirmHandover}
                    className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 mt-4"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Confirm Handover
                  </Button>
                )}
              </div>
            )}

            {/* Confirmation Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-lg border-2 ${
                isOfferer && userConfirmed ? 'bg-green-50 border-green-300' :
                !isOfferer && otherConfirmed ? 'bg-green-50 border-green-300' :
                'bg-gray-50 border-gray-200'
              }`}>
                <p className="text-sm text-gray-600 mb-2">Item Owner</p>
                <p className="font-semibold text-gray-900">{agreement.offerer_name}</p>
                <div className="mt-2 flex items-center gap-2">
                  {agreement.offerer_handover_confirmed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Confirmed</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Pending</span>
                    </>
                  )}
                </div>
              </div>

              <div className={`p-4 rounded-lg border-2 ${
                isWorker && userConfirmed ? 'bg-green-50 border-green-300' :
                !isWorker && otherConfirmed ? 'bg-green-50 border-green-300' :
                'bg-gray-50 border-gray-200'
              }`}>
                <p className="text-sm text-gray-600 mb-2">Worker</p>
                <p className="font-semibold text-gray-900">{agreement.worker_name}</p>
                <div className="mt-2 flex items-center gap-2">
                  {agreement.worker_handover_confirmed ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">Confirmed</span>
                    </>
                  ) : (
                    <>
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-500">Pending</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Review Modal */}
      <ReviewModal
        open={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        otherUserName={otherParty}
        onSubmit={handleSubmitReview}
        isSubmitting={isSubmittingReview}
      />
    </div>
  );
}