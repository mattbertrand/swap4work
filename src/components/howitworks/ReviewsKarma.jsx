import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Star, TrendingUp, Clock, Quote } from "lucide-react";

const signals = [
  { icon: Star, title: "Reliability", text: "Did the person show up and follow through?" },
  { icon: TrendingUp, title: "Communication", text: "Were they responsive, clear, and easy to work with?" },
  { icon: Clock, title: "Quality", text: "Was the work — and the item — as promised?" },
  { icon: Star, title: "Follow-through", text: "Was the exchange completed as agreed?" },
];

export default function ReviewsKarma() {
  return (
    <div className="py-16 px-4 bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Reviews &amp; Karma</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            After a completed exchange, both users can review each other with 1–5 stars and a written review.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {signals.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.35, delay: (i % 4) * 0.06 }}
            >
              <Card className="border-orange-100 h-full">
                <CardContent className="p-5 text-center">
                  <div className="w-11 h-11 rounded-full bg-yellow-100 flex items-center justify-center mx-auto mb-3">
                    <s.icon className="w-6 h-6 text-yellow-500" />
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">{s.title}</h4>
                  <p className="text-xs text-gray-600">{s.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-orange-100 h-full">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-3">Where reviews appear</h3>
                <p className="text-sm text-gray-600">
                  Reviews show on a member's public profile alongside their star average, completed trades,
                  and total hours worked — so future partners can see a track record before starting a
                  negotiation.
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <Card className="border-orange-100 h-full bg-white">
              <CardContent className="p-6">
                <h3 className="font-bold text-gray-900 mb-3">Karma</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Karma is a trust score that grows with completed agreements and positive reviews — and can
                  drop for mid-agreement cancellations and violations found in disputes.
                </p>
                <div className="rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 p-4 flex items-start gap-3">
                  <Quote className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-orange-800">
                    "Every successful exchange helps build your reputation."
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}