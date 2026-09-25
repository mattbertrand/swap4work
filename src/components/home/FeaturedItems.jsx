import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import ItemCard from "@/components/browse/ItemCard";
import { Package, ArrowRight } from "lucide-react";

export default function FeaturedItems() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ["featuredItems"],
    queryFn: () => base44.entities.Item.filter({ status: "active", listing_type: "item" }, "-created_date", 6),
  });

  const visible = items.filter((i) => !i.is_hidden);

  return (
    <div className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
          <div className="text-center md:text-left">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Explore Exchanges</h2>
            <p className="text-gray-600">
              Every item listing shows the work its owner is looking for in return.
            </p>
          </div>
          <Link to={createPageUrl("Browse")} className="hidden md:block">
            <Button variant="outline">
              View All
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
          <div className="text-center py-16 bg-white rounded-3xl border-2 border-dashed border-orange-200">
            <Package className="w-16 h-16 mx-auto mb-4 text-orange-300" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Be the first to list something
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              The marketplace fills up as people like you post items — it only
              takes a few minutes to create the first listing.
            </p>
            <Link to={createPageUrl("CreateItem")}>
              <Button className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700">
                List an Item
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((item) => (
              <ItemCard key={item.id} item={item} showDistance={false} />
            ))}
          </div>
        )}

        <div className="text-center mt-8 md:hidden">
          <Link to={createPageUrl("Browse")}>
            <Button className="bg-gradient-to-r from-orange-500 to-amber-600">
              View All Items
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}