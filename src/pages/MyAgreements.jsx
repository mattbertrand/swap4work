
import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Clock, CheckCircle2, AlertCircle, MessageSquare, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function MyAgreements() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['myAgreements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Get both agreements where user is worker AND offerer
      const [asWorker, asOfferer] = await Promise.all([
        base44.entities.Agreement.filter({ worker_id: user.id }, '-updated_date'),
        base44.entities.Agreement.filter({ offerer_id: user.id }, '-updated_date')
      ]);
      
      // Combine and deduplicate by ID
      const allAgreements = [...asWorker, ...asOfferer];
      const uniqueAgreements = Array.from(
        new Map(allAgreements.map(a => [a.id, a])).values()
      );
      
      return uniqueAgreements;
    },
    enabled: !!user
  });

  const proposedAgreements = agreements.filter(a => a.status === 'proposed');
  const activeAgreements = agreements.filter(a => ['locked', 'in_progress'].includes(a.status));
  const completedAgreements = agreements.filter(a => ['completed', 'ready_for_handover'].includes(a.status));

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Please sign in to view your agreements</p>
          <Button onClick={() => base44.auth.redirectToLogin()}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  const AgreementCard = ({ agreement }) => {
    const progress = agreement.agreed_hours > 0 
      ? (agreement.hours_logged / agreement.agreed_hours) * 100 
      : 0;

    const statusConfig = {
      proposed: { color: 'bg-yellow-100 text-yellow-700', label: 'Proposed' },
      locked: { color: 'bg-blue-100 text-blue-700', label: 'Locked' },
      in_progress: { color: 'bg-purple-100 text-purple-700', label: 'In Progress' },
      ready_for_handover: { color: 'bg-green-100 text-green-700', label: 'Ready for Handover' },
      completed: { color: 'bg-gray-100 text-gray-700', label: 'Completed' },
      disputed: { color: 'bg-red-100 text-red-700', label: 'Disputed' }
    };

    const config = statusConfig[agreement.status] || statusConfig.proposed;

    return (
      <Card className="hover:shadow-lg transition-shadow border-orange-100">
        <CardContent className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <h3 className="font-bold text-xl text-gray-900 mb-1">{agreement.item_title}</h3>
              <p className="text-sm text-gray-500">With {agreement.offerer_name}</p>
            </div>
            <Badge className={config.color}>
              {config.label}
            </Badge>
          </div>

          {agreement.status !== 'proposed' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Progress</span>
                <span className="font-semibold text-orange-600">
                  {agreement.hours_logged} / {agreement.agreed_hours} hours
                </span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          )}

          <div className="flex gap-3">
            {agreement.status === 'proposed' && (
              <Link to={createPageUrl(`Chat?agreementId=${agreement.id}`)} className="flex-1">
                <Button variant="outline" className="w-full">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Continue Negotiation
                </Button>
              </Link>
            )}
            
            {['locked', 'in_progress'].includes(agreement.status) && (
              <Link to={createPageUrl(`TimeTracking?agreementId=${agreement.id}`)} className="flex-1">
                <Button className="w-full bg-gradient-to-r from-orange-500 to-amber-600">
                  <Clock className="w-4 h-4 mr-2" />
                  Log Time
                </Button>
              </Link>
            )}

            {agreement.status === 'ready_for_handover' && (
              <Link to={createPageUrl(`AgreementDetail?id=${agreement.id}`)} className="flex-1">
                <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-600">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Complete Handover
                </Button>
              </Link>
            )}

            {agreement.status === 'completed' && (
              <Link to={createPageUrl(`AgreementDetail?id=${agreement.id}`)} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Agreements</h1>
          <p className="text-gray-500 mt-1">Track your work exchanges</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Active Agreements</p>
                  <p className="text-3xl font-bold text-gray-900">{activeAgreements.length}</p>
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
                  <p className="text-sm text-gray-600 mb-1">Hours Logged</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {agreements.reduce((sum, a) => sum + (a.hours_logged || 0), 0)}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{completedAgreements.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="proposed" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="proposed">Proposed ({proposedAgreements.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({activeAgreements.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({completedAgreements.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="proposed">
            {proposedAgreements.length === 0 ? (
              <div className="text-center py-16">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No pending proposals</h3>
                <p className="text-gray-500">Browse items and start negotiating</p>
                <Link to={createPageUrl("Browse")}>
                  <Button className="mt-4">Browse Items</Button>
                </Link>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No active agreements</h3>
                <p className="text-gray-500">Active work exchanges will appear here</p>
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
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No completed agreements</h3>
                <p className="text-gray-500">Completed work exchanges will appear here</p>
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
      </div>
    </div>
  );
}
