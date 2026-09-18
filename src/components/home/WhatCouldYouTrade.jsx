import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { ArrowRight, Scale } from "lucide-react";

const examples = [
  { emoji: "🚲", item: "Bicycle", service: "Yard work" },
  { emoji: "🪑", item: "Furniture", service: "Moving help" },
  { emoji: "💻", item: "Electronics", service: "Computer help" },
  { emoji: "🛠️", item: "Tools", service: "Home improvement" },
  { emoji: "🎸", item: "Instrument", service: "Music lessons" },
  { emoji: "📷", item: "Camera", service: "Car cleaning & detailing" },
  { emoji: "🏕️", item: "Camping gear", service: "Help with a project" },
  { emoji: "📚", item: "Books", service: "Tutoring" },
];

export default function WhatCouldYouTrade() {
  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            What Could You Trade?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Almost any item can become useful help — here are a few ideas to
            get you thinking.
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
            What's actually available depends on what members list and offer
            nearby. All exchanges must follow our{" "}
            <Link to={createPageUrl("Terms")} className="text-orange-600 underline hover:text-orange-700">
              Terms of Service
            </Link>{" "}
            and applicable laws.
          </span>
        </p>
      </div>
    </div>
  );
}