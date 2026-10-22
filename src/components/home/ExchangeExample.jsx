import React from "react";
import { motion } from "framer-motion";
import { Bike, Clock, Hammer, ArrowLeftRight } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function ExchangeExample() {
  const { t } = useLanguage();

  const steps = [
    { icon: Bike, color: "bg-orange-100 text-orange-600", title: t("home.example_bike_title"), sub: t("home.example_bike_sub") },
    { icon: Clock, color: "bg-blue-100 text-blue-600", title: t("home.example_hours_title"), sub: t("home.example_hours_sub") },
    { icon: Hammer, color: "bg-amber-100 text-amber-600", title: t("home.example_done_title"), sub: t("home.example_done_sub") },
    { icon: ArrowLeftRight, color: "bg-green-100 text-green-600", title: t("home.example_swap_title"), sub: t("home.example_swap_sub") },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
      className="bg-white rounded-3xl border-2 border-orange-100 shadow-xl p-6 md:p-8 max-w-md mx-auto w-full"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6 text-center">
        {t("home.example_label")}
      </p>
      <div>
        {steps.map((s, i) => (
          <div key={s.title} className="flex gap-4">
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
                <s.icon className="w-6 h-6" />
              </div>
              {i < steps.length - 1 && (
                <div className="w-0.5 flex-1 min-h-6 bg-gradient-to-b from-orange-200 to-orange-100 my-1 rounded-full" />
              )}
            </div>
            <div className="pb-7">
              <p className="font-bold text-gray-900 leading-snug">{s.title}</p>
              <p className="text-sm text-gray-500">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}