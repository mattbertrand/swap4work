import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Users } from "lucide-react";
import ExchangeExample from "./ExchangeExample";

export default function HomeHero() {
  return (
    <div className="bg-gradient-to-b from-white to-orange-50 py-16 md:py-24 px-4">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
        <div className="text-center lg:text-left">
          <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-6">
            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-3 py-1">
              <MapPin className="w-3.5 h-3.5 mr-1.5" />
              Local — within 50 miles
            </Badge>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 px-3 py-1">
              <Users className="w-3.5 h-3.5 mr-1.5" />
              People &amp; skills near you
            </Badge>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 mb-6 leading-tight">
            Trade What You Have for{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">
              What You Need
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
            Turn things you no longer need — and the skills you have — into useful
            exchanges with people nearby. Your item for their time and work.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-6">
            <Link to={createPageUrl("Browse")}>
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-lg px-8 py-6 h-auto w-full sm:w-auto">
                Browse Items
              </Button>
            </Link>
            <Link to={createPageUrl("CreateItem")}>
              <Button size="lg" variant="outline" className="border-orange-300 text-orange-600 hover:bg-orange-50 text-lg px-8 py-6 h-auto w-full sm:w-auto">
                List an Item
              </Button>
            </Link>
          </div>

          <p className="text-sm text-gray-500">
            New to Swap4Work?{" "}
            <Link to={createPageUrl("HowItWorks")} className="text-orange-600 font-semibold underline hover:text-orange-700">
              See how it works →
            </Link>
          </p>
        </div>

        <ExchangeExample />
      </div>
    </div>
  );
}