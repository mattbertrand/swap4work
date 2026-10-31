import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Repeat2, Users, ArrowRight, Clock, CheckCircle2, XCircle, Bell } from "lucide-react";
import { useHowItWorks } from "@/i18n/howItWorks";

const basicIcons = [MessageSquare, Repeat2, Users];
const outcomeIcons = [CheckCircle2, XCircle, Repeat2, Clock, XCircle, Bell];

export default function NegotiationExplainer() {
  const c = useHowItWorks().negotiation;

  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{c.heading}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {c.sub}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {c.basics.map((b, i) => {
            const Icon = basicIcons[i];
            return (
              <motion.div
                key={b.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <Card className="border-blue-100 h-full">
                  <CardContent className="p-6">
                    <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
                    <p className="text-sm text-gray-600">{b.text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-2">
            <Badge className="bg-orange-100 text-orange-700 border border-orange-200 px-4 py-2">{c.offerMade}</Badge>
            <ArrowRight className="w-5 h-5 text-gray-400 hidden md:block" />
            <div className="flex flex-wrap justify-center gap-2">
              <Badge className="bg-green-100 text-green-700 border border-green-200 px-4 py-2">{c.accept}</Badge>
              <Badge className="bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2">{c.counter}</Badge>
              <Badge className="bg-red-100 text-red-700 border border-red-200 px-4 py-2">{c.decline}</Badge>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500">
            {c.flowNote}
          </p>
        </div>

        <div className="mt-10">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">{c.outcomesHeading}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {c.outcomes.map((o, i) => {
              const Icon = outcomeIcons[i];
              return (
                <motion.div
                  key={o.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
                  className="p-5 rounded-xl border border-gray-100 bg-white shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                    <h4 className="font-semibold text-gray-900 text-sm">{o.title}</h4>
                  </div>
                  <p className="text-sm text-gray-600">{o.text}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}