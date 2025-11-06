import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { MapPin, Clock, Star, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function ItemCard({ item }) {
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
              <Clock className="w-16 h-16 text-orange-300" />
            </div>
          )}
          <div className="absolute top-3 left-3">
            <Badge className="bg-white/90 text-gray-900 border-0 shadow-md">
              {item.category}
            </Badge>
          </div>
          {item.condition && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-500 text-white border-0 shadow-md">
                {item.condition}
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
          </div>

          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{item.location || "Not specified"}</span>
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