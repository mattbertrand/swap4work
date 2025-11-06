import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ArrowLeft, Send, Paperclip, Clock, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Chat() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [proposedHours, setProposedHours] = useState("");
  const [showProposal, setShowProposal] = useState(false);

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
    refetchInterval: 3000 // Poll every 3 seconds
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
    if (updated[0].worker_agreed && updated[0].offerer_agreed) {
      await updateAgreementMutation.mutateAsync({ 
        id: agreementId, 
        data: { status: 'locked' } 
      });
      navigate(createPageUrl(`TimeTracking?agreementId=${agreementId}`));
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
                  agreement.status === 'locked' ? 'bg-green-100 text-green-700' :
                  'bg-blue-100 text-blue-700'
                }>
                  {agreement.status}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
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
            <div className="h-96 overflow-y-auto p-6 space-y-4">
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
              {showProposal ? (
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
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}