import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Clock, CheckCircle2, AlertCircle, Package, Calendar, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow, parseISO } from "date-fns";
import OwnerReputation from "@/components/browse/OwnerReputation";

// Helper to extract only city and state (never street) from location string
const getCityState = (location) => {
  if (!location) return "Location not specified";
  const parts = location.split(',').map(p => p.trim());
  const cleanParts = parts.map(p => p.replace(/\d{5}(-\d{4})?/g, '').trim()).filter(p => p.length > 0);
  if (cleanParts.length === 0) return location;
  if (cleanParts.length === 1) return cleanParts[0];
  const state = cleanParts[cleanParts.length - 1];
  const city = cleanParts[cleanParts.length - 2];
  return `${city}, ${state}`;
};

export default function ItemCard({ item, showDistance, userAgreements = [] }) {
  // Find agreement related to this item
  const relatedAgreement = userAgreements.find(a => a.item_id === item.id);

  // Determine negotiation status badge
  const getNegotiationBadge = () => {
    if (!relatedAgreement) return null;

    const statusConfig = {
      proposed: { color: 'bg-yellow-500', icon: AlertCircle, label: 'Pending' },
      locked: { color: 'bg-blue-500', icon: Clock, label: 'In Progress' },
      in_progress: { color: 'bg-purple-500', icon: Clock, label: 'In Progress' },
      completed: { color: 'bg-green-500', icon: CheckCircle2, label: 'Completed' },
      cancelled: { color: 'bg-red-500', icon: AlertCircle, label: 'Cancelled' },
      disputed: { color: 'bg-red-500', icon: AlertCircle, label: 'Disputed' }
    };

    const config = statusConfig[relatedAgreement.status];
    if (!config) return null;

    const Icon = config.icon;

    return (
      <div className={`absolute top-3 left-3 ${config.color} text-white px-2 py-1 rounded-lg shadow-lg flex items-center gap-1 text-xs font-semibold`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </div>
    );
  };

  return (
    <Link to={createPageUrl(`ItemDetail?id=${item.id}`)} className="block h-full">
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-orange-100 bg-white h-full flex flex-col">
        <div className="relative h-52 overflow-hidden bg-gray-100">
          {item.photos && item.photos.length > 0 ? (
            <img
              src={item.photos[0]}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange-100 to-amber-100">
              <Package className="w-16 h-16 text-orange-300" />
            </div>
          )}

          {/* Negotiation Status Badge */}
          {getNegotiationBadge()}

          {/* Category Badge */}
          {!relatedAgreement && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-white/90 text-gray-900 border-0 shadow-md">
                {item.category}
              </Badge>
            </div>
          )}

          {/* Condition Badge */}
          {item.condition && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-500 text-white border-0 shadow-md">
                {item.condition}
              </Badge>
            </div>
          )}

          {/* Distance Badge */}
          {showDistance && item.distance && (
            <div className="absolute bottom-3 right-3">
              <Badge className="bg-orange-500 text-white border-0 shadow-md">
                <MapPin className="w-3 h-3 mr-1" />
                {item.distance} mi
              </Badge>
            </div>
          )}
        </div>

        <div className="p-5 flex flex-col flex-1">
          <h3 className="text-lg font-bold text-gray-900 mb-1.5 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {item.title}
          </h3>

          <p className="text-sm text-gray-600 mb-3 line-clamp-1">
            {item.description}
          </p>

          {/* The exchange: what the owner is looking for */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl px-3 py-2.5 mb-3">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-semibold mb-0.5">
              Looking for
            </p>
            <div className="flex items-center gap-2 text-orange-600 font-bold">
              <Clock className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">
                {item.required_hours} {item.required_hours === 1 ? "hour" : "hours"} of work
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
            <div className="flex items-center gap-1 min-w-0">
              <MapPin className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{getCityState(item.location)}</span>
            </div>
            {item.created_date && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Calendar className="w-3 h-3" />
                <span className="text-xs">
                  {formatDistanceToNow(parseISO(item.created_date.endsWith('Z') ? item.created_date : item.created_date + 'Z'), { addSuffix: true })}
                </span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-xs text-gray-600 font-medium block truncate">
                {item.offerer_name}
              </span>
              <OwnerReputation rating={item.offerer_rating} totalRatings={item.offerer_total_ratings} />
            </div>
            <span className="text-sm font-semibold text-orange-600 flex items-center gap-1 transition-all">
              View Listing
              <ArrowRight className="w-4 h-4" />
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}