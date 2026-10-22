import React, { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Package, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import HoursMinutesInput from "@/components/forms/HoursMinutesInput";
import { formatDuration } from "@/lib/duration";
import { displayName } from "@/lib/names";
import { getAllowedOfferTypes, summarizeReturnPrefs } from "@/lib/exchangePrefs";

// Start-negotiation dialog. Clearly separates:
//   1. what the listing owner is offering (the target listing),
//   2. what the owner wants in return (their saved preferences),
//   3. what the requester is offering (one of their own eligible listings).
// Only listings of a type the owner accepts are selectable. Preferences are
// guidance — the owner still accepts or rejects the proposal.

function OwnerOfferLine({ item }) {
  return item.listing_type === "service"
    ? `Up to ${formatDuration(item.required_hours)} of service`
    : `The item (asking ${formatDuration(item.required_hours)} of work in return)`;
}

export default function StartNegotiationModal({
  open,
  onClose,
  targetItem,
  targetOptions,
  myItems = [],
  myServices = [],
  onConfirm,
  loading
}) {
  const [targetId, setTargetId] = useState("");
  const [offeredId, setOfferedId] = useState("");
  const [hours, setHours] = useState(null);
  const [workType, setWorkType] = useState("");
  const [message, setMessage] = useState("");

  // Reset whenever the dialog opens
  useEffect(() => {
    if (open) {
      const firstTarget = targetOptions?.[0] || targetItem || null;
      setTargetId(firstTarget?.id || "");
      setOfferedId("");
      setHours(firstTarget?.required_hours || null);
      setWorkType("");
      setMessage("");
    }
  }, [open]);

  const target = targetOptions
    ? targetOptions.find((t) => t.id === targetId) || null
    : targetItem;

  const allowedTypes = target ? getAllowedOfferTypes(target) : [];
  const eligibleItems = allowedTypes.includes("item") ? myItems : [];
  const eligibleServices = allowedTypes.includes("service") ? myServices : [];
  const hasEligible = eligibleItems.length > 0 || eligibleServices.length > 0;

  const offered = useMemo(
    () => [...eligibleItems, ...eligibleServices].find((l) => l.id === offeredId) || null,
    [eligibleItems, eligibleServices, offeredId]
  );

  const wantsLabel = target
    ? target.accepts === "item" ? "an item" :
      target.accepts === "service" ? "a service" : "an item or a service"
    : "";

  const handleConfirm = () => {
    if (!target || !offered || !hours) return;
    onConfirm({
      targetListing: target,
      offeredListing: offered,
      hours,
      work_type: workType,
      message
    });
  };

  const ownerName = target ? displayName(target.offerer_name) : "";

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-orange-600" />
            Start Negotiation
          </DialogTitle>
          <DialogDescription>
            Review what {ownerName} is offering and what they want in return, then pick what you'll offer.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* What the owner is offering */}
          {target && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-orange-500 font-semibold mb-1">
                {ownerName} is offering
              </p>
              <p className="text-sm text-orange-900 font-medium">{target.title}</p>
              <p className="text-xs text-orange-700 mt-1"><OwnerOfferLine item={target} /></p>
              <div className="mt-2 pt-2 border-t border-orange-200">
                <p className="text-xs uppercase tracking-wide text-orange-500 font-semibold mb-1">
                  {ownerName} wants in return
                </p>
                <p className="text-sm text-orange-900">{summarizeReturnPrefs(target)}</p>
              </div>
            </div>
          )}

          {/* Target listing picker (when the owner has several listings) */}
          {targetOptions && targetOptions.length > 0 && (
            <div>
              <Label>Which of their listings are you requesting?</Label>
              <Select
                value={targetId}
                onValueChange={(value) => {
                  setTargetId(value);
                  setOfferedId("");
                  const next = targetOptions.find((t) => t.id === value);
                  if (next) setHours(next.required_hours || null);
                }}
              >
                <SelectTrigger className="w-full mt-2 [&>span]:min-w-0">
                  <SelectValue placeholder="Select a listing..." />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  {targetOptions.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.title} ({formatDuration(t.required_hours)})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Requester's offer — only eligible listings are selectable */}
          <div>
            <Label>What you're offering <span className="text-red-500">*</span></Label>
            {hasEligible ? (
              <Select
                value={offeredId}
                onValueChange={setOfferedId}
              >
                <SelectTrigger className="w-full mt-2 [&>span]:min-w-0">
                  <SelectValue placeholder="Select one of your listings..." />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  {eligibleItems.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>My items</SelectLabel>
                      {eligibleItems.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {eligibleServices.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>My services</SelectLabel>
                      {eligibleServices.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>
            ) : (
              <AlertCircleBox
                target={target}
                hasAnyListings={myItems.length + myServices.length > 0}
              />
            )}
            {!hasEligible && target && myItems.length + myServices.length > 0 && (
              <p className="text-xs text-amber-600 mt-2">
                Your active listings don't match what {ownerName} wants in return ({wantsLabel}).
              </p>
            )}
          </div>

          {offered && (
            <>
              <div>
                <Label>Work time you're offering <span className="text-red-500">*</span></Label>
                <div className="mt-2">
                  <HoursMinutesInput value={hours} onChange={setHours} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {offered.listing_type === "service"
                    ? "Hours of this service you're offering"
                    : "Hours of work you'll do in exchange"}
                </p>
              </div>

              <div>
                <Label htmlFor="start-work-type">Type of work (optional)</Label>
                <Input
                  id="start-work-type"
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  placeholder="e.g., Lawn mowing, Painting, Cleaning"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="start-message">Message (optional)</Label>
                <Textarea
                  id="start-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Introduce yourself and explain your offer..."
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* Plain-language exchange summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">Proposed exchange</p>
                <p className="text-sm text-gray-900 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="max-w-full">
                    <span className="truncate">{offered.listing_type === "service" ? "Your service" : "Your item"}: {offered.title}</span>
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <Badge variant="outline" className="max-w-full">
                    <span className="truncate">For: {target.title}</span>
                  </Badge>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  You're offering your {offered.listing_type === "service" ? "service" : "item"} "{offered.title}" ({formatDuration(hours)}
                  {offered.listing_type === "service" ? " of service" : " of work"}) in exchange for {ownerName}'s {target.listing_type === "service" ? "service" : "item"} "{target.title}".
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!offered || !hours || loading}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Send Offer
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AlertCircleBox({ target, hasAnyListings }) {
  const wants = target
    ? target.accepts === "item" ? "an item" : target.accepts === "service" ? "a service" : "an item or a service"
    : "";
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
      <div className="flex gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-amber-900 font-medium">No eligible listing to offer yet</p>
          <p className="text-xs text-amber-800 mt-1">
            {hasAnyListings
              ? `None of your active listings match what ${target ? displayName(target.offerer_name) : "the owner"} wants (${wants}).`
              : `You need an active ${wants} listing of your own to offer in exchange.`}
          </p>
          <Link to={createPageUrl("CreateItem")} className="text-xs underline text-amber-900 mt-1 inline-block">
            Create a listing →
          </Link>
        </div>
      </div>
    </div>
  );
}