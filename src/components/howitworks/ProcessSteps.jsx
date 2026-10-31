import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, MessageSquare, FileCheck, CheckCircle2, Package, ShieldCheck, Star } from "lucide-react";
import { useHowItWorks } from "@/i18n/howItWorks";

const stepIcons = [Package, Search, MessageSquare, FileCheck, CheckCircle2, Star];
const stepUrls = [
  createPageUrl("CreateItem"),
  createPageUrl("Browse"),
  null,
  null,
  createPageUrl("Browse"),
  null,
];

export default function ProcessSteps() {
  const c = useHowItWorks().steps;

  return (
    <div className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{c.heading}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {c.sub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {c.items.map((step, i) => {
            const Icon = stepIcons[i];
            const url = stepUrls[i];
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
                className="h-full"
              >
                <Card className="border-orange-100 h-full hover:shadow-xl transition-shadow">
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">{c.stepLabel.replace("{n}", i + 1)}</p>
                        <h3 className="text-lg font-bold text-gray-900 leading-tight">{step.title}</h3>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-4">{step.text}</p>

                    {step.bullets && (
                      <ul className="space-y-2 mb-4">
                        {step.bullets.map((b, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-gray-700">
                            <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {step.example && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 mb-4 space-y-1.5">
                        {step.example.map(([k, v]) => (
                          <p key={k} className="text-sm">
                            <span className="font-semibold text-blue-800">{k}:</span>{" "}
                            <span className="text-blue-900">{v}</span>
                          </p>
                        ))}
                      </div>
                    )}

                    {step.note && (
                      <p className="text-sm text-gray-500 italic mb-4">{step.note}</p>
                    )}

                    {step.ctaLabel && url && (
                      <Link to={url} className="mt-auto">
                        <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 w-full">
                          {step.ctaLabel}
                        </Button>
                      </Link>
                    )}
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