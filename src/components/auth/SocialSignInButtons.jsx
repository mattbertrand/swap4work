import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";

const GoogleMark = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
    <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A11.99 11.99 0 0 0 12 24z" />
    <path fill="#FBBC05" d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z" />
    <path fill="#EA4335" d="M12 4.75c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.95 1.17 15.24 0 12 0A11.99 11.99 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z" />
  </svg>
);

const FacebookMark = () => (
  <svg viewBox="0 0 320 512" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
    <path
      fill="#1877F2"
      d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"
    />
  </svg>
);

const AppleMark = () => (
  <svg viewBox="0 0 384 512" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
    <path
      fill="#000000"
      d="M318.7 268.6c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273c0 26.2 4.8 53.3 14.5 81.2 12.9 36.7 59.8 126.4 104.3 124.9 22.6-.6 38.5-16.1 67.9-16.1 28.4 0 43.2 16.1 68.3 16.1 44.9-.7 87.7-81.7 100-118.5-64.4-30.3-140.3-30.3-140.3-92zM258.8 81.9c21.5-25.6 32.8-55.9 30.5-88.1-29.4 1.9-65.1 19.6-86.1 45.2-19.2 23-32.8 53.5-30.2 83.3 32.6 2.5 63.2-15.2 85.8-40.4z"
    />
  </svg>
);

const MicrosoftMark = () => (
  <svg viewBox="0 0 23 23" className="w-5 h-5 flex-shrink-0" aria-hidden="true">
    <rect x="1" y="1" width="10" height="10" fill="#F25022" />
    <rect x="12" y="1" width="10" height="10" fill="#7FBA00" />
    <rect x="1" y="12" width="10" height="10" fill="#00A4EF" />
    <rect x="12" y="12" width="10" height="10" fill="#FFB900" />
  </svg>
);

const PROVIDERS = [
  { id: "google", label: "Continue with Google", Mark: GoogleMark },
  { id: "facebook", label: "Continue with Facebook", Mark: FacebookMark },
  { id: "apple", label: "Continue with Apple", Mark: AppleMark },
  { id: "microsoft", label: "Continue with Microsoft", Mark: MicrosoftMark },
];

/**
 * Social sign-in buttons — hand off to the platform's OAuth backend
 * (loginWithProvider) and return the member to the page they were on.
 */
export default function SocialSignInButtons({ returnPath }) {
  const [loadingProvider, setLoadingProvider] = useState(null);

  const handleClick = async (id) => {
    setLoadingProvider(id);
    try {
      const target = returnPath || "/";
      const returnUrl = target.startsWith("http")
        ? target
        : window.location.origin + target;
      await base44.auth.loginWithProvider(id, returnUrl);
    } catch {
      setLoadingProvider(null);
    }
  };

  return (
    <div>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-gray-400">or</span>
        </div>
      </div>

      <div className="space-y-2.5">
        {PROVIDERS.map(({ id, label, Mark }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleClick(id)}
            disabled={loadingProvider !== null}
            className="w-full h-11 text-base font-medium flex items-center justify-center gap-3 rounded-xl bg-white border border-gray-300 text-gray-700 shadow-sm hover:bg-gray-50 hover:border-gray-400 transition-colors disabled:opacity-60"
          >
            {loadingProvider === id ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Redirecting…
              </>
            ) : (
              <>
                <Mark /> {label}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}