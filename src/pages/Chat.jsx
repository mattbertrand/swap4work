import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { displayName } from "@/lib/names";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Send, Paperclip, Clock, CheckCircle2, XCircle, AlertTriangle, Flag, Ban, MoreVertical } from "lucide-react";
import ReportModal from "@/components/moderation/ReportModal";
import BlockUserDialog from "@/components/moderation/BlockUserDialog";
import { useBlockedUsers } from "@/hooks/useBlockedUsers";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [blockDialogOpen, setBlockDialogOpen] = useState(false);

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
    mutationFn: async (data) => {
      const res = await base44.functions.invoke('sendMessage', data);
      return res.data.message;
    },
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



  const createDisputeMutation = useMutation({
    mutationFn: (data) => base44.entities.Dispute.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['agreement', agreementId]);
    }
  });

  const { hasRelationship } = useBlockedUsers(user?.id);

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
      actor_name: displayName(user.full_name),
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
      from_user_name: displayName(user.full_name),
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
      from_user_name: displayName(user.full_name),
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

    // The request is recorded in a server-side ledger with the requester's
    // identity taken from the session, so it can't be forged in the other
    // party's name.
    await base44.functions.invoke('requestAgreementCancellation', {
      agreement_id: agreementId,
      reason: cancellationData.reason
    });
    queryClient.invalidateQueries(['agreement', agreementId]);
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

      // Karma adjustments, agreement completion and item release all happen
      // server-side so reputation fields can't be written from the client
      await base44.functions.invoke('approveAgreementCancellation', {
        agreement_id: agreementId
      });
      navigate(createPageUrl("MyAgreements"));
    } else {
      // Rejection is recorded server-side alongside the request ledger
      await base44.functions.invoke('rejectAgreementCancellation', {
        agreement_id: agreementId
      });
      queryClient.invalidateQueries(['agreement', agreementId]);
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
  const otherParty = displayName(isWorker ? agreement.offerer_name : agreement.worker_name);
  const hasAgreed = isWorker ? agreement.worker_agreed : agreement.offerer_agreed;
  const otherAgreed = isWorker ? agreement.offerer_agreed : agreement.worker_agreed;
  const bothAgreed = agreement.worker_agreed && agreement.offerer_agreed;
  const isLocked = agreement.is_locked || agreement.status === 'locked' || agreement.status === 'in_progress';
  const otherUserId = isWorker ? agreement.offerer_id : agreement.worker_id;
  const otherUserName = isWorker ? agreement.offerer_name : agreement.worker_name;
  const isBlocked = otherUserId ? hasRelationship(otherUserId) : false;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="hover:bg-orange-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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
            {/* Blocked User Banner */}
            {isBlocked && (
              <div className="bg-gray-100 border-b border-gray-300 p-4 text-center">
                <Ban className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-700 font-medium">This user has been blocked.</p>
                <p className="text-gray-500 text-sm">Messaging is disabled. Unblock from your Profile settings to resume.</p>
              </div>
            )}

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
              {isBlocked ? (
                <div className="text-center py-4">
                  <Ban className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">This user has been blocked. Messaging is disabled.</p>
                </div>
              ) : agreement.status === 'disputed' ? (
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

      <ReportModal
        open={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        currentUser={user}
        targetType="message"
        targetId={agreementId}
        targetName={`Chat: ${agreement.item_title}`}
        reportedUserId={otherUserId}
        reportedUserName={otherUserName}
      />
      <BlockUserDialog
        open={blockDialogOpen}
        onClose={() => setBlockDialogOpen(false)}
        currentUser={user}
        blockedUserId={otherUserId}
        blockedUserName={otherUserName}
      />

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