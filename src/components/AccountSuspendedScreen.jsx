import React from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { ShieldAlert, LogOut } from "lucide-react";

// Full-screen gate shown to suspended/banned members (enforced by AuthContext)
export default function AccountSuspendedScreen({ banned = false }) {
  const handleSignOut = () => {
    base44.auth.logout("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-orange-100 p-8 text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-8 h-8 text-orange-600" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {banned ? "Your account has been removed" : "Your account is suspended"}
        </h1>
        <p className="text-gray-600 mb-6">
          {banned
            ? "This account no longer has access to Swap4Work. If you believe this is a mistake, please contact support."
            : "Your access to Swap4Work is temporarily restricted. If you believe this is a mistake, please contact support."}
        </p>
        <Button
          onClick={handleSignOut}
          className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}