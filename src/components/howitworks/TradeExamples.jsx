import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Scale } from "lucide-react";

const examples = [
  { item: "Bicycle", service: "Yard work" },
  { item: "Furniture", service: "Moving help" },
  { item: "Electronics", service: "Computer help" },
  { item: "Tools", service: "Home improvement" },
  { item: "Camping equipment", service: "Car cleaning" },
  { item: "Baby items", service: "Babysitting / childcare" },
  { item: "Unused appliances", service: "Handyman help" },
  { item: "Sports equipment", service: "Coaching / training" },
  { item: "Books", service: "Tutoring" },
  { item: "Musical instrument", service: "Music lessons" },
];

export default function TradeExamples() {
  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">What Can I Trade?</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Swap4Work isn't limited to one category. Almost any physical item can be exchanged for a useful service — here are just a few ideas.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {examples.map((ex, i) => (
            <motion.div
              key={ex.item}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.4, delay: (i % 3) * 0.06 }}
              className="flex items-center gap-3 p-4 rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 to-amber-50"
            >
              <Badge className="bg-white text-orange-700 border border-orange-200 shadow-sm font-medium flex-shrink-0">
                {ex.item}
              </Badge>
              <ArrowRight className="w-4 h-4 text-orange-400 flex-shrink-0" />
              <Badge className="bg-white text-blue-700 border border-blue-200 shadow-sm font-medium flex-shrink-0">
                {ex.service}
              </Badge>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex items-start gap-3 max-w-2xl mx-auto rounded-xl border border-gray-200 bg-gray-50 p-4">
          <Scale className="w-5 h-5 text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-gray-600">
            Every exchange must comply with Swap4Work's{" "}
            <Link to={createPageUrl("Terms")} className="text-orange-600 underline hover:text-orange-700">
              Terms of Service
            </Link>{" "}
            and applicable laws. Illegal, unsafe, or prohibited services are not allowed.
          </p>
        </div>
      </div>
    </div>
  );
}