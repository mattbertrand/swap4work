import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Send, Paperclip, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import AgreementLockBanner from "../components/agreement/AgreementLockBanner";
import CancellationModal from "../components/agreement/CancellationModal";

export default function Chat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [proposedHours, setProposedHours] = useState("");
  const [showProposal, setShowProposal] = useState(false);
  const [showCancellationModal, setShowCancellationModal] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const agreementId = urlParams.get('agreementId');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: agreement } = useQuery({
    queryKey: ['agreement', agreementId],
    queryFn: async () => {
      const results = await base44.entities.Agreement.filter({ id: agreementId });
      return results[0];
    },
    enabled: !!agreementId
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['messages', agreementId],
    queryFn: () => base44.entities.Message.filter({ agreement_id: agreementId }, 'created_date'),
    enabled: !!agreementId,
    refetchInterval: 3000
  });

  const sendMessageMutation = useMutation({
    mutationFn: (data) => base44.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['messages', agreementId]);
      setMessage("");
    }
  });

  const updateAgreementMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Agreement.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agreement', agreementId]);
    }
  });

  const createKarmaTransactionMutation = useMutation({
    mutationFn: (data) => base44.entities.KarmaTransaction.create(data)
  });

  const createDisputeMutation = useMutation({
    mutationFn: (data) => base44.entities.Dispute.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agreement', agreementId]);
    }
  });

  const messagesContainerRef = useRef(null);

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;
    // Only auto-scroll if user is already near the bottom
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;
    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const addToHistory = (action, message) => {
    const historyEntry = {
      timestamp: new Date().toISOString(),
      actor_id: user.id,
      actor_name: user.full_name,
      action,
      message
    };
    return [...(agreement.history || []), historyEntry];
  };

  const handleSendMessage = () => {
    if (!message.trim() || !user || !agreement) return;

    const otherUserId = user.id === agreement.worker_id ? agreement.offerer_id : agreement.worker_id;

    sendMessageMutation.mutate({
      agreement_id: agreementId,
      from_user_id: user.id,
      from_user_name: user.full_name,
      to_user_id: otherUserId,
      text: message,
      message_type: "text"
    });
  };

  const handleProposal = () => {
    if (!proposedHours || !user || !agreement) return;

    const otherUserId = user.id === agreement.worker_id ? agreement.offerer_id : agreement.worker_id;

    sendMessageMutation.mutate({
      agreement_id: agreementId,
      from_user_id: user.id,
      from_user_name: user.full_name,
      to_user_id: otherUserId,
      text: `I propose ${proposedHours} hours for this work.`,
      message_type: "proposal",
      proposal_hours: parseFloat(proposedHours)
    });

    setProposedHours("");
    setShowProposal(false);
  };

  const handleAcceptAgreement = async () => {
    if (!user || !agreement) return;

    const isWorker = user.id === agreement.worker_id;
    const updateData = isWorker 
      ? { worker_agreed: true }
      : { offerer_agreed: true };

    await updateAgreementMutation.mutateAsync({ id: agreementId, data: updateData });

    const updated = await base44.entities.Agreement.filter({ id: agreementId });
    const updatedAgreement = updated[0];
    
    if (updatedAgreement.worker_agreed && updatedAgreement.offerer_agreed) {
      // Lock the agreement and reserve the item
      const lockData = {
        status: 'locked',
        is_locked: true,
        start_date: new Date().toISOString(),
        history: addToHistory('agreement_locked', 'Agreement locked - work can now begin')
      };
      
      await updateAgreementMutation.mutateAsync({ id: agreementId, data: lockData });
      
      // Reserve the item
      await base44.entities.Item.update(updatedAgreement.item_id, {
        is_reserved: true,
        reserved_for_agreement_id: agreementId,
        status: 'locked'
      });
      
      navigate(createPageUrl(`TimeTracking?agreementId=${agreementId}`));
    }
  };

  const handleRequestCancellation = async (cancellationData) => {
    if (!user || !agreement) return;

    const updateData = {
      cancellation_request: {
        status: "pending_mutual",
        requested_by: user.id,
        requested_by_name: user.full_name,
        reason: cancellationData.reason,
        requested_date: cancellationData.requested_date,
        expires_at: cancellationData.expires_at
      },
      history: addToHistory('cancellation_requested', `${user.full_name} requested cancellation: ${cancellationData.reason}`)
    };

    await updateAgreementMutation.mutateAsync({ id: agreementId, data: updateData });
  };

  const handleOpenDispute = async (disputeData) => {
    if (!user || !agreement) return;

    await createDisputeMutation.mutateAsync({
      agreement_id: agreementId,
      opened_by: user.id,
      opened_by_name: user.full_name,
      reason: disputeData.reason,
      description: disputeData.description,
      status: "open"
    });

    await updateAgreementMutation.mutateAsync({
      id: agreementId,
      data: {
        status: 'disputed',
        history: addToHistory('dispute_opened', `Dispute opened: ${disputeData.reason}`)
      }
    });
  };

  const handleRespondToCancellation = async (approved) => {
    if (!user || !agreement) return;

    if (approved) {
      // Calculate partial credit if work has started
      const hoursLogged = agreement.hours_logged || 0;
      const agreedHours = agreement.agreed_hours || 1;
      const completionPercentage = Math.min((hoursLogged / agreedHours) * 100, 100);

      if (hoursLogged > 0) {
        // Award partial karma to worker
        const partialKarma = Math.floor((completionPercentage / 100) * 10);
        await createKarmaTransactionMutation.mutateAsync({
          user_id: agreement.worker_id,
          user_name: agreement.worker_name,
          type: "gain",
          reason: "partial_milestone_credit",
          points: partialKarma,
          agreement_id: agreementId,
          description: `Partial credit for ${completionPercentage.toFixed(1)}% completion (${hoursLogged}/${agreedHours} hours)`
        });

        // Update worker karma
        const workers = await base44.entities.User.filter({ id: agreement.worker_id });
        if (workers[0]) {
          await base44.entities.User.update(agreement.worker_id, {
            karma_points: (workers[0].karma_points || 0) + partialKarma
          });
        }

        // Penalize offerer if they initiated cancellation
        if (agreement.cancellation_request.requested_by === agreement.offerer_id) {
          await createKarmaTransactionMutation.mutateAsync({
            user_id: agreement.offerer_id,
            user_name: agreement.offerer_name,
            type: "loss",
            reason: "mid_agreement_cancellation",
            points: -20,
            agreement_id: agreementId,
            description: "Mid-agreement cancellation after work started"
          });

          const offerers = await base44.entities.User.filter({ id: agreement.offerer_id });
          if (offerers[0]) {
            const newKarma = (offerers[0].karma_points || 0) - 20;
            const updateData = {
              karma_points: newKarma,
              cancellation_count: (offerers[0].cancellation_count || 0) + 1
            };
            
            // Suspend if karma is negative
            if (newKarma < 0) {
              updateData.is_suspended = true;
              updateData.suspension_end_date = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            }
            
            await base44.entities.User.update(agreement.offerer_id, updateData);
          }
        }
      }

      // Mark agreement as cancelled
      await updateAgreementMutation.mutateAsync({
        id: agreementId,
        data: {
          status: 'cancelled_mutual',
          cancellation_request: {
            ...agreement.cancellation_request,
            status: 'approved'
          },
          history: addToHistory('cancellation_approved', 'Mutual cancellation approved')
        }
      });

      // Unreserve item
      await base44.entities.Item.update(agreement.item_id, {
        is_reserved: false,
        reserved_for_agreement_id: null,
        status: 'active'
      });

      navigate(createPageUrl("MyAgreements"));
    } else {
      // Rejection - could trigger dispute
      await updateAgreementMutation.mutateAsync({
        id: agreementId,
        data: {
          cancellation_request: {
            ...agreement.cancellation_request,
            status: 'rejected'
          },
          history: addToHistory('cancellation_rejected', 'Cancellation request rejected')
        }
      });
    }
  };

  if (!user || !agreement) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const isWorker = user.id === agreement.worker_id;
  const otherParty = isWorker ? agreement.offerer_name : agreement.worker_name;
  const hasAgreed = isWorker ? agreement.worker_agreed : agreement.offerer_agreed;
  const otherAgreed = isWorker ? agreement.offerer_agreed : agreement.worker_agreed;
  const bothAgreed = agreement.worker_agreed && agreement.offerer_agreed;
  const isLocked = agreement.is_locked || agreement.status === 'locked' || agreement.status === 'in_progress';

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
                <h2 className="text-2xl font-bold text-gray-900 mb-1">{agreement.item_title}</h2>
                <p className="text-gray-600">Negotiating with {otherParty}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 justify-end mb-2">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <span className="text-2xl font-bold text-gray-900">{agreement.agreed_hours}h</span>
                </div>
                <Badge className={
                  agreement.status === 'proposed' ? 'bg-yellow-100 text-yellow-700' :
                  agreement.status === 'locked' || agreement.status === 'in_progress' ? 'bg-green-100 text-green-700' :
                  agreement.status === 'disputed' ? 'bg-red-100 text-red-700' :
                  'bg-blue-100 text-blue-700'
                }>
                  {agreement.status}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {/* Agreement Lock Banner */}
            {isLocked && (
              <div className="p-4 border-b border-gray-200">
                <AgreementLockBanner
                  agreement={agreement}
                  user={user}
                  onRequestCancellation={() => setShowCancellationModal(true)}
                  onRespondToCancellation={handleRespondToCancellation}
                />
              </div>
            )}

            {/* Agreement Status Banner */}
            {agreement.status === 'proposed' && (
              <div className="bg-blue-50 border-b border-blue-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-blue-900">
                      {bothAgreed ? "Both parties have agreed!" : "Waiting for agreement"}
                    </p>
                    <p className="text-sm text-blue-700">
                      {hasAgreed 
                        ? otherAgreed ? "You can now proceed to work" : `Waiting for ${otherParty} to agree`
                        : "Review the terms and accept to proceed"
                      }
                    </p>
                  </div>
                  {!hasAgreed && (
                    <Button 
                      onClick={handleAcceptAgreement}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Accept Agreement
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Messages */}
            <div ref={messagesContainerRef} className="h-96 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => {
                const isOwnMessage = msg.from_user_id === user.id;
                
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        isOwnMessage
                          ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {msg.message_type === 'proposal' && (
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="w-4 h-4" />
                          <span className="font-semibold text-sm">Proposal</span>
                        </div>
                      )}
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <p className={`text-xs mt-1 ${isOwnMessage ? 'text-orange-100' : 'text-gray-500'}`}>
                        {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="border-t border-orange-100 p-4">
              {agreement.status === 'disputed' ? (
                <div className="text-center py-4">
                  <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-gray-600">This agreement is under dispute. Messaging is disabled.</p>
                </div>
              ) : agreement.status === 'cancelled' || agreement.status === 'cancelled_mutual' ? (
                <div className="text-center py-4">
                  <XCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">This agreement has been cancelled.</p>
                </div>
              ) : showProposal ? (
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Proposed hours"
                    value={proposedHours}
                    onChange={(e) => setProposedHours(e.target.value)}
                    className="flex-1"
                  />
                  <Button onClick={handleProposal} className="bg-blue-600 hover:bg-blue-700">
                    Send Proposal
                  </Button>
                  <Button onClick={() => setShowProposal(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type a message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => setShowProposal(true)} 
                      variant="outline"
                      className="px-3"
                    >
                      <Clock className="w-5 h-5" />
                    </Button>
                    <Button 
                      onClick={handleSendMessage}
                      disabled={!message.trim()}
                      className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                  
                  {isLocked && (
                    <Button
                      onClick={() => setShowCancellationModal(true)}
                      variant="outline"
                      size="sm"
                      className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Request Cancellation
                    </Button>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <CancellationModal
        open={showCancellationModal}
        onClose={() => setShowCancellationModal(false)}
        agreement={agreement}
        onRequestCancellation={handleRequestCancellation}
        onOpenDispute={handleOpenDispute}
        isOfferer={!isWorker}
        isWorker={isWorker}
      />
    </div>
  );
}