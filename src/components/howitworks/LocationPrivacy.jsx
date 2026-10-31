import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ShieldCheck, Eye, AlertTriangle } from "lucide-react";
import { useHowItWorks } from "@/i18n/howItWorks";

const pointIcons = [MapPin, Eye, ShieldCheck, AlertTriangle];

export default function LocationPrivacy() {
  const c = useHowItWorks().location;

  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{c.heading}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {c.sub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {c.points.map((p, i) => {
            const Icon = pointIcons[i];
            return (
              <motion.div
                key={p.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: (i % 2) * 0.08 }}
              >
                <Card className="border-blue-100 h-full">
                  <CardContent className="p-6 flex items-start gap-4">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">{p.title}</h3>
                      <p className="text-sm text-gray-600">{p.text}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}