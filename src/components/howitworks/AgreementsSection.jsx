import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, FileCheck, ShieldCheck } from "lucide-react";

const checklist = [
  "Exactly which item is being exchanged",
  "Exactly what service will be provided",
  "The expected amount of work or time",
  "When the work will happen",
  "Any important conditions or special requests",
  "Handover details — where and how the item changes hands",
];

export default function AgreementsSection() {
  return (
    <div className="py-16 px-4 bg-gradient-to-b from-orange-50 to-amber-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Agreements</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            When the conversation turns into a commitment, it becomes an official Agreement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-blue-200 h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Negotiation</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">Discussing possible terms.</p>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  <li>• Explore offers and counteroffers</li>
                  <li>• Ask questions and work out details</li>
                  <li>• Nothing is locked in — either side can walk away</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-green-200 h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Agreement</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Both parties have accepted the terms and are moving forward with the exchange.
                </p>
                <ul className="space-y-1.5 text-sm text-gray-700">
                  <li>• Records the item, the service, and the agreed hours</li>
                  <li>• The item is reserved for this exchange</li>
                  <li>• Work progress is tracked against it</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-orange-100">
            <CardContent className="p-6 md:p-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Before you accept, confirm you both agree on:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {checklist.map((c) => (
                  <div key={c} className="flex items-start gap-2 text-sm text-gray-700">
                    <ShieldCheck className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{c}</span>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-4 italic">
                Make sure everything important is clearly understood before accepting — it's much easier to
                clarify now than to resolve a misunderstanding later.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}