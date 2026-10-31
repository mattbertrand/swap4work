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
import { useLanguage } from "@/i18n/LanguageContext";

// Start-negotiation dialog. Clearly separates:
//   1. what the listing owner is offering (the target listing),
//   2. what the owner wants in return (their saved preferences),
//   3. what the requester is offering (one of their own eligible listings).
// Only listings of a type the owner accepts are selectable. Preferences are
// guidance — the owner still accepts or rejects the proposal.

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
  const { t } = useLanguage();
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

  const wantsLabel = (item) =>
    item?.accepts === "item" ? t("neg.wants_item") :
      item?.accepts === "service" ? t("neg.wants_service") : t("neg.wants_either");

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
            {t("neg.start_title")}
          </DialogTitle>
          <DialogDescription>
            {t("neg.start_desc", { name: ownerName })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* What the owner is offering */}
          {target && (
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <p className="text-xs uppercase tracking-wide text-orange-500 font-semibold mb-1">
                {t("neg.offering_by", { name: ownerName })}
              </p>
              <p className="text-sm text-orange-900 font-medium">{target.title}</p>
              <p className="text-xs text-orange-700 mt-1">
                {target.listing_type === "service"
                  ? t("neg.up_to_service", { duration: formatDuration(target.required_hours) })
                  : t("neg.item_asking", { duration: formatDuration(target.required_hours) })}
              </p>
              <div className="mt-2 pt-2 border-t border-orange-200">
                <p className="text-xs uppercase tracking-wide text-orange-500 font-semibold mb-1">
                  {t("neg.wants_return", { name: ownerName })}
                </p>
                <p className="text-sm text-orange-900">{summarizeReturnPrefs(target)}</p>
              </div>
            </div>
          )}

          {/* Target listing picker (when the owner has several listings) */}
          {targetOptions && targetOptions.length > 0 && (
            <div>
              <Label>{t("neg.which_listing")}</Label>
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
                  <SelectValue placeholder={t("neg.select_listing")} />
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
            <Label>{t("neg.what_offering")} <span className="text-red-500">*</span></Label>
            {hasEligible ? (
              <Select
                value={offeredId}
                onValueChange={setOfferedId}
              >
                <SelectTrigger className="w-full mt-2 [&>span]:min-w-0">
                  <SelectValue placeholder={t("neg.select_one_of_yours")} />
                </SelectTrigger>
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
                  {eligibleItems.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>{t("neg.my_items")}</SelectLabel>
                      {eligibleItems.map((l) => (
                        <SelectItem key={l.id} value={l.id}>{l.title}</SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                  {eligibleServices.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>{t("neg.my_services")}</SelectLabel>
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
                wantsLabel={wantsLabel(target)}
                hasAnyListings={myItems.length + myServices.length > 0}
              />
            )}
            {!hasEligible && target && myItems.length + myServices.length > 0 && (
              <p className="text-xs text-amber-600 mt-2">
                {t("neg.no_match_note", { name: ownerName, wants: wantsLabel(target) })}
              </p>
            )}
          </div>

          {offered && (
            <>
              <div>
                <Label>{t("neg.work_time_offering")} <span className="text-red-500">*</span></Label>
                <div className="mt-2">
                  <HoursMinutesInput value={hours} onChange={setHours} />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {offered.listing_type === "service"
                    ? t("neg.hours_of_service")
                    : t("neg.hours_of_work")}
                </p>
              </div>

              <div>
                <Label htmlFor="start-work-type">{t("neg.work_type_optional")}</Label>
                <Input
                  id="start-work-type"
                  value={workType}
                  onChange={(e) => setWorkType(e.target.value)}
                  placeholder={t("neg.work_type_ph")}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="start-message">{t("neg.message_optional")}</Label>
                <Textarea
                  id="start-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("neg.message_ph")}
                  rows={3}
                  className="mt-2"
                />
              </div>

              {/* Plain-language exchange summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 font-semibold mb-1">{t("neg.proposed_exchange")}</p>
                <p className="text-sm text-gray-900 flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="max-w-full">
                    <span className="truncate">
                      {offered.listing_type === "service" ? t("neg.your_service") : t("neg.your_item")}: {offered.title}
                    </span>
                  </Badge>
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <Badge variant="outline" className="max-w-full">
                    <span className="truncate">{t("neg.for")}: {target.title}</span>
                  </Badge>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {t("neg.summary", {
                    offered: offered.title,
                    duration: formatDuration(hours),
                    unit: offered.listing_type === "service" ? t("neg.unit_service") : t("neg.unit_work"),
                    target: target.title,
                    owner: ownerName
                  })}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel")}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!offered || !hours || loading}
            className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t("neg.sending")}
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                {t("neg.send_offer")}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AlertCircleBox({ target, wantsLabel, hasAnyListings }) {
  const { t } = useLanguage();
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-2">
      <div className="flex gap-2">
        <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm text-amber-900 font-medium">{t("neg.no_eligible_title")}</p>
          <p className="text-xs text-amber-800 mt-1">
            {hasAnyListings
              ? t("neg.no_eligible_match", { name: target ? displayName(target.offerer_name) : t("neg.the_owner"), wants: wantsLabel })
              : t("neg.no_eligible_need", { wants: wantsLabel })}
          </p>
          <Link to={createPageUrl("CreateItem")} className="text-xs underline text-amber-900 mt-1 inline-block">
            {t("neg.create_listing")}
          </Link>
        </div>
      </div>
    </div>
  );
}