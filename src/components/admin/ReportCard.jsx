import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Flag,
  User,
  Package,
  MessageSquare,
  MessagesSquare,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";

const REASON_LABELS = {
  scam_fraud: "Scam / Fraud",
  fake_listing: "Fake Listing",
  harassment: "Harassment",
  inappropriate_content: "Inappropriate Content",
  spam: "Spam",
  safety_concern: "Safety Concern",
  other: "Other",
};

const TARGET_ICONS = {
  user: User,
  item: Package,
  negotiation: MessagesSquare,
  message: MessageSquare,
};

const ACTION_CONFIG = [
  {
    action: "ignored",
    label: "Ignore",
    variant: "outline",
    className: "",
  },
  {
    action: "warned",
    label: "Warn User",
    variant: "outline",
    className: "text-yellow-700 border-yellow-300 hover:bg-yellow-50",
  },
  {
    action: "listing_hidden",
    label: "Hide Listing",
    variant: "outline",
    className: "text-orange-700 border-orange-300 hover:bg-orange-50",
  },
  {
    action: "suspended",
    label: "Suspend",
    variant: "outline",
    className: "text-orange-700 border-orange-400 hover:bg-orange-50",
  },
  {
    action: "banned",
    label: "Ban",
    variant: "outline",
    className: "text-red-700 border-red-300 hover:bg-red-50",
  },
];

export default function ReportCard({
  report,
  previousCount,
  onAction,
  disabled,
}) {
  const TargetIcon = TARGET_ICONS[report.target_type] || Flag;
  const isResolved = report.status !== "open" && report.status !== "under_review";

  return (
    <Card
      className={`border-l-4 ${
        isResolved
          ? "border-l-gray-300 opacity-75"
          : previousCount > 0
          ? "border-l-red-500"
          : "border-l-orange-400"
      }`}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <TargetIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  variant="outline"
                  className="text-xs bg-red-50 text-red-700 border-red-200"
                >
                  {REASON_LABELS[report.reason] || report.reason}
                </Badge>
                <span className="text-xs text-gray-500">
                  {format(new Date(report.created_date), "MMM d, yyyy 'at' h:mm a")}
                </span>
              </div>
            </div>
          </div>
          <Badge
            className={
              report.status === "open"
                ? "bg-orange-100 text-orange-700"
                : report.status === "under_review"
                ? "bg-blue-100 text-blue-700"
                : report.status === "resolved"
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-600"
            }
          >
            {report.status.replace("_", " ")}
          </Badge>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
          <div>
            <span className="text-gray-500">Reported user: </span>
            <span className="font-medium text-gray-900">
              {report.reported_user_name || "—"}
            </span>
          </div>
          <div>
            <span className="text-gray-500">Reporter: </span>
            <span className="font-medium text-gray-900">
              {report.reporter_name}
            </span>
          </div>
          <div className="sm:col-span-2">
            <span className="text-gray-500">Target: </span>
            <span className="font-medium text-gray-900">
              {report.target_title || report.target_id}
            </span>
            <span className="text-gray-400 ml-2 text-xs">
              ({report.target_type})
            </span>
          </div>
        </div>

        {/* Description */}
        {report.description && (
          <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
            {report.description}
          </div>
        )}

        {/* Previous reports warning */}
        {previousCount > 0 && !isResolved && (
          <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>
              This user has <strong>{previousCount}</strong> previous
              report{previousCount !== 1 ? "s" : ""}.
            </span>
          </div>
        )}

        {/* Resolution info */}
        {isResolved && report.resolution && (
          <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            <span className="font-medium">Resolution: </span>
            {report.resolution}
            {report.resolved_by_name && (
              <span className="text-gray-400 ml-2">
                by {report.resolved_by_name}
              </span>
            )}
          </div>
        )}

        {/* Action buttons */}
        {!isResolved && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
            {ACTION_CONFIG.map((cfg) => (
              <Button
                key={cfg.action}
                size="sm"
                variant={cfg.variant}
                className={cfg.className}
                disabled={disabled}
                onClick={() => onAction(report, cfg.action)}
              >
                {cfg.label}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}