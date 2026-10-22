import React from "react";
import { Badge } from "@/components/ui/badge";
import { Package, Briefcase, Layers } from "lucide-react";
import { getReturnTypes } from "@/lib/exchangePrefs";

// Compact "what this owner wants in return" display for listing cards.
function TypeBlock({ anyFlag, categories, custom, noun }) {
  if (anyFlag) return `any ${noun}`;
  const parts = [];
  if (Array.isArray(categories) && categories.length) parts.push(...categories);
  if (custom) parts.push(custom);
  return parts.length ? parts.join(", ") : `any ${noun}`;
}

export default function ReturnPrefsSummary({ item, className = "" }) {
  if (!item) return null;
  const want = getReturnTypes(item);

  const badge =
    want === "item" ? (
      <Badge className="bg-orange-100 text-orange-700">
        <Package className="w-3 h-3 mr-1" /> Items
      </Badge>
    ) : want === "service" ? (
      <Badge className="bg-blue-100 text-blue-700">
        <Briefcase className="w-3 h-3 mr-1" /> Services
      </Badge>
    ) : (
      <Badge className="bg-purple-100 text-purple-700">
        <Layers className="w-3 h-3 mr-1" /> Items or services
      </Badge>
    );

  let detail = "";
  if (want === "item") {
    detail = TypeBlock({ anyFlag: item.desired_items_any, categories: item.desired_item_categories, custom: item.desired_item_custom, noun: "item" });
  } else if (want === "service") {
    detail = TypeBlock({ anyFlag: item.desired_services_any, categories: item.desired_service_categories, custom: item.desired_service_custom, noun: "service" });
  } else {
    const itemPart = TypeBlock({ anyFlag: item.desired_items_any, categories: item.desired_item_categories, custom: item.desired_item_custom, noun: "items" });
    const servicePart = TypeBlock({ anyFlag: item.desired_services_any, categories: item.desired_service_categories, custom: item.desired_service_custom, noun: "services" });
    detail = `${itemPart} · ${servicePart}`;
  }
  const isDefaultOpen = detail === "any items · any services";

  return (
    <div className={className}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Wants in return:</span>
        {badge}
      </div>
      {!isDefaultOpen && detail && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{detail}</p>
      )}
    </div>
  );
}