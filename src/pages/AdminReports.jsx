import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Shield,
  Flag,
  ArrowLeft,
  Loader2,
  EyeOff,
  Ban,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import ReportCard from "@/components/admin/ReportCard";

const ACTION_LABELS = {
  ignored: "ignored",
  warned: "warned",
  listing_hidden: "hid listing for",
  suspended: "suspended",
  banned: "banned",
};

export default function AdminReports() {
  const queryClient = useQueryClient();
  const [actingOn, setActingOn] = useState(null);

  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: () => base44.auth.me(),
  });

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ["allReports"],
    queryFn: () => base44.entities.Report.list("-created_date"),
  });

  // Pre-compute previous-report counts per reported user
  const previousCountMap = useMemo(() => {
    const counts = {};
    const sorted = [...reports].sort(
      (a, b) => new Date(a.created_date) - new Date(b.created_date)
    );
    sorted.forEach((r) => {
      const key = r.reported_user_id;
      if (key) {
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    return counts;
  }, [reports]);

  const getPreviousCount = (report) => {
    if (!report.reported_user_id) return 0;
    const total = previousCountMap[report.reported_user_id] || 0;
    // total includes this report, so previous = total - 1
    return Math.max(0, total - 1);
  };

  const handleAction = async (report, action) => {
    if (!user) return;
    setActingOn(report.id);
    try {
      // All privileged moderation writes (report resolution, moderation
      // history, warnings, suspension/ban) happen server-side in the
      // admin-only resolveReport backend function.
      await base44.functions.invoke("resolveReport", {
        report_id: report.id,
        action,
      });
      toast.success(`Report ${ACTION_LABELS[action]} ${report.reported_user_name || ""}`.trim());
      queryClient.invalidateQueries(["allReports"]);
    } catch (error) {
      toast.error("Failed to process action. Please try again.");
    } finally {
      setActingOn(null);
    }
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 mb-4">
            You need admin privileges to access this page.
          </p>
          <Link to={createPageUrl("Home")}>
            <Button>Go to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const openReports = reports.filter(
    (r) => r.status === "open" || r.status === "under_review"
  );
  const resolvedReports = reports.filter(
    (r) => r.status === "resolved" || r.status === "ignored"
  );

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => window.history.back()}
          className="mb-4 hover:bg-orange-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="flex items-center gap-3 mb-8">
          <Flag className="w-8 h-8 text-red-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Moderation Center
            </h1>
            <p className="text-gray-500 mt-1">
              Review user reports and take moderation action
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="border-orange-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Flag className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {openReports.length}
                </p>
                <p className="text-xs text-gray-500">Open</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Ban className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.filter(
                    (r) => r.reason === "scam_fraud" || r.reason === "safety_concern"
                  ).length}
                </p>
                <p className="text-xs text-gray-500">Safety Reports</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {resolvedReports.length}
                </p>
                <p className="text-xs text-gray-500">Resolved</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-orange-100">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {reports.length}
                </p>
                <p className="text-xs text-gray-500">Total Reports</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="open" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="open">
              Open ({openReports.length})
            </TabsTrigger>
            <TabsTrigger value="resolved">
              Resolved ({resolvedReports.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="open" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              </div>
            ) : openReports.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-400 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    All caught up!
                  </h3>
                  <p className="text-gray-500">
                    There are no open reports to review.
                  </p>
                </CardContent>
              </Card>
            ) : (
              openReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  previousCount={getPreviousCount(report)}
                  onAction={handleAction}
                  disabled={actingOn === report.id}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="resolved" className="space-y-4">
            {resolvedReports.length === 0 ? (
              <Card className="border-dashed border-2 border-gray-200">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                  <EyeOff className="w-12 h-12 text-gray-300 mb-3" />
                  <h3 className="text-lg font-semibold text-gray-900">
                    No resolved reports
                  </h3>
                  <p className="text-gray-500">
                    Resolved and ignored reports will appear here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              resolvedReports.map((report) => (
                <ReportCard
                  key={report.id}
                  report={report}
                  previousCount={getPreviousCount(report)}
                  onAction={handleAction}
                  disabled={true}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}