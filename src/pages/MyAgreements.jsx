import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { displayName } from "@/lib/names";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { formatDuration } from "@/lib/duration";
import { createPageUrl } from "@/utils";
import { Clock, CheckCircle2, AlertCircle, MessageSquare, TrendingUp, Trash2 } from "lucide-react";
import AuthModal from "@/components/auth/AuthModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { useLanguage } from "@/i18n/LanguageContext";

export default function MyAgreements() {
  const queryClient = useQueryClient();
  const { t } = useLanguage();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [deleteItemId, setDeleteItemId] = useState(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [deleteType, setDeleteType] = useState(null); // 'negotiation' or 'agreement'

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAuthChecked(true); }).catch(() => { setUser(null); setAuthChecked(true); });
  }, []);

  // Fetch both negotiations AND agreements
  const { data: negotiations = [], isLoading: negsLoading } = useQuery({
    queryKey: ['myNegotiations', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const [asBidder, asOfferer] = await Promise.all([
        base44.entities.Negotiation.filter({ bidder_id: user.id }, '-updated_date'),
        base44.entities.Negotiation.filter({ offerer_id: user.id }, '-updated_date')
      ]);
      
      const allNegotiations = [...asBidder, ...asOfferer];
      const uniqueNegotiations = Array.from(
        new Map(allNegotiations.map(n => [n.id, n])).values()
      );
      
      console.log(`✅ Loaded ${uniqueNegotiations.length} negotiations for user`);
      return uniqueNegotiations;
    },
    enabled: !!user,
    refetchInterval: 5000
  });

  const { data: agreements = [], isLoading: agreementsLoading } = useQuery({
    queryKey: ['myAgreements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const [asWorker, asOfferer] = await Promise.all([
        base44.entities.Agreement.filter({ worker_id: user.id }, '-updated_date'),
        base44.entities.Agreement.filter({ offerer_id: user.id }, '-updated_date')
      ]);
      
      const allAgreements = [...asWorker, ...asOfferer];
      const uniqueAgreements = Array.from(
        new Map(allAgreements.map(a => [a.id, a])).values()
      );
      
      console.log(`✅ Loaded ${uniqueAgreements.length} agreements for user`);
      return uniqueAgreements;
    },
    enabled: !!user,
    refetchInterval: 5000
  });

  const deleteNegotiationMutation = useMutation({
    mutationFn: async (negotiationId) => {
      const negotiation = negotiations.find(n => n.id === negotiationId);
      if (!negotiation) return;

      await base44.entities.Negotiation.delete(negotiationId);

      const otherUserId = user.id === negotiation.bidder_id ? negotiation.offerer_id : negotiation.bidder_id;
      
      await base44.functions.invoke('sendNotification', {
        user_id: otherUserId,
        type: 'agreement_created',
        title: 'Negotiation cancelled',
        message: `${displayName(user.full_name)} cancelled the negotiation for ${negotiation.item_title}`,
        related_id: negotiation.item_id,
        related_type: 'item',
        link_url: createPageUrl(`Browse`)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myNegotiations']);
      setDeleteItemId(null);
      setDeleteType(null);
    }
  });

  const deleteAgreementMutation = useMutation({
    mutationFn: async (agreementId) => {
      const agreement = agreements.find(a => a.id === agreementId);
      if (!agreement) return;

      await base44.entities.Agreement.delete(agreementId);

      const otherUserId = user.id === agreement.worker_id ? agreement.offerer_id : agreement.worker_id;
      
      await base44.functions.invoke('sendNotification', {
        user_id: otherUserId,
        type: 'agreement_created',
        title: 'Agreement cancelled',
        message: `${displayName(user.full_name)} cancelled the agreement for ${agreement.item_title}`,
        related_id: agreement.item_id,
        related_type: 'item',
        link_url: createPageUrl(`Browse`)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['myAgreements']);
      setDeleteItemId(null);
      setDeleteType(null);
    }
  });

  const handleDelete = () => {
    if (deleteType === 'negotiation') {
      deleteNegotiationMutation.mutate(deleteItemId);
    } else {
      deleteAgreementMutation.mutate(deleteItemId);
    }
  };

  const activeNegotiations = negotiations.filter(n => n.status === 'active');
  const acceptedNegotiations = negotiations.filter(n => n.status === 'accepted');
  const activeAgreements = agreements.filter(a => ['locked', 'in_progress'].includes(a.status));
  const completedAgreements = agreements.filter(a => ['completed', 'ready_for_handover'].includes(a.status));
  const proposedAgreements = agreements.filter(a => a.status === 'proposed');

  const isLoading = negsLoading || agreementsLoading;

  if (!authChecked) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div></div>;
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <TrendingUp className="w-10 h-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">{t("agree.auth_title")}</h2>
            <p className="text-gray-600 mb-6">{t("agree.auth_sub")}</p>
            <Button onClick={() => setAuthModalOpen(true)} className="bg-gradient-to-r from-orange-500 to-amber-600 px-8">
              {t("agree.login_continue")}
            </Button>
          </div>
        </div>
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} message={t("listings.auth_continue")} />
      </>
    );
  }

  const NegotiationCard = ({ negotiation }) => {
    const statusConfig = {
      active: { color: 'bg-blue-100 text-blue-700', label: t("agree.st_negotiating") },
      accepted: { color: 'bg-green-100 text-green-700', label: t("agree.st_accepted") },
      declined: { color: 'bg-red-100 text-red-700', label: t("status.declined") },
      expired: { color: 'bg-gray-100 text-gray-700', label: t("status.expired") },
      converted: { color: 'bg-purple-100 text-purple-700', label: t("agree.st_agreement_created") }
    };

    const config = statusConfig[negotiation.status] || statusConfig.active;
    const currentOffer = negotiation.counter_offer_hours || negotiation.initial_offer_hours;

    return (
      <Card className="hover:shadow-lg transition-shadow border-orange-100">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-900 mb-1">{negotiation.item_title}</h3>
              <p className="text-sm text-gray-500">
                {user.id === negotiation.bidder_id
                  ? t("agree.with", { name: displayName(negotiation.offerer_name) })
                  : t("agree.with", { name: displayName(negotiation.bidder_name) })}
              </p>
            </div>
            <Badge className={config.color}>
              {config.label}
            </Badge>
          </div>

          <div className="mb-4 p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-2 text-orange-700">
              <Clock className="w-4 h-4" />
              <span className="font-semibold">{t("agree.current_offer", { time: formatDuration(currentOffer) })}</span>
            </div>
            {negotiation.last_activity && (
              <p className="text-xs text-gray-600 mt-1">
                {t("agree.last_activity", { date: format(new Date(negotiation.last_activity), 'MMM d, h:mm a') })}
              </p>
            )}
          </div>

          <div className="flex gap-3">
            <Link to={createPageUrl(`Negotiation?id=${negotiation.id}`)} className="flex-1">
              <Button variant="outline" className="w-full">
                <MessageSquare className="w-4 h-4 mr-2" />
                {t("agree.view_negotiation")}
              </Button>
            </Link>
            <Button
              onClick={() => {
                setDeleteItemId(negotiation.id);
                setDeleteType('negotiation');
              }}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const AgreementCard = ({ agreement }) => {
    const progress = agreement.agreed_hours > 0 
      ? (agreement.hours_logged / agreement.agreed_hours) * 100 
      : 0;

    const statusConfig = {
      proposed: { color: 'bg-yellow-100 text-yellow-700', label: t("status.proposed") },
      locked: { color: 'bg-blue-100 text-blue-700', label: t("status.locked") },
      in_progress: { color: 'bg-purple-100 text-purple-700', label: t("status.in_progress") },
      ready_for_handover: { color: 'bg-green-100 text-green-700', label: t("status.ready_for_handover") },
      completed: { color: 'bg-gray-100 text-gray-700', label: t("status.completed") },
      disputed: { color: 'bg-red-100 text-red-700', label: t("status.disputed") }
    };

    const config = statusConfig[agreement.status] || statusConfig.proposed;

    return (
      <Card className="hover:shadow-lg transition-shadow border-orange-100">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-900 mb-1">{agreement.item_title}</h3>
              <p className="text-sm text-gray-500">
                {user.id === agreement.worker_id
                  ? t("agree.with", { name: displayName(agreement.offerer_name) })
                  : t("agree.with", { name: displayName(agreement.worker_name) })}
              </p>
            </div>
            <Badge className={config.color}>
              {config.label}
            </Badge>
          </div>

          {agreement.status !== 'proposed' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">{t("dash.progress")}</span>
                <span className="font-semibold text-orange-600">
                  {formatDuration(agreement.hours_logged || 0)} / {formatDuration(agreement.agreed_hours)} {t("agree.of_work")}
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex gap-3">
            {agreement.status === 'proposed' && (
              <Link to={createPageUrl(`Negotiation?id=${agreement.id}`)} className="flex-1">
                <Button variant="outline" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {t("agree.continue_setup")}
                </Button>
              </Link>
            )}
            
            {['locked', 'in_progress'].includes(agreement.status) && (
              <Link to={createPageUrl(`TimeTracking?agreementId=${agreement.id}`)} className="flex-1">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-600">
                  <Clock className="w-4 h-4 mr-2" />
                  {t("agree.log_time")}
                </Button>
              </Link>
            )}

            {agreement.status === 'ready_for_handover' && (
              <Link to={createPageUrl(`AgreementDetail?id=${agreement.id}`)} className="flex-1">
                <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {t("agree.complete_handover")}
                </Button>
              </Link>
            )}

            {agreement.status === 'completed' && (
              <Link to={createPageUrl(`AgreementDetail?id=${agreement.id}`)} className="flex-1">
                <Button variant="outline" className="w-full">
                  {t("common.view_details")}
                </Button>
              </Link>
            )}

            <Button
              onClick={() => {
                setDeleteItemId(agreement.id);
                setDeleteType('agreement');
              }}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{t("agree.page_title")}</h1>
          <p className="text-gray-500 mt-1">{t("agree.page_sub")}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t("agree.active_negotiations")}</p>
                  <p className="text-3xl font-bold text-gray-900">{activeNegotiations.length + acceptedNegotiations.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t("agree.active_work")}</p>
                  <p className="text-3xl font-bold text-gray-900">{activeAgreements.length + proposedAgreements.length}</p>
                </div>
                <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t("agree.completed")}</p>
                  <p className="text-3xl font-bold text-gray-900">{completedAgreements.length}</p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="negotiations" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="negotiations">
              {t("agree.tab_negotiations", { n: activeNegotiations.length + acceptedNegotiations.length })}
            </TabsTrigger>
            <TabsTrigger value="proposed">
              {t("agree.tab_proposed", { n: proposedAgreements.length })}
            </TabsTrigger>
            <TabsTrigger value="active">
              {t("agree.tab_active", { n: activeAgreements.length })}
            </TabsTrigger>
            <TabsTrigger value="completed">
              {t("agree.tab_completed", { n: completedAgreements.length })}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="negotiations">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
              </div>
            ) : [...activeNegotiations, ...acceptedNegotiations].length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("agree.no_negotiations")}</h3>
                <p className="text-gray-500">{t("agree.no_negotiations_sub")}</p>
                <Link to={createPageUrl("Browse")}>
                  <Button className="mt-4">{t("dash.browse_items")}</Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6">
                {[...activeNegotiations, ...acceptedNegotiations].map(negotiation => (
                  <NegotiationCard key={negotiation.id} negotiation={negotiation} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="proposed">
            {proposedAgreements.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("agree.no_proposed")}</h3>
                <p className="text-gray-500">{t("agree.no_proposed_sub")}</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {proposedAgreements.map(agreement => (
                  <AgreementCard key={agreement.id} agreement={agreement} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="active">
            {activeAgreements.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("agree.no_active")}</h3>
                <p className="text-gray-500">{t("agree.no_active_sub")}</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {activeAgreements.map(agreement => (
                  <AgreementCard key={agreement.id} agreement={agreement} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedAgreements.length === 0 ? (
              <div className="text-center py-16">
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t("agree.no_completed")}</h3>
                <p className="text-gray-500">{t("agree.no_completed_sub")}</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {completedAgreements.map(agreement => (
                  <AgreementCard key={agreement.id} agreement={agreement} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={!!deleteItemId} onOpenChange={() => {
          setDeleteItemId(null);
          setDeleteType(null);
        }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("agree.cancel_title", { type: deleteType === 'negotiation' ? t("agree.negotiation") : t("agree.agreement") })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("agree.cancel_confirm", { type: deleteType === 'negotiation' ? t("agree.negotiation").toLowerCase() : t("agree.agreement").toLowerCase() })}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t("agree.keep_it")}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                {t("agree.yes_cancel", { type: deleteType === 'negotiation' ? t("agree.negotiation") : t("agree.agreement") })}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}