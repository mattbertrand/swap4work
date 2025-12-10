import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MapPin, Star, Mail, Phone, Clock, Briefcase } from "lucide-react";

export default function WorkerProfile() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const workerId = urlParams.get('id');

  const { data: worker, isLoading } = useQuery({
    queryKey: ['worker', workerId],
    queryFn: async () => {
      if (!workerId) return null;
      const results = await base44.entities.Worker.filter({ id: workerId });
      return results[0];
    },
    enabled: !!workerId
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!worker) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col p-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Worker Not Found</h2>
        <Button onClick={() => navigate(createPageUrl("BrowseUsers"))}>
          Back to Browse
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)} 
          className="mb-6 hover:bg-gray-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left Column - Photo & Stats */}
          <Card className="md:col-span-1 h-fit border-blue-100 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="relative inline-block mb-4">
                {worker.photo_url ? (
                  <img
                    src={worker.photo_url}
                    alt={worker.full_name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md mx-auto"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-md">
                    <span className="text-white font-bold text-4xl">
                      {worker.full_name?.[0]?.toUpperCase()}
                    </span>
                  </div>
                )}
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-1">{worker.full_name}</h2>
              <div className="flex items-center justify-center gap-1 text-gray-500 mb-4">
                <MapPin className="w-4 h-4" />
                <span>{worker.location}</span>
              </div>

              <div className="flex justify-center gap-2 mb-6">
                <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full text-yellow-700 text-sm font-medium">
                  <Star className="w-4 h-4 mr-1 fill-yellow-500 text-yellow-500" />
                  {worker.rating?.toFixed(1) || "New"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 py-4 border-t border-gray-100">
                <div>
                  <div className="text-2xl font-bold text-blue-600">{worker.completed_trades || 0}</div>
                  <div className="text-xs text-gray-500">Trades</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{worker.hours_completed || 0}</div>
                  <div className="text-xs text-gray-500">Hours</div>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="space-y-2 mt-6">
                {worker.email && (
                  <a href={`mailto:${worker.email}`} className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    <Mail className="w-4 h-4" />
                    Email Worker
                  </a>
                )}
                {worker.phone && (
                  <a href={`tel:${worker.phone}`} className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-blue-600 transition-colors">
                    <Phone className="w-4 h-4" />
                    Call Worker
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Details */}
          <Card className="md:col-span-2 border-blue-100 shadow-lg">
            <CardContent className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  About
                </h3>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">
                  {worker.bio || "No bio available."}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Star className="w-5 h-5 text-blue-500" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {worker.skills ? (
                    worker.skills.split(',').map((skill, i) => (
                      <Badge key={i} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 px-3 py-1">
                        {skill.trim()}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-500 italic">No skills listed</span>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-500" />
                  Availability
                </h3>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                  <p className="text-gray-600 text-sm">
                    Contact this worker to check their current availability and schedule a trade.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}