import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, Plus, CheckCircle2, Play, Pause } from "lucide-react";
import { format } from "date-fns";

export default function TimeTracking() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showLogForm, setShowLogForm] = useState(false);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  
  const [logForm, setLogForm] = useState({
    hours: "",
    date: format(new Date(), 'yyyy-MM-dd'),
    description: ""
  });

  const urlParams = new URLSearchParams(window.location.search);
  const agreementId = urlParams.get('agreementId');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning]);

  const { data: agreement } = useQuery({
    queryKey: ['agreement', agreementId],
    queryFn: async () => {
      const results = await base44.entities.Agreement.filter({ id: agreementId });
      return results[0];
    },
    enabled: !!agreementId
  });

  const { data: timeLogs = [] } = useQuery({
    queryKey: ['timeLogs', agreementId],
    queryFn: () => base44.entities.TimeLog.filter({ agreement_id: agreementId }, '-date'),
    enabled: !!agreementId
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', agreementId],
    queryFn: () => base44.entities.Milestone.filter({ agreement_id: agreementId }, 'order'),
    enabled: !!agreementId
  });

  const logTimeMutation = useMutation({
    mutationFn: (data) => base44.entities.TimeLog.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries(['timeLogs', agreementId]);
      
      // Update total hours logged in agreement
      const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0) + parseFloat(logForm.hours);
      await base44.entities.Agreement.update(agreementId, {
        hours_logged: totalHours,
        status: 'in_progress'
      });
      queryClient.invalidateQueries(['agreement', agreementId]);
      
      setLogForm({ hours: "", date: format(new Date(), 'yyyy-MM-dd'), description: "" });
      setShowLogForm(false);
    }
  });

  const handleLogTime = () => {
    if (!logForm.hours || !user) return;

    if (parseFloat(logForm.hours) > 12) {
      alert("Maximum 12 hours can be logged per day");
      return;
    }

    logTimeMutation.mutate({
      agreement_id: agreementId,
      worker_id: user.id,
      hours: parseFloat(logForm.hours),
      date: logForm.date,
      description: logForm.description,
      status: "pending"
    });
  };

  const handleTimerStop = () => {
    const hours = (timerSeconds / 3600).toFixed(2);
    setLogForm({ ...logForm, hours });
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setShowLogForm(true);
  };

  const handleMarkComplete = async () => {
    if (!agreement) return;

    const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
    
    if (totalHours >= agreement.agreed_hours) {
      await base44.entities.Agreement.update(agreementId, {
        status: 'ready_for_handover'
      });
      queryClient.invalidateQueries(['agreement', agreementId]);
      navigate(createPageUrl(`AgreementDetail?id=${agreementId}`));
    } else {
      alert(`You need to log ${agreement.agreed_hours - totalHours} more hours before completing`);
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
  const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
  const progress = agreement.agreed_hours > 0 ? (totalHours / agreement.agreed_hours) * 100 : 0;

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-orange-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Progress Overview */}
        <Card className="mb-6 border-orange-100 shadow-xl">
          <CardHeader className="border-b border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl mb-1">{agreement.item_title}</CardTitle>
                <p className="text-gray-600">Working with {agreement.offerer_name}</p>
              </div>
              <Badge className={
                progress >= 100 ? 'bg-green-500' :
                progress >= 50 ? 'bg-blue-500' :
                'bg-orange-500'
              } className="text-white">
                {progress.toFixed(0)}% Complete
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="mb-6">
              <div className="flex justify-between mb-3">
                <span className="text-gray-600 font-medium">Work Progress</span>
                <span className="text-xl font-bold text-orange-600">
                  {totalHours.toFixed(1)} / {agreement.agreed_hours} hours
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Timer */}
            {isWorker && (
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200">
                <h3 className="font-semibold text-gray-900 mb-4">Work Timer</h3>
                <div className="flex items-center justify-between">
                  <div className="text-4xl font-mono font-bold text-gray-900">
                    {formatTimer(timerSeconds)}
                  </div>
                  <div className="flex gap-3">
                    {!isTimerRunning ? (
                      <Button
                        onClick={() => setIsTimerRunning(true)}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Start Timer
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={() => setIsTimerRunning(false)}
                          variant="outline"
                        >
                          <Pause className="w-5 h-5 mr-2" />
                          Pause
                        </Button>
                        <Button
                          onClick={handleTimerStop}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          Stop & Log
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Time Logs */}
          <div className="lg:col-span-2">
            <Card className="border-orange-100 shadow-lg">
              <CardHeader className="border-b border-orange-100">
                <div className="flex justify-between items-center">
                  <CardTitle>Time Logs</CardTitle>
                  {isWorker && !showLogForm && (
                    <Button
                      onClick={() => setShowLogForm(true)}
                      size="sm"
                      className="bg-gradient-to-r from-orange-500 to-amber-600"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Log Time
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {showLogForm && isWorker && (
                  <div className="mb-6 p-4 bg-orange-50 rounded-xl border border-orange-200">
                    <h3 className="font-semibold mb-4">Log Work Hours</h3>
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="hours">Hours Worked *</Label>
                          <Input
                            id="hours"
                            type="number"
                            step="0.5"
                            max="12"
                            value={logForm.hours}
                            onChange={(e) => setLogForm({...logForm, hours: e.target.value})}
                            placeholder="e.g., 4.5"
                            className="mt-2"
                          />
                        </div>
                        <div>
                          <Label htmlFor="date">Date *</Label>
                          <Input
                            id="date"
                            type="date"
                            value={logForm.date}
                            onChange={(e) => setLogForm({...logForm, date: e.target.value})}
                            className="mt-2"
                          />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="description">What did you accomplish?</Label>
                        <Textarea
                          id="description"
                          value={logForm.description}
                          onChange={(e) => setLogForm({...logForm, description: e.target.value})}
                          placeholder="Describe the work completed..."
                          rows={3}
                          className="mt-2"
                        />
                      </div>
                      <div className="flex gap-3">
                        <Button onClick={handleLogTime} className="flex-1 bg-orange-600 hover:bg-orange-700">
                          Save Entry
                        </Button>
                        <Button onClick={() => setShowLogForm(false)} variant="outline">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  {timeLogs.map((log) => (
                    <div key={log.id} className="p-4 bg-white border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <Clock className="w-5 h-5 text-orange-600" />
                          <span className="font-bold text-lg">{log.hours}h</span>
                        </div>
                        <Badge variant={log.status === 'approved' ? 'default' : 'secondary'}>
                          {log.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        {format(new Date(log.date), 'MMMM d, yyyy')}
                      </p>
                      {log.description && (
                        <p className="text-gray-700 text-sm">{log.description}</p>
                      )}
                    </div>
                  ))}
                  {timeLogs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No time logged yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Milestones */}
          <div>
            <Card className="border-orange-100 shadow-lg">
              <CardHeader className="border-b border-orange-100">
                <CardTitle>Milestones</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {milestones.length > 0 ? (
                  <div className="space-y-3">
                    {milestones.map((milestone, index) => (
                      <div key={milestone.id} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                            milestone.status === 'approved' ? 'bg-green-500' :
                            milestone.status === 'submitted' ? 'bg-blue-500' :
                            'bg-gray-300'
                          }`}>
                            {milestone.status === 'approved' ? (
                              <CheckCircle2 className="w-5 h-5 text-white" />
                            ) : (
                              <span className="text-white font-semibold">{index + 1}</span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{milestone.title}</h4>
                            <p className="text-sm text-gray-600 mb-1">{milestone.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {milestone.hours}h
                              </Badge>
                              <Badge className={
                                milestone.status === 'approved' ? 'bg-green-100 text-green-700' :
                                milestone.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                              }>
                                {milestone.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No milestones defined
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mark Complete Button */}
            {isWorker && progress >= 100 && (
              <Button
                onClick={handleMarkComplete}
                className="w-full mt-6 h-12 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                Mark Work Complete
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}