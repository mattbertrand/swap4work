import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Construction, ArrowLeft } from "lucide-react";

export default function ComingSoon() {
  const urlParams = new URLSearchParams(window.location.search);
  const pageTitle = urlParams.get("page");

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="text-center max-w-md py-16">
        <div className="w-24 h-24 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Construction className="w-12 h-12 text-orange-500" />
        </div>
        {pageTitle && (
          <p className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-2">
            {pageTitle}
          </p>
        )}
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          This Page Is Under Construction
        </h1>
        <p className="text-gray-600 mb-8">
          We're working on this section and it will be available soon. Thanks for your patience!
        </p>
        <Button asChild className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 px-8">
          <Link to={createPageUrl("Home")} className="flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}