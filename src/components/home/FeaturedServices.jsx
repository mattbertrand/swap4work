import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import ServiceCard from "@/components/browse/ServiceCard";
import { Briefcase, ArrowRight } from "lucide-react";

export default function FeaturedServices() {
  const { data: services = [], isLoading } = useQuery({
    queryKey: ["featuredServices"],
    queryFn: () => base44.entities.Item.filter({ status: "active", listing_type: "service" }, "-created_date", 3),
  });

  const visible = services.filter((s) => !s.is_hidden);

  return (
    <div className="py-16 px-4 bg-gradient-to-b from-white to-blue-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Explore Services</h2>
            <p className="text-gray-600">
              See the skills and services people are offering in exchange for something they need.
            </p>
          </div>
          <Link to={createPageUrl("BrowseServices")} className="hidden md:block">
            <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
              Browse Services
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-96 animate-pulse" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-blue-200">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-blue-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No services listed yet
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Skilled people make this marketplace work — share what you're
              good at and be the first to offer a service.
            </p>
            <Link to={createPageUrl("CreateItem")}>
              <Button className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700">
                Offer a Service
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:hidden">
          <Link to={createPageUrl("BrowseServices")}>
            <Button className="bg-gradient-to-r from-blue-500 to-cyan-600">
              Browse Services
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}