import React, { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthModal from "./AuthModal";

export default function GuestBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  if (dismissed) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-orange-500 to-amber-600 text-white px-4 py-2.5 flex items-center justify-between gap-4">
        <p className="text-sm font-medium">
          You're browsing as a guest — create an account to start exchanging.
        </p>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            size="sm"
            onClick={() => setModalOpen(true)}
            className="bg-white text-orange-600 hover:bg-orange-50 h-7 text-xs font-semibold"
          >
            <UserPlus className="w-3 h-3 mr-1" />
            Sign Up
          </Button>
          <button
            onClick={() => setDismissed(true)}
            className="text-white/80 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <AuthModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}