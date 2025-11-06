import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft, Clock, MapPin, Star, CheckCircle2, 
  AlertCircle, MessageSquare, Eye, User
} from "lucide-react";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";

export default function ItemDetail() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const urlParams = new URLSearchParams(window.location.search);
  const itemId = urlParams.get('id');

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: item, isLoading } = useQuery({
    queryKey: ['item', itemId],
    queryFn: async () => {
      const items = await base44.entities.Item.filter({ id: itemId });
      return items[0];
    },
    enabled: !!itemId
  });

  const { data: offerer } = useQuery({
    queryKey: ['user', item?.offerer_id],
    queryFn: async () => {
      const users = await base44.entities.User.filter({ id: item.offerer_id });
      return users[0];
    },
    enabled: !!item?.offerer_id
  });

  const handleStartNegotiation = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }

    // Create initial agreement
    const agreement = await base44.entities.Agreement.create({
      item_id: item.id,
      item_title: item.title,
      offerer_id: item.offerer_id,
      offerer_name: item.offerer_name,
      worker_id: user.id,
      worker_name: user.full_name,
      agreed_hours: item.required_hours,
      task_description: item.suggested_tasks || "",
      status: "proposed"
    });

    navigate(createPageUrl(`Chat?agreementId=${agreement.id}`));
  };

  const handleRequestInspection = async () => {
    if (!user) {
      base44.auth.redirectToLogin(window.location.pathname + window.location.search);
      return;
    }

    const agreement = await base44.entities.Agreement.create({
      item_id: item.id,
      item_title: item.title,
      offerer_id: item.offerer_id,
      offerer_name: item.offerer_name,
      worker_id: user.id,
      worker_name: user.full_name,
      agreed_hours: item.required_hours,
      status: "proposed"
    });

    await base44.entities.Message.create({
      agreement_id: agreement.id,
      item_id: item.id,
      from_user_id: user.id,
      from_user_name: user.full_name,
      to_user_id: item.offerer_id,
      text: "I would like to request an in-person inspection of this item before proceeding.",
      message_type: "inspection_request"
    });

    navigate(createPageUrl(`Chat?agreementId=${agreement.id}`));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Item not found</h2>
          <Button onClick={() => navigate(createPageUrl("Browse"))}>
            Browse Items
          </Button>
        </div>
      </div>
    );
  }

  const isOwner = user?.id === item.offerer_id;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 hover:bg-orange-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Images and Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Carousel */}
            <Card className="overflow-hidden border-orange-100 shadow-xl">
              <Carousel className="w-full">
                <CarouselContent>
                  {item.photos?.map((photo, index) => (
                    <CarouselItem key={index}>
                      <div className="aspect-[4/3] bg-gray-100">
                        <img
                          src={photo}
                          alt={`${item.title} - ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                {item.photos?.length > 1 && (
                  <>
                    <CarouselPrevious className="left-4" />
                    <CarouselNext className="right-4" />
                  </>
                )}
              </Carousel>
            </Card>

            {/* Description */}
            <Card className="border-orange-100 shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Description</h2>
                <p className="text-gray-700 whitespace-pre-line">{item.description}</p>
              </CardContent>
            </Card>

            {/* Suggested Tasks */}
            {item.suggested_tasks && (
              <Card className="border-orange-100 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Suggested Tasks</h2>
                  <p className="text-gray-700 whitespace-pre-line">{item.suggested_tasks}</p>
                </CardContent>
              </Card>
            )}

            {/* Offerer Terms */}
            {item.offerer_terms && (
              <Card className="border-orange-100 shadow-lg">
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">Terms & Conditions</h2>
                  <p className="text-gray-700 whitespace-pre-line">{item.offerer_terms}</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Sticky Info Card */}
          <div className="lg:sticky lg:top-8 h-fit">
            <Card className="border-orange-100 shadow-xl">
              <CardContent className="p-6 space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-3">{item.title}</h1>
                  <div className="flex gap-2 mb-4">
                    <Badge className="bg-orange-100 text-orange-700">
                      {item.category}
                    </Badge>
                    <Badge className="bg-green-100 text-green-700">
                      {item.condition}
                    </Badge>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border-2 border-orange-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 font-medium">Required Work</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-orange-600" />
                    <span className="text-4xl font-bold text-gray-900">{item.required_hours}</span>
                    <span className="text-xl text-gray-600">hours</span>
                  </div>
                  {item.estimated_value > 0 && (
                    <div className="mt-3 text-sm text-gray-600">
                      Est. value: ${item.estimated_value}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-700">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <span>{item.location}</span>
                  </div>
                </div>

                {/* Offerer Info */}
                {offerer && (
                  <Card className="bg-gray-50 border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-lg">
                            {offerer.full_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-gray-900">{offerer.full_name}</p>
                            {offerer.id_verified && (
                              <CheckCircle2 className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                          {offerer.rating > 0 && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-medium">{offerer.rating.toFixed(1)}</span>
                              <span className="text-sm text-gray-500">({offerer.total_ratings})</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Action Buttons */}
                {!isOwner && (
                  <div className="space-y-3">
                    <Button
                      onClick={handleStartNegotiation}
                      className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
                    >
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Start Negotiation
                    </Button>
                    <Button
                      onClick={handleRequestInspection}
                      variant="outline"
                      className="w-full h-12"
                    >
                      <Eye className="w-5 h-5 mr-2" />
                      Request Inspection
                    </Button>
                  </div>
                )}

                {isOwner && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                    <p className="text-sm font-medium text-blue-900">
                      This is your listing
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}