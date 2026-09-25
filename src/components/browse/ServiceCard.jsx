import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Clock, MapPin } from "lucide-react";
import OwnerReputation from "@/components/browse/OwnerReputation";
import { formatPublicLocation } from "@/lib/location";

// Shared service listing card — used by Browse Services and the homepage
// Explore Services section.
export default function ServiceCard({ service }) {
  const publicLocation = formatPublicLocation(service.location);

  return (
    <Link to={createPageUrl(`ItemDetail?id=${service.id}`)}>
      <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border-blue-100 bg-white h-full">
        <CardContent className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <Briefcase className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                {service.title}
              </h3>
              <Badge className="bg-blue-100 text-blue-700">
                {service.category}
              </Badge>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {service.description}
          </p>

          <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200">
            <div className="flex items-center gap-2 text-blue-600 font-bold">
              <Clock className="w-5 h-5" />
              <span>{service.required_hours}h offered</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500">Wants in exchange:</span>
              <Badge variant="outline" className={
                service.accepts === "item" ? "border-orange-300 text-orange-700" :
                service.accepts === "service" ? "border-blue-300 text-blue-700" :
                "border-purple-300 text-purple-700"
              }>
                {service.accepts === "both" ? "Items & Services" : service.accepts === "item" ? "Items" : "Services"}
              </Badge>
            </div>

            <div className="flex items-center gap-1 text-sm text-gray-500">
              <MapPin className="w-4 h-4" />
              <span className="truncate">
                {service.distance ? `${service.distance} mi away` : (publicLocation || "Location not specified")}
              </span>
            </div>

            <div className="flex items-center justify-between gap-2 pt-2 mt-2 border-t border-gray-100">
              <span className="text-xs text-gray-600 font-medium truncate">
                {service.offerer_name}
              </span>
              <OwnerReputation rating={service.offerer_rating} totalRatings={service.offerer_total_ratings} />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}