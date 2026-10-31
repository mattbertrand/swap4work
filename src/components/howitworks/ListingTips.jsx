import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, FileText, Tag, Target, Scale, Clock, MessageSquare, Lightbulb } from "lucide-react";
import { useHowItWorks } from "@/i18n/howItWorks";

const tipIcons = [Camera, FileText, Tag, Target, Scale, Clock, MessageSquare];

export default function ListingTips() {
  const c = useHowItWorks().tips;

  return (
    <div className="py-16 px-4 bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{c.heading}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {c.sub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {c.items.map((tip, i) => {
            const Icon = tipIcons[i];
            return (
              <motion.div
                key={tip.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: (i % 3) * 0.08 }}
                className="h-full"
              >
                <Card className="border-orange-100 h-full">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-orange-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{tip.title}</h3>
                    <p className="text-sm text-gray-600">{tip.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.16 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-6 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-amber-200 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <p className="font-bold text-amber-900 mb-1">{c.highlightLabel}</p>
                <p className="text-sm text-amber-800">
                  {c.highlight}
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}