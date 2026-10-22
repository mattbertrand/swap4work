import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { authSignupUrl, authLoginUrl } from "@/lib/authNavigation";
import { Briefcase, Search, HandshakeIcon, CheckCircle2, ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/i18n/LanguageContext";
import LanguageSelector from "@/components/i18n/LanguageSelector";

export default function Join() {
  const { t } = useLanguage();
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get("source");
    if (source) {
      localStorage.setItem("ref_source", source);
    }
  }, []);

  const navigate = useNavigate();
  const handleSignUp = () => navigate(authSignupUrl("/"));
  const handleLogIn = () => navigate(authLoginUrl("/"));

  const steps = [
    {
      icon: Search,
      title: t("join.step1_title"),
      desc: t("join.step1_desc"),
    },
    {
      icon: HandshakeIcon,
      title: t("join.step2_title"),
      desc: t("join.step2_desc"),
    },
    {
      icon: CheckCircle2,
      title: t("join.step3_title"),
      desc: t("join.step3_desc"),
    },
  ];

  const examples = [
    { work: t("join.ex1_work"), get: t("join.ex1_get"), emoji: "🚲" },
    { work: t("join.ex2_work"), get: t("join.ex2_get"), emoji: "🥦" },
    { work: t("join.ex3_work"), get: t("join.ex3_get"), emoji: "🛋️" },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-orange-100 bg-white sticky top-0 z-10">
        <img
          src="https://media.base44.com/images/public/690d293b21b2ce5e9a6db7c8/72467c977_Swap4WorkFinalLogov2.png"
          alt="Swap4Work"
          className="h-10 w-auto object-contain"
        />
        <div className="flex items-center gap-4">
          <LanguageSelector />
          <button
            onClick={handleLogIn}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            {t("nav.log_in")}
          </button>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="px-6 pt-12 pb-10 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Star className="w-3 h-3 fill-orange-500 text-orange-500" />
              {t("join.badge")}
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-4">
              {t("join.hero_a")}<br />{t("join.hero_b")}<br />
              <span className="text-orange-500">{t("join.hero_c")}</span>
            </h1>
            <p className="text-gray-600 text-base mb-8 max-w-xs mx-auto leading-relaxed">
              {t("join.subtitle")}
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button
                onClick={handleSignUp}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold py-4 px-6 rounded-2xl text-base shadow-lg hover:from-orange-600 hover:to-amber-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {t("join.get_started")}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogIn}
                className="w-full bg-white text-gray-700 font-semibold py-4 px-6 rounded-2xl text-base border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
              >
                {t("nav.log_in")}
              </button>
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="px-6 py-12">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">{t("join.how_it_works")}</h2>
          <div className="flex flex-col gap-6 max-w-sm mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.1 * i }}
                className="flex items-start gap-4"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <step.icon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-sm mb-1">
                    <span className="text-orange-500 mr-1">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Examples */}
        <section className="px-6 py-10 bg-gray-50">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">{t("join.examples_title")}</h2>
          <div className="flex flex-col gap-3 max-w-sm mx-auto">
            {examples.map((ex, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * i }}
                className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm flex items-center gap-4"
              >
                <span className="text-3xl">{ex.emoji}</span>
                <div>
                  <p className="text-gray-500 text-xs">{ex.work}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <ArrowRight className="w-3 h-3 text-orange-500" />
                    <p className="font-bold text-gray-900 text-sm">{ex.get}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Trust */}
        <section className="px-6 py-10 text-center">
          <div className="max-w-xs mx-auto">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-7 h-7 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">{t("join.trust_title")}</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              {t("join.trust_desc")}
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-10 bg-gradient-to-br from-orange-500 to-amber-600 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-2">{t("join.final_title")}</h2>
          <p className="text-orange-100 text-sm mb-8">{t("join.final_sub")}</p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button
              onClick={handleSignUp}
              className="w-full bg-white text-orange-600 font-bold py-4 px-6 rounded-2xl text-base shadow-lg hover:bg-orange-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {t("join.final_cta")}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogIn}
              className="w-full bg-transparent text-white font-semibold py-4 px-6 rounded-2xl text-base border border-white/40 hover:bg-white/10 active:scale-95 transition-all"
            >
              {t("nav.log_in")}
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 bg-white border-t border-gray-100 text-center">
        <div className="flex items-center justify-center mb-3">
          <img
            src="https://media.base44.com/images/public/690d293b21b2ce5e9a6db7c8/72467c977_Swap4WorkFinalLogov2.png"
            alt="Swap4Work"
            className="h-10 w-auto object-contain"
          />
        </div>
        <div className="flex items-center justify-center gap-4 text-xs text-gray-400">
          <Link to={createPageUrl("Terms")} className="hover:text-gray-600 transition-colors">{t("join.terms_of_service")}</Link>
          <span>·</span>
          <Link
            to={createPageUrl("Privacy")}
            className="hover:text-gray-600 transition-colors"
          >
            {t("footer.privacy")}
          </Link>
        </div>
      </footer>
    </div>
  );
}