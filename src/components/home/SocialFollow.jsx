import React from "react";
import { Facebook, Instagram } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SocialFollow() {
  return (
    <div className="bg-white border-t border-orange-100 py-10 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Follow Swap4Work</h3>
        <p className="text-sm text-gray-500 mb-6">Stay updated on new listings and community news.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="https://www.facebook.com/profile.php?id=61594181534725"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button size="lg" className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white px-8 py-6 h-auto w-full sm:w-auto">
              <Facebook className="w-5 h-5 mr-2" />
              Follow us on Facebook
            </Button>
          </a>
          <a
            href="https://www.instagram.com/swap4work/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button
              size="lg"
              variant="outline"
              // className="border-2 border-orange-200 text-orange-700 hover:bg-orange-50 text-lg px-8 py-6 h-auto w-full sm:w-auto"
              className="bg-[#1877F2] hover:bg-[#1877F2]/90 text-white px-8 py-6 h-auto w-full sm:w-auto"
            >
              <Instagram className="w-5 h-5 mr-2" />
              Follow us on Instagram
            </Button>
          </a>
        </div>
      </div>
    </div>
  );
}