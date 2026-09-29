import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { authLoginUrl } from "@/lib/authNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Calendar, AlertCircle, ArrowRight, Briefcase } from "lucide-react";
import { format, differenceInDays } from "date-fns";

export default function TradeDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null)).finally(() => setAuthChecked(true));
  }, []);

  const { data: agreements = [], isLoading } = useQuery({
    queryKey: ['dashboard-agreements', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const [asWorker, asOfferer] = await Promise.all([
        base44.entities.Agreement.filter({ worker_id: user.id }),
        base44.entities.Agreement.filter({ offerer_id: user.id })
      ]);
      const seen = new Set();
      return [...asWorker, ...asOfferer].filter(a => {
        if (seen.has(a.id)) return false;
        seen.add(a.id);
        return true;
      });
    },
    enabled: !!user,
    refetchInterval: 15000
  });

  const activeStatuses = ['locked', 'in_progress', 'ready_for_handover'];
  const activeTrades = agreements.filter(a => activeStatuses.includes(a.status));
  const agreementIds = activeTrades.map(a => a.id);

  const { data: milestones = [] } = useQuery({
    queryKey: ['dashboard-milestones', agreementIds.join(',')],
    queryFn: async () => {
      if (agreementIds.length === 0) return [];
      const results = await Promise.all(
        agreementIds.map(id => base44.entities.Milestone.filter({ agreement_id: id }))
      );
      return results.flat();
    },
    enabled: agreementIds.length > 0
  });

  const totalHoursLogged = activeTrades.reduce((sum, a) => sum + (a.hours_logged || 0), 0);
  const totalAgreedHours = activeTrades.reduce((sum, a) => sum + (a.agreed_hours || 0), 0);

  const upcomingMilestones = milestones
    .filter(m => m.due_date && m.status !== 'approved')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

  const upcomingDeadlines = upcomingMilestones.filter(m => {
    const days = differenceInDays(new Date(m.due_date), new Date());
    return days >= 0 && days <= 7;
  }).length;

  if (!authChecked || (user && isLoading)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4 md:p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Trade Dashboard</h1>
        <p className="text-gray-600 mb-8">Track your active trades, progress, and upcoming deadlines.</p>
        <Card className="border-orange-100 shadow-md">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-700 font-medium mb-2">Sign in to see your trades</p>
            <p className="text-gray-500 text-sm mb-6">Your active agreements, hours, and milestones live here once you're signed in.</p>
            <Button
              onClick={() => navigate(authLoginUrl(window.location.pathname + window.location.search))}
              className="bg-gradient-to-r from-orange-500 to-amber-600"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Trade Dashboard</h1>
      <p className="text-gray-600 mb-8">Track your active trades, progress, and upcoming deadlines.</p>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="border-orange-100 shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{activeTrades.length}</p>
              <p className="text-sm text-gray-500">Active Trades</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-100 shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {totalHoursLogged.toFixed(1)}
                <span className="text-lg text-gray-400">/{totalAgreedHours}</span>
              </p>
              <p className="text-sm text-gray-500">Hours Logged</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-orange-100 shadow-md">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900">{upcomingDeadlines}</p>
              <p className="text-sm text-gray-500">Deadlines (7 days)</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Trades */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Active Trades</h2>
      {activeTrades.length === 0 ? (
        <Card className="border-orange-100 shadow-md mb-8">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No active trades yet.</p>
            <Button onClick={() => navigate(createPageUrl("Browse"))} className="bg-gradient-to-r from-orange-500 to-amber-600">
              Browse Items
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 mb-8">
          {activeTrades.map((trade) => {
            const progress = trade.agreed_hours > 0 ? ((trade.hours_logged || 0) / trade.agreed_hours) * 100 : 0;
            const isWorker = user.id === trade.worker_id;
            const partnerName = isWorker ? trade.offerer_name : trade.worker_name;
            const daysLeft = trade.estimated_due_date ? differenceInDays(new Date(trade.estimated_due_date), new Date()) : null;

            return (
              <Card
                key={trade.id}
                className="border-orange-100 shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(createPageUrl(`TimeTracking?agreementId=${trade.id}`))}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{trade.item_title}</h3>
                        <Badge className={
                          trade.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          trade.status === 'ready_for_handover' ? 'bg-green-100 text-green-700' :
                          'bg-orange-100 text-orange-700'
                        }>
                          {trade.status.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">
                        {isWorker ? 'Working for' : 'Worker:'} {partnerName}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex-1 max-w-xs">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-500">Progress</span>
                            <span className="font-medium text-gray-700">
                              {(trade.hours_logged || 0).toFixed(1)} / {trade.agreed_hours}h
                            </span>
                          </div>
                          <Progress value={progress} className="h-2" />
                        </div>
                        {trade.estimated_due_date && (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className={
                              daysLeft < 0 ? 'text-red-600 font-medium' :
                              daysLeft <= 3 ? 'text-amber-600 font-medium' :
                              'text-gray-600'
                            }>
                              {daysLeft < 0 ? 'Overdue' : `${daysLeft}d left`}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400 hidden md:block" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upcoming Milestones */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">Upcoming Milestones</h2>
      {upcomingMilestones.length === 0 ? (
        <Card className="border-orange-100 shadow-md">
          <CardContent className="p-8 text-center">
            <Calendar className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No upcoming milestone deadlines.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {upcomingMilestones.map((milestone) => {
            const trade = activeTrades.find(a => a.id === milestone.agreement_id);
            const daysLeft = differenceInDays(new Date(milestone.due_date), new Date());
            return (
              <Card key={milestone.id} className="border-orange-100 shadow-sm">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    daysLeft < 0 ? 'bg-red-100' : daysLeft <= 3 ? 'bg-amber-100' : 'bg-blue-100'
                  }`}>
                    <Calendar className={`w-5 h-5 ${
                      daysLeft < 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate">{milestone.title}</h4>
                    <p className="text-sm text-gray-500 truncate">{trade?.item_title || 'Unknown trade'}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">{format(new Date(milestone.due_date), 'MMM d')}</p>
                    <Badge variant="outline" className={`text-xs ${
                      daysLeft < 0 ? 'text-red-600' : daysLeft <= 3 ? 'text-amber-600' : 'text-gray-500'
                    }`}>
                      {daysLeft < 0 ? 'Overdue' : daysLeft === 0 ? 'Today' : `${daysLeft}d`}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}