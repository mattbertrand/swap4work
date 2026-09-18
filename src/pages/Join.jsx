import React, { useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Briefcase, Search, HandshakeIcon, CheckCircle2, ArrowRight, Star } from "lucide-react";
import { motion } from "framer-motion";

export default function Join() {
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get("source");
    if (source) {
      localStorage.setItem("ref_source", source);
    }
  }, []);

  const handleSignUp = () => base44.auth.redirectToLogin(window.location.origin);
  const handleLogIn = () => base44.auth.redirectToLogin(window.location.origin);

  const steps = [
    {
      icon: Search,
      title: "Browse Items & Services",
      desc: "Find items you need or services offered by people in your community.",
    },
    {
      icon: HandshakeIcon,
      title: "Offer Your Skills",
      desc: "Propose your time and skills in exchange for items you want.",
    },
    {
      icon: CheckCircle2,
      title: "Exchange & Complete",
      desc: "Agree on terms, do the work, and receive what you need.",
    },
  ];

  const examples = [
    { work: "Help clean a garage", get: "Get a bike", emoji: "🚲" },
    { work: "Do yard work", get: "Get fresh produce", emoji: "🥦" },
    { work: "Help someone move", get: "Get furniture", emoji: "🛋️" },
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
        <button
          onClick={handleLogIn}
          className="text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
        >
          Log In
        </button>
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
              Community-Powered Exchange
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 leading-tight mb-4">
              Trade what you have<br />for what you need —<br />
              <span className="text-orange-500">no payments between members</span>
            </h1>
            <p className="text-gray-600 text-base mb-8 max-w-xs mx-auto leading-relaxed">
              Help someone for a few hours and get what you want in return.
            </p>
            <div className="flex flex-col gap-3 max-w-xs mx-auto">
              <button
                onClick={handleSignUp}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-bold py-4 px-6 rounded-2xl text-base shadow-lg hover:from-orange-600 hover:to-amber-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                Get Started — It's Free
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogIn}
                className="w-full bg-white text-gray-700 font-semibold py-4 px-6 rounded-2xl text-base border border-gray-200 hover:bg-gray-50 active:scale-95 transition-all"
              >
                Log In
              </button>
            </div>
          </motion.div>
        </section>

        {/* How It Works */}
        <section className="px-6 py-12">
          <h2 className="text-xl font-bold text-gray-900 text-center mb-8">How It Works</h2>
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
          <h2 className="text-xl font-bold text-gray-900 text-center mb-6">Example Exchanges</h2>
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
            <h2 className="text-lg font-bold text-gray-900 mb-2">Fair &amp; Transparent</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Written agreements, reviews from completed exchanges, and easy
              reporting and blocking — built to protect everyone involved.
            </p>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-6 py-10 bg-gradient-to-br from-orange-500 to-amber-600 text-center">
          <h2 className="text-2xl font-extrabold text-white mb-2">Ready to start?</h2>
          <p className="text-orange-100 text-sm mb-8">Join your community exchange today.</p>
          <div className="flex flex-col gap-3 max-w-xs mx-auto">
            <button
              onClick={handleSignUp}
              className="w-full bg-white text-orange-600 font-bold py-4 px-6 rounded-2xl text-base shadow-lg hover:bg-orange-50 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              Start Exchanging
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogIn}
              className="w-full bg-transparent text-white font-semibold py-4 px-6 rounded-2xl text-base border border-white/40 hover:bg-white/10 active:scale-95 transition-all"
            >
              Log In
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
          <Link to={createPageUrl("Terms")} className="hover:text-gray-600 transition-colors">Terms of Service</Link>
          <span>·</span>
          <Link
            to={createPageUrl("Privacy")}
            className="hover:text-gray-600 transition-colors"
          >
            Privacy Policy
          </Link>
        </div>
      </footer>
    </div>
  );
}