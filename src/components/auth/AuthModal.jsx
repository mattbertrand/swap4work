import React from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus, Briefcase } from "lucide-react";
import { authSignupUrl, authLoginUrl } from "@/lib/authNavigation";
import { useLanguage } from '@/i18n/LanguageContext';

export default function AuthModal({ open, onClose, message }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const nextPath = window.location.pathname + window.location.search;

  const handleLogin = () => {
    onClose();
    navigate(authLoginUrl(nextPath));
  };

  const handleSignUp = () => {
    onClose();
    navigate(authSignupUrl(nextPath));
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
          <DialogTitle className="text-center text-xl">{t('auth.join')}</DialogTitle>
          <DialogDescription className="text-center text-base">
            {message || t('listings.auth_continue')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <Button
            onClick={handleSignUp}
            className="w-full h-11 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-base"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            {t('auth.create_account_btn')}
          </Button>
          <Button
            onClick={handleLogin}
            variant="outline"
            className="w-full h-11 text-base"
          >
            <LogIn className="w-5 h-5 mr-2" />
            {t('nav.log_in')}
          </Button>
        </div>

        <p className="text-xs text-center text-gray-500 pb-2">
          {t('auth.signup_terms')}
        </p>
      </DialogContent>
    </Dialog>
  );
}