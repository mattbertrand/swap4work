import React, { useState, useEffect, useRef, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ArrowLeft, Send, Clock, AlertTriangle, CheckCircle2, Package, MoreVertical, Ban, Flag, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import OfferCard from "../components/negotiation/OfferCard";
import CounterOfferModal from "../components/negotiation/CounterOfferModal";
import AgreementDraft from "../components/negotiation/AgreementDraft";

export default function Negotiation() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [user, setUser] = useState(null);
  const [message, setMessage] = useState("");
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [otherConfirmed, setOtherConfirmed] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const negotiationId = urlParams.get('id');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: negotiation, isLoading: negLoading, error: negError } = useQuery({
    queryKey: ['negotiation', negotiationId],
    queryFn: async () => {
      if (!negotiationId) return null;
      console.log('📥 Fetching negotiation:', negotiationId);
      const results = await base44.entities.Negotiation.filter({ id: negotiationId });
      console.log('✅ Negotiation loaded:', results[0]);
      return results[0] || null;
    },
    enabled: !!negotiationId,
    refetchInterval: 3000,
    retry: 1
  });

  // Check if negotiation was closed - display message and disable actions
  useEffect(() => {
    if (negotiation?.status === 'closed') {
      toast.info('This negotiation was closed because another offer was accepted.');
    }
  }, [negotiation?.status]);

  const { data: item } = useQuery({
    queryKey: ['item', negotiation?.item_id],
    queryFn: async () => {
      const items = await base44.entities.Item.filter({ id: negotiation.item_id });
      return items[0];
    },
    enabled: !!negotiation?.item_id
  });

  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', negotiationId],
    queryFn: async () => {
      if (!negotiationId) return [];
      console.log('📥 Fetching messages for negotiation:', negotiationId);
      const msgs = await base44.entities.Message.filter({ 
        negotiation_id: negotiationId 
      }, 'created_date');
      console.log(`✅ Loaded ${msgs.length} messages:`, msgs);
      return msgs;
    },
    enabled: !!negotiationId,
    refetchInterval: 3000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data) => {
      console.log('📤 Sending message:', data);
      const result = await base44.entities.Message.create(data);
      console.log('✅ Message created:', result);
      return result;
    },
    onSuccess: () => {
      console.log('✅ Message sent successfully');
      toast.success('Message sent!');
      queryClient.invalidateQueries(['messages', negotiationId]);
      refetchMessages();
      setMessage("");
    },
    onError: (error) => {
      console.error('❌ Error sending message:', error);
      toast.error('Failed to send message');
    }
  });

  const updateNegotiationMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Negotiation.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['negotiation', negotiationId]);
    }
  });

  const createAgreementMutation = useMutation({
    mutationFn: (data) => base44.entities.Agreement.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['negotiation', negotiationId]);
    }
  });

  const createNotificationMutation = useMutation({
    mutationFn: async (data) => {
      console.log('🔔 Creating notification:', data);
      const result = await base44.entities.Notification.create(data);
      console.log('✅ Notification created:', result);
      return result;
    },
    onError: (error) => {
      console.error('❌ Error creating notification:', error);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (negotiation && negotiation.status === 'active' && negotiation.expires_at) {
      const expiresAt = new Date(negotiation.expires_at);
      if (expiresAt < new Date()) {
        updateNegotiationMutation.mutate({
          id: negotiationId,
          data: { status: 'expired' }
        });
      }
    }
  }, [negotiation?.status, negotiation?.expires_at, negotiationId]);

  useEffect(() => {
    const checkConfirmations = async () => {
      if (negotiation?.status === 'accepted' && negotiation?.item_id && user?.id) {
        const agreements = await base44.entities.Agreement.filter({ 
          item_id: negotiation.item_id,
          status: 'proposed'
        });
        
        if (agreements[0]) {
          const isOfferer = user.id === negotiation.offerer_id;
          setHasConfirmed(isOfferer ? agreements[0].offerer_agreed : agreements[0].worker_agreed);
          setOtherConfirmed(isOfferer ? agreements[0].worker_agreed : agreements[0].offerer_agreed);
        }
      }
    };
    
    checkConfirmations();
  }, [negotiation?.status, negotiation?.item_id, negotiation?.offerer_id, user?.id]);

  const updateLastActivity = async () => {
    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
    
    await updateNegotiationMutation.mutateAsync({
      id: negotiationId,
      data: {
        last_activity: now,
        expires_at: expiresAt
      }
    });
  };

  const handleSendMessage = async () => {
    if (!message.trim() || !user || !negotiation) {
      console.log('❌ Cannot send message - missing data');
      return;
    }

    const otherUserId = user.id === negotiation.bidder_id ? negotiation.offerer_id : negotiation.bidder_id;

    console.log('📤 [SEND] Preparing to send message:', message);
    
    try {
      await sendMessageMutation.mutateAsync({
        negotiation_id: negotiationId,
        from_user_id: user.id,
        from_user_name: user.full_name,
        to_user_id: otherUserId,
        text: message,
        message_type: "text"
      });

      await createNotificationMutation.mutateAsync({
        user_id: otherUserId,
        type: 'new_message',
        title: 'New message',
        message: `${user.full_name} sent you a message about ${negotiation.item_title}`,
        related_id: negotiationId,
        related_type: 'negotiation',
        link_url: createPageUrl(`Negotiation?id=${negotiationId}`),
        from_user_id: user.id,
        from_user_name: user.full_name
      });

      await updateLastActivity();
      console.log('✅ [SEND] Message sent and notification created');
    } catch (error) {
      console.error('❌ [SEND] Error in handleSendMessage:', error);
    }
  };

  const handleCounterOffer = async (offerData) => {
    if (!user || !negotiation) return;

    const otherUserId = user.id === negotiation.bidder_id ? negotiation.offerer_id : negotiation.bidder_id;

    console.log('📤 Sending counter offer:', offerData);

    const newHistory = [
      ...(negotiation.offer_history || []),
      {
        offered_by: user.id,
        offered_by_name: user.full_name,
        hours: offerData.hours,
        work_type: offerData.work_type || "",
        timestamp: new Date().toISOString()
      }
    ];

    await updateNegotiationMutation.mutateAsync({
      id: negotiationId,
      data: {
        counter_offer_hours: offerData.hours,
        work_type: offerData.work_type || negotiation.work_type,
        current_offer_by: user.id,
        offer_history: newHistory,
        last_activity: new Date().toISOString(),
        expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
      }
    });

    await sendMessageMutation.mutateAsync({
      negotiation_id: negotiationId,
      from_user_id: user.id,
      from_user_name: user.full_name,
      to_user_id: otherUserId,
      text: `${user.full_name} offered ${offerData.hours} hours${offerData.work_type ? ` for ${offerData.work_type}` : ''}${offerData.message ? `\n\n${offerData.message}` : ''}`,
      message_type: "offer",
      proposal_hours: offerData.hours
    });

    await createNotificationMutation.mutateAsync({
      user_id: otherUserId,
      type: 'counter_offer',
      title: 'New counter offer',
      message: `${user.full_name} offered ${offerData.hours} hours for ${negotiation.item_title}`,
      related_id: negotiationId,
      related_type: 'negotiation',
      link_url: createPageUrl(`Negotiation?id=${negotiationId}`),
      from_user_id: user.id,
      from_user_name: user.full_name
    });

    toast.success('Counter offer sent!');
  };

  const handleAcceptOffer = async () => {
    if (!user || !negotiation) return;

    const agreedHours = negotiation.counter_offer_hours || negotiation.initial_offer_hours;

    console.log('✅ Accepting offer:', agreedHours, 'hours');

    // Accept this negotiation
    await updateNegotiationMutation.mutateAsync({
      id: negotiationId,
      data: {
        status: 'accepted',
        agreed_hours: agreedHours
      }
    });

    // Close all other active negotiations for this item
    console.log('🔒 Closing other negotiations for item:', negotiation.item_id);
    const allNegotiations = await base44.entities.Negotiation.filter({
      item_id: negotiation.item_id,
      status: { $in: ['active', 'accepted'] }
    });

    const otherNegotiations = allNegotiations.filter(n => n.id !== negotiationId);
    
    // Close other negotiations and notify users
    await Promise.all(otherNegotiations.map(async (neg) => {
      await base44.entities.Negotiation.update(neg.id, { status: 'closed' });
      
      // Notify the other user - FIXED LINK
      const otherUserId = neg.bidder_id === user.id ? neg.offerer_id : neg.bidder_id;
      await base44.entities.Notification.create({
        user_id: otherUserId,
        type: 'negotiation_closed',
        title: 'Negotiation closed',
        message: `The seller has accepted another offer for ${negotiation.item_title}`,
        related_id: neg.id,
        related_type: 'negotiation',
        link_url: createPageUrl(`Browse`), // FIXED: Navigate to Browse instead of ItemDetail
        from_user_id: user.id,
        from_user_name: user.full_name
      });
    }));

    console.log(`✅ Closed ${otherNegotiations.length} other negotiations`);

    // Notify waitlist users that a negotiation closed (spot may open)
    console.log('📢 Notifying waitlist users about closed negotiations...');
    const waitlistUsers = await base44.entities.ItemWaitlist.filter({
      item_id: negotiation.item_id,
      notified: false
    });

    await Promise.all(waitlistUsers.map(async (waitlistEntry) => {
      await base44.entities.Notification.create({
        user_id: waitlistEntry.user_id,
        type: 'item_available',
        title: 'Negotiation spot may be available',
        message: `A negotiation for ${negotiation.item_title} was closed. You may be able to start negotiating now!`,
        related_id: negotiation.item_id,
        related_type: 'item',
        link_url: createPageUrl(`ItemDetail?id=${negotiation.item_id}`),
        from_user_id: user.id,
        from_user_name: 'WorkSwap'
      });
      await base44.entities.ItemWaitlist.update(waitlistEntry.id, {
        notified: true,
        notified_date: new Date().toISOString()
      });
    }));

    // Send system message to current negotiation
    const otherUserId = user.id === negotiation.bidder_id ? negotiation.offerer_id : negotiation.bidder_id;
    await sendMessageMutation.mutateAsync({
      negotiation_id: negotiationId,
      from_user_id: user.id,
      from_user_name: user.full_name,
      to_user_id: otherUserId,
      text: `✅ ${user.full_name} accepted the offer of ${agreedHours} hours!`,
      message_type: "system"
    });

    await createNotificationMutation.mutateAsync({
      user_id: otherUserId,
      type: 'offer_accepted',
      title: 'Offer accepted!',
      message: `${user.full_name} accepted your offer of ${agreedHours} hours for ${negotiation.item_title}`,
      related_id: negotiationId,
      related_type: 'negotiation',
      link_url: createPageUrl(`Negotiation?id=${negotiationId}`),
      from_user_id: user.id,
      from_user_name: user.full_name
    });

    toast.success('Offer accepted! Setting up agreement...');
  };

  const handleDeclineOffer = async () => {
    if (!user || !negotiation) return;

    console.log('❌ Declining offer');

    await updateNegotiationMutation.mutateAsync({
      id: negotiationId,
      data: { status: 'declined' }
    });

    // Notify waitlist users when a negotiation is declined
    console.log('📢 Notifying waitlist users about declined negotiation...');
    const waitlistUsers = await base44.entities.ItemWaitlist.filter({
      item_id: negotiation.item_id,
      notified: false
    });

    await Promise.all(waitlistUsers.map(async (waitlistEntry) => {
      await base44.entities.Notification.create({
        user_id: waitlistEntry.user_id,
        type: 'item_available',
        title: 'Negotiation spot available',
        message: `A negotiation for ${negotiation.item_title} was declined. You can now start negotiating!`,
        related_id: negotiation.item_id,
        related_type: 'item',
        link_url: createPageUrl(`ItemDetail?id=${negotiation.item_id}`),
        from_user_id: user.id,
        from_user_name: 'WorkSwap'
      });
    }));

    const otherUserId = user.id === negotiation.bidder_id ? negotiation.offerer_id : negotiation.bidder_id;
    await createNotificationMutation.mutateAsync({
      user_id: otherUserId,
      type: 'offer_declined',
      title: 'Offer declined',
      message: `${user.full_name} declined the negotiation for ${negotiation.item_title}`,
      related_id: negotiationId,
      related_type: 'negotiation',
      link_url: createPageUrl("Browse"),
      from_user_id: user.id,
      from_user_name: user.full_name
    });

    toast.info('Offer declined');
    navigate(createPageUrl("Browse"));
  };

  const handleConfirmAgreement = async () => {
    if (!user || !negotiation) return;

    console.log('🚀 [CONFIRM] Starting agreement confirmation');
    const isOfferer = user.id === negotiation.offerer_id;

    const existingAgreements = await base44.entities.Agreement.filter({ 
      item_id: negotiation.item_id,
      status: { $in: ['proposed', 'locked', 'in_progress'] }
    });

    console.log('🔍 [CONFIRM] Existing agreements:', existingAgreements);

    // Check if agreement was cancelled by other party
    const cancelledAgreements = await base44.entities.Agreement.filter({
      item_id: negotiation.item_id,
      status: 'cancelled'
    });
    if (cancelledAgreements.length > 0 && existingAgreements.length === 0) {
      toast.error('This agreement was cancelled by the other party.');
      queryClient.invalidateQueries(['negotiation', negotiationId]);
      return;
    }

    let agreement = existingAgreements[0];

    if (!agreement) {
      console.log('🆕 [CONFIRM] Creating new agreement...');
      agreement = await createAgreementMutation.mutateAsync({
        item_id: negotiation.item_id,
        item_title: negotiation.item_title,
        offerer_id: negotiation.offerer_id,
        offerer_name: negotiation.offerer_name,
        worker_id: negotiation.bidder_id,
        worker_name: negotiation.bidder_name,
        agreed_hours: negotiation.agreed_hours,
        task_description: negotiation.work_type || "",
        status: 'proposed',
        offerer_agreed: isOfferer,
        worker_agreed: !isOfferer
      });
      console.log('✅ [CONFIRM] Agreement created:', agreement);
      console.log('🆔 [CONFIRM] Agreement ID:', agreement?.id);
    } else {
      console.log('🔄 [CONFIRM] Updating existing agreement:', agreement.id);
      const updateData = isOfferer 
        ? { offerer_agreed: true }
        : { worker_agreed: true };
      await base44.entities.Agreement.update(agreement.id, updateData);
      
      const updated = await base44.entities.Agreement.filter({ id: agreement.id });
      agreement = updated[0];
      console.log('✅ [CONFIRM] Agreement updated:', agreement);
    }

    console.log('👥 [CONFIRM] Checking confirmations - offerer:', agreement.offerer_agreed, 'worker:', agreement.worker_agreed);

    if (agreement.offerer_agreed && agreement.worker_agreed) {
      console.log('🎉 [CONFIRM] Both parties confirmed! Locking agreement...');
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });

      await base44.entities.Agreement.update(agreement.id, {
        status: 'locked',
        is_locked: true,
        start_date: new Date().toISOString()
      });

      await base44.entities.Item.update(negotiation.item_id, {
        is_reserved: true,
        reserved_for_agreement_id: agreement.id,
        status: 'locked'
      });

      await updateNegotiationMutation.mutateAsync({
        id: negotiationId,
        data: { status: 'converted' }
      });

      // Notify users on waitlist
      console.log('📢 Notifying waitlist users...');
      const waitlistUsers = await base44.entities.ItemWaitlist.filter({
        item_id: negotiation.item_id,
        notified: false
      });

      await Promise.all(waitlistUsers.map(async (waitlistEntry) => {
        await createNotificationMutation.mutateAsync({
          user_id: waitlistEntry.user_id,
          type: 'item_available',
          title: 'Item now in progress',
          message: `The item "${negotiation.item_title}" is now in progress. You will be notified if it becomes available again.`,
          related_id: negotiation.item_id,
          related_type: 'item',
          link_url: createPageUrl(`ItemDetail?id=${negotiation.item_id}`),
          from_user_id: user.id,
          from_user_name: 'WorkSwap'
        });

        await base44.entities.ItemWaitlist.update(waitlistEntry.id, {
          notified: true,
          notified_date: new Date().toISOString()
        });
      }));

      console.log("🔗 [CONFIRM] Attempting to redirect with agreement ID:", agreement.id);
      
      const verifyAgreement = await base44.entities.Agreement.filter({ id: agreement.id });
      console.log("✅ [CONFIRM] Agreement verification:", verifyAgreement[0]);
      
      setTimeout(() => {
        const url = createPageUrl(`TimeTracking?agreementId=${agreement.id}`);
        console.log("🚀 [CONFIRM] Redirecting to:", url);
        navigate(url);
      }, 2000);
    } else {
      console.log('⏳ [CONFIRM] Waiting for other party to confirm');
      setHasConfirmed(true);
      toast.success('Agreement confirmed! Waiting for other party...');
    }
  };

  const handleCancelAgreement = async () => {
    if (!user || !negotiation) return;

    // Find the existing agreement
    const existingAgreements = await base44.entities.Agreement.filter({
      item_id: negotiation.item_id,
      status: { $in: ['proposed', 'locked', 'in_progress'] }
    });

    const agreement = existingAgreements[0];
    if (agreement) {
      await base44.entities.Agreement.update(agreement.id, {
        status: 'cancelled'
      });
    }

    // Also cancel the negotiation
    await updateNegotiationMutation.mutateAsync({
      id: negotiationId,
      data: { status: 'declined' }
    });

    // Notify the other party
    const otherUserId = user.id === negotiation.bidder_id ? negotiation.offerer_id : negotiation.bidder_id;
    await createNotificationMutation.mutateAsync({
      user_id: otherUserId,
      type: 'offer_declined',
      title: 'Agreement cancelled',
      message: `${user.full_name} cancelled the agreement for ${negotiation.item_title}`,
      related_id: negotiationId,
      related_type: 'negotiation',
      link_url: createPageUrl('Browse'),
      from_user_id: user.id,
      from_user_name: user.full_name
    });

    // Send system message
    await sendMessageMutation.mutateAsync({
      negotiation_id: negotiationId,
      from_user_id: user.id,
      from_user_name: user.full_name,
      to_user_id: otherUserId,
      text: `❌ ${user.full_name} cancelled the agreement.`,
      message_type: "system"
    });

    toast.info('Agreement cancelled');
    navigate(createPageUrl("Browse"));
  };

  const handleEditAgreementTerms = async (editData) => {
    if (!negotiation) return;

    await updateNegotiationMutation.mutateAsync({
      id: negotiationId,
      data: {
        location: editData.location,
        due_date: editData.due_date,
        notes: editData.notes
      }
    });
  };

  const isOfferer = useMemo(() => user?.id === negotiation?.offerer_id, [user?.id, negotiation?.offerer_id]);
  const isBidder = useMemo(() => user?.id === negotiation?.bidder_id, [user?.id, negotiation?.bidder_id]);
  const otherParty = useMemo(() => isOfferer ? negotiation?.bidder_name : negotiation?.offerer_name, [isOfferer, negotiation?.bidder_name, negotiation?.offerer_name]);
  const currentOfferHours = useMemo(() => negotiation?.counter_offer_hours || negotiation?.initial_offer_hours, [negotiation?.counter_offer_hours, negotiation?.initial_offer_hours]);
  const isNegotiationClosed = negotiation?.status === 'closed';

  if (negError || (!negLoading && !negotiation && negotiationId)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-orange-100">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Negotiation Not Found</h2>
            <p className="text-gray-600 mb-6">
              This negotiation doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => navigate(createPageUrl("Browse"))} className="w-full">
              Browse Items
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (negLoading || !user || !negotiation || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!isOfferer && !isBidder) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-orange-100">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to view this negotiation.
            </p>
            <Button onClick={() => navigate(createPageUrl("Browse"))} className="w-full">
              Browse Items
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  console.log('🔍 Current messages count:', messages.length);
  console.log('🔍 Current negotiation status:', negotiation.status);
  console.log('🔍 Offer history:', negotiation.offer_history);

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

        <Card className="border-orange-100 shadow-xl mb-6">
          <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Package className="w-6 h-6 text-orange-600" />
                  <h2 className="text-2xl font-bold text-gray-900">{item.title}</h2>
                </div>
                <p className="text-gray-600">Negotiating with {otherParty}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className={
                  negotiation.status === 'active' ? 'bg-blue-100 text-blue-700' :
                  negotiation.status === 'accepted' ? 'bg-green-100 text-green-700' :
                  negotiation.status === 'declined' ? 'bg-red-100 text-red-700' :
                  negotiation.status === 'expired' ? 'bg-gray-100 text-gray-700' :
                  negotiation.status === 'closed' ? 'bg-zinc-100 text-zinc-700' :
                  'bg-purple-100 text-purple-700'
                }>
                  {negotiation.status}
                </Badge>
                {/* Block & Report Button */}
                {!isNegotiationClosed && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          if (confirm(`Are you sure you want to block ${otherParty}? This will end the negotiation.`)) {
                            // TODO: Implement block functionality
                            toast.info('Block feature coming soon');
                          }
                        }}
                        className="text-orange-600"
                      >
                        <Ban className="w-4 h-4 mr-2" />
                        Block User
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          if (confirm(`Report ${otherParty} as spam?`)) {
                            // TODO: Implement report functionality
                            toast.info('Report feature coming soon');
                          }
                        }}
                        className="text-red-600"
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Report as Spam
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Closed Negotiation Alert */}
            {isNegotiationClosed && (
              <Alert className="mb-4 bg-red-50 border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  <strong>This negotiation was closed.</strong> The seller accepted another offer for this item.
                </AlertDescription>
              </Alert>
            )}

            {negotiation.status === 'active' && (
              <Alert className="mb-4 bg-orange-50 border-orange-200">
                <Clock className="w-4 h-4 text-orange-600" />
                <AlertDescription className="text-orange-900">
                  <strong>Current Offer:</strong> {currentOfferHours} hours
                  {negotiation.work_type && ` • ${negotiation.work_type}`}
                </AlertDescription>
              </Alert>
            )}

            {negotiation.status === 'expired' && (
              <Alert className="mb-4 bg-gray-50 border-gray-200">
                <AlertTriangle className="w-4 h-4 text-gray-600" />
                <AlertDescription className="text-gray-900">
                  This negotiation has expired due to inactivity (48 hours).
                </AlertDescription>
              </Alert>
            )}

            {negotiation.status === 'accepted' && (
              <div className="mb-4">
                <AgreementDraft
                  negotiation={negotiation}
                  item={item}
                  isOfferer={isOfferer}
                  hasConfirmed={hasConfirmed}
                  otherPartyConfirmed={otherConfirmed}
                  onConfirm={handleConfirmAgreement}
                  onEdit={handleEditAgreementTerms}
                  onCancel={handleCancelAgreement}
                />
              </div>
            )}

            {negotiation.status === 'declined' && (
              <Alert className="mb-4 bg-red-50 border-red-200">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  <strong>Agreement cancelled.</strong> This negotiation has been cancelled.
                </AlertDescription>
              </Alert>
            )}

            <div className="h-96 overflow-y-auto space-y-4 mb-4 bg-gray-50 rounded-lg p-4">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No messages yet. Start the conversation!</p>
                  <p className="text-xs mt-2 text-gray-400">Type a message below or click "Counter Offer"</p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  console.log(`📨 [MSG ${idx}] Processing message:`, {
                    id: msg.id,
                    from: msg.from_user_name,
                    type: msg.message_type,
                    text: msg.text?.substring(0, 50),
                    proposal_hours: msg.proposal_hours,
                    created: msg.created_date
                  });

                  const isOwnMessage = msg.from_user_id === user.id;
                  const isSystemMessage = msg.message_type === 'system';
                  const isOfferMessage = msg.message_type === 'offer';

                  console.log(`🔍 [MSG ${idx}] Flags:`, {
                    isOwnMessage,
                    isSystemMessage,
                    isOfferMessage
                  });

                  if (isSystemMessage) {
                    console.log(`✅ [MSG ${idx}] Rendering as SYSTEM message`);
                    return (
                      <div key={msg.id} className="flex justify-center">
                        <div className="bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-700 max-w-md text-center">
                          {msg.text}
                        </div>
                      </div>
                    );
                  }

                  if (isOfferMessage) {
                    console.log(`🎁 [MSG ${idx}] Detected OFFER message`);
                    console.log(`   proposal_hours from message:`, msg.proposal_hours);
                    console.log(`   offer_history:`, negotiation.offer_history);
                    
                    // Match by proposal_hours instead of timestamp
                    const offer = negotiation.offer_history?.find(
                      o => {
                        const matchesUser = o.offered_by === msg.from_user_id;
                        const matchesHours = o.hours === msg.proposal_hours;
                        
                        console.log(`  🔎 Checking offer:`, {
                          offered_by: o.offered_by,
                          msg_from: msg.from_user_id,
                          matchesUser,
                          offer_hours: o.hours,
                          msg_hours: msg.proposal_hours,
                          matchesHours
                        });
                        
                        return matchesUser && matchesHours;
                      }
                    );

                    if (offer) {
                      console.log(`✅ [MSG ${idx}] Found matching offer, rendering OfferCard:`, {
                        offeredBy: offer.offered_by_name,
                        hours: offer.hours,
                        isOwnOffer: isOwnMessage,
                        canRespond: !isOwnMessage && negotiation.status === 'active'
                      });

                      return (
                        <OfferCard
                          key={msg.id}
                          offer={offer}
                          isOwnOffer={isOwnMessage}
                          onAccept={handleAcceptOffer}
                          onCounter={() => {
                            console.log('💬 [COUNTER] Opening counter offer modal');
                            setShowCounterModal(true);
                          }}
                          onDecline={handleDeclineOffer}
                          canRespond={!isOwnMessage && negotiation.status === 'active' && !isNegotiationClosed}
                        />
                      );
                    } else {
                      console.warn(`⚠️ [MSG ${idx}] OFFER message detected but NO matching offer found in history!`);
                      console.warn(`   Message has proposal_hours: ${msg.proposal_hours}, but no match in offer_history`);
                    }
                  }

                  console.log(`📝 [MSG ${idx}] Rendering as regular TEXT message`);
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          isOwnMessage
                            ? 'bg-gradient-to-r from-orange-500 to-amber-600 text-white'
                            : 'bg-white text-gray-900 border border-gray-200'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                        <p className={`text-xs mt-1 ${isOwnMessage ? 'text-orange-100' : 'text-gray-500'}`}>
                          {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {negotiation.status === 'active' && !isNegotiationClosed && (
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => {
                    console.log('⌨️ [INPUT] Message changed:', e.target.value.length, 'chars');
                    setMessage(e.target.value);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      console.log('⏎ [ENTER] Enter key pressed, sending message');
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button
                  onClick={() => {
                    console.log('🎯 [BUTTON] Counter Offer button clicked');
                    setShowCounterModal(true);
                  }}
                  variant="outline"
                  className="px-4"
                >
                  <Clock className="w-5 h-5 mr-2" />
                  Counter Offer
                </Button>
                <Button 
                  onClick={() => {
                    console.log('📤 [BUTTON] Send button clicked');
                    handleSendMessage();
                  }}
                  disabled={!message.trim() || sendMessageMutation.isLoading}
                  className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                >
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            )}

            {negotiation.status === 'declined' && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-900 text-center">
                  This negotiation was declined. Feel free to browse other items.
                </AlertDescription>
              </Alert>
            )}

            {negotiation.status === 'converted' && (
              <Alert className="bg-green-100 border-green-300">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  Agreement confirmed! Redirecting to time tracking...
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      <CounterOfferModal
        open={showCounterModal}
        onClose={() => {
          console.log('❌ [MODAL] Counter offer modal closed');
          setShowCounterModal(false);
        }}
        currentOffer={currentOfferHours}
        suggestedHours={item ? [item.required_hours - 2, item.required_hours + 2] : null}
        defaultHours={item?.required_hours}
        defaultWorkType={negotiation?.work_type || ""}
        onSubmit={handleCounterOffer}
      />

    </div>
  );
}