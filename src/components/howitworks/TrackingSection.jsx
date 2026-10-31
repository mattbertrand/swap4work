import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Timer, ListChecks, Milestone, ArrowDown } from "lucide-react";
import { useHowItWorks } from "@/i18n/howItWorks";

const timelineIcons = [CheckCircle2, Clock, Timer, Milestone, ListChecks, CheckCircle2];
const toolIcons = [Timer, Clock, Milestone];

export default function TrackingSection() {
  const c = useHowItWorks().tracking;

  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{c.heading}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {c.sub}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="relative">
            {c.timeline.map((t, i) => {
              const Icon = timelineIcons[i];
              return (
                <motion.div
                  key={t.label}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.35, delay: i * 0.07 }}
                  className="flex gap-4 relative"
                >
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0 shadow-md">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    {i < c.timeline.length - 1 && (
                      <ArrowDown className="w-4 h-4 text-orange-300 my-1" />
                    )}
                  </div>
                  <div className="pb-6">
                    <h4 className="font-bold text-gray-900">{t.label}</h4>
                    <p className="text-sm text-gray-600">{t.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <div className="space-y-4">
            {c.tools.map((tool, i) => {
              const Icon = toolIcons[i];
              return (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                >
                  <Card className="border-orange-100">
                    <CardContent className="p-5 flex items-start gap-4">
                      <div className="w-11 h-11 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 mb-1">{tool.title}</h4>
                        <p className="text-sm text-gray-600">{tool.text}</p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}