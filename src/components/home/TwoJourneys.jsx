import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Package, Briefcase, ArrowRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function TwoJourneys() {
  const { t } = useLanguage();

  const journeys = [
  {
    icon: Package,
    title: t("home.journey_have_title"),
    sub: t("home.journey_have_sub"),
    steps: [
      t("home.journey_have_step1"),
      t("home.journey_have_step2"),
      t("home.journey_have_step3"),
      t("home.journey_have_step4"),
      t("home.journey_have_step5"),
    ],
    cta: { label: t("nav.list_an_item"), url: createPageUrl("CreateItem") },
    theme: {
      gradient: "from-orange-50 to-amber-50",
      border: "border-orange-200 hover:border-orange-400",
      iconBg: "bg-white text-orange-600",
      step: "bg-orange-500",
      ctaClass: "bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700",
    },
  },
  {
    icon: Briefcase,
    title: t("home.journey_skills_title"),
    sub: t("home.journey_skills_sub"),
    steps: [
      t("home.journey_skills_step1"),
      t("home.journey_skills_step2"),
      t("home.journey_skills_step3"),
      t("home.journey_skills_step4"),
      t("home.journey_skills_step5"),
    ],
    cta: { label: t("nav.browse_items"), url: createPageUrl("Browse") },
    theme: {
      gradient: "from-blue-50 to-cyan-50",
      border: "border-blue-200 hover:border-blue-400",
      iconBg: "bg-white text-blue-600",
      step: "bg-blue-500",
      ctaClass: "bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700",
    },
  },
];

  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t("home.journeys_title")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("home.journeys_sub")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {journeys.map((j, i) => (
            <motion.div
              key={j.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: i * 0.1 }}
              className="h-full"
            >
              <div className={`h-full bg-gradient-to-br ${j.theme.gradient} border-2 ${j.theme.border} rounded-3xl p-8 transition-all duration-300 hover:shadow-xl flex flex-col`}>
                <div className={`w-14 h-14 rounded-2xl shadow-sm flex items-center justify-center mb-5 ${j.theme.iconBg}`}>
                  <j.icon className="w-7 h-7" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{j.title}</h3>
                <p className="text-gray-600 mb-6">{j.sub}</p>

                <ol className="space-y-3 mb-8">
                  {j.steps.map((step, k) => (
                    <li key={step} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full ${j.theme.step} text-white text-xs font-bold flex items-center justify-center flex-shrink-0`}>
                        {k + 1}
                      </span>
                      <span className="text-sm text-gray-700">{step}</span>
                    </li>
                  ))}
                </ol>

                <Link to={j.cta.url} className="mt-auto">
                  <Button size="lg" className={`w-full text-base h-12 ${j.theme.ctaClass}`}>
                    {j.cta.label}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}