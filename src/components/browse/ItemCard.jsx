import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Clock, CheckCircle2, AlertCircle, Package, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatDistanceToNow, parseISO } from "date-fns";

// Helper to extract only city and state (never street) from location string
const getCityState = (location) => {
  if (!location) return "Location not specified";
  const parts = location.split(',').map(p => p.trim());
  // Last part: strip ZIP, get state abbr
  const lastRaw = parts[parts.length - 1].replace(/\d{5}(-\d{4})?/g, '').trim();
  if (parts.length === 1) return lastRaw || location;
  // City is always second-to-last (handles "Street, City, State ZIP" and "City, State ZIP")
  const city = parts[parts.length - 2];
  return lastRaw ? `${city}, ${lastRaw}` : city;
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
      cancelled: { color: 'bg-red-500', icon: AlertCircle, label: 'Failed' },
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
    <Link to={createPageUrl(`ItemDetail?id=${item.id}`)}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-orange-100 bg-white">
        <div className="relative h-56 overflow-hidden bg-gray-100">
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
        
        <div className="p-5">
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-1 group-hover:text-orange-600 transition-colors">
            {item.title}
          </h3>
          
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {item.description}
          </p>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-orange-600 font-bold text-lg">
              <Clock className="w-5 h-5" />
              <span>{item.required_hours} hours</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Calendar className="w-3 h-3" />
              <span>{formatDistanceToNow(parseISO(item.created_date.endsWith('Z') ? item.created_date : item.created_date + 'Z'), { addSuffix: true })}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{getCityState(item.location)}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs">Verified</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}