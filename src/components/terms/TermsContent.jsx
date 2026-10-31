import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, ShieldCheck, Clock, Users, Gavel } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";
import { termsEn, termsEs } from "@/i18n/terms";

export const TERMS_VERSION = termsEn.version;

const SUMMARY_ICONS = [Users, Clock, Gavel];

// Shared Terms content — rendered by the /terms page and, in the same layout,
// inside the in-app overlay used by Complete Profile. The legal text itself
// lives in @/i18n/terms so it can be reviewed per language.
export default function TermsContent() {
  const { lang } = useLanguage();
  const terms = lang === "es" ? termsEs : termsEn;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <ScrollText className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
          {terms.title}
        </h1>
        <p className="text-gray-600 mb-4">
          {terms.subtitle}
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline" className="text-orange-700 border-orange-300">
            {terms.version_label.replace("{version}", terms.version)}
          </Badge>
          <Badge variant="outline" className="text-orange-700 border-orange-300">
            {terms.effective_label.replace("{date}", terms.effective_date)}
          </Badge>
        </div>
      </div>

      {/* Quick Summary */}
      <Card className="border-orange-200 shadow-lg mb-8 bg-white/90">
        <CardContent className="p-6">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-orange-600" />
            {terms.summary_title}
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
            {terms.summary.map((text, i) => {
              const Icon = SUMMARY_ICONS[i];
              return (
                <div key={i} className="flex items-start gap-2">
                  <Icon className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p>{text}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Full Terms */}
      <Card className="border-orange-100 shadow-xl bg-white">
        <CardContent className="p-6 md:p-8">
          <div className="space-y-8">
            {terms.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h2>
                <div className="space-y-3">
                  {section.body.map((paragraph, i) => (
                    <p key={i} className="text-sm text-gray-700 leading-relaxed">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-orange-100 text-xs text-gray-500 text-center">
            <p>
              {terms.footer.replace("{version}", terms.version).replace("{date}", terms.effective_date)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}