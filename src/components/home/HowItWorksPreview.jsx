import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen } from "lucide-react";
import { useLanguage } from "@/i18n/LanguageContext";

export default function HowItWorksPreview() {
  const { t } = useLanguage();

  const steps = [
    {
      title: t("home.hiw_step1_title"),
      text: t("home.hiw_step1_text"),
    },
    {
      title: t("home.hiw_step2_title"),
      text: t("home.hiw_step2_text"),
    },
    {
      title: t("home.hiw_step3_title"),
      text: t("home.hiw_step3_text"),
    },
  ];

  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t("home.hiw_title")}</h2>
          <p className="text-gray-600">{t("home.hiw_sub")}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-3xl font-bold text-white">{i + 1}</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
              <p className="text-gray-600 text-sm">{step.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link to={createPageUrl("HowItWorks")}>
            <Button variant="outline" size="lg" className="border-orange-300 text-orange-600 hover:bg-orange-50 px-8 py-6 h-auto">
              <BookOpen className="w-5 h-5 mr-2" />
              {t("home.hiw_see_guide")}
            </Button>
          </Link>
          <Link to={createPageUrl("Browse")}>
            <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-lg px-8 py-6 h-auto">
              {t("home.start_browsing")}
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}