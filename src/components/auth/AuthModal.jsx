import React from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Briefcase } from "lucide-react";

export default function AuthModal({ open, onClose, message }) {
  const handleLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  const handleSignUp = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">Join Swap4Work</DialogTitle>
          <DialogDescription className="text-center text-base">
            {message || "Create an account or log in to continue"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Button
            onClick={handleSignUp}
            className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-base"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Create Account
          </Button>
          <Button
            onClick={handleLogin}
            variant="outline"
            className="w-full h-11 text-base"
          >
            <LogIn className="w-5 h-5 mr-2" />
            Log In
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 pb-2">
          By signing up, you agree to our rules for fair exchanges and safe interactions.
          You must be at least 18 years old to use this platform.
        </p>
      </DialogContent>
    </Dialog>
  );
}