import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowRight, Scale } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function WhatCouldYouTrade() {
  const { t } = useLanguage();

  const examples = [
    { emoji: "🚲", item: t("home.wct_bicycle"), service: t("home.wct_yard_work") },
    { emoji: "🪑", item: t("home.wct_furniture"), service: t("home.wct_moving") },
    { emoji: "💻", item: t("home.wct_electronics"), service: t("home.wct_computer") },
    { emoji: "🛠️", item: t("home.wct_tools"), service: t("home.wct_home_improvement") },
    { emoji: "🎸", item: t("home.wct_instrument"), service: t("home.wct_music_lessons") },
    { emoji: "📷", item: t("home.wct_camera"), service: t("home.wct_car_cleaning") },
    { emoji: "🏕️", item: t("home.wct_camping"), service: t("home.wct_project") },
    { emoji: "📚", item: t("home.wct_books"), service: t("home.wct_tutoring") },
  ];

  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            {t("home.wct_title")}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t("home.wct_sub")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {examples.map((ex, i) => (
            <motion.div
              key={ex.item}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
              className="rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-5 text-center hover:shadow-md transition-shadow"
            >
              <div className="text-3xl mb-3">{ex.emoji}</div>
              <p className="font-bold text-gray-900 mb-2">{ex.item}</p>
              <div className="flex items-center justify-center gap-2 text-sm">
                <ArrowRight className="w-4 h-4 text-orange-400" />
                <span className="text-orange-700 font-semibold">{ex.service}</span>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-sm text-gray-500 text-center mt-8 max-w-2xl mx-auto flex items-start justify-center gap-2">
          <Scale className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>
            {t("home.wct_disclaimer_a")}{" "}
            <Link to={createPageUrl("Terms")} className="text-orange-600 underline hover:text-orange-700">
              {t("home.terms_of_service")}
            </Link>{" "}
            {t("home.wct_disclaimer_b")}
          </span>
        </p>
      </div>
    </div>
  );
}