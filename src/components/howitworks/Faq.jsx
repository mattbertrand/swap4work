import React from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";
import { useHowItWorks } from "@/i18n/howItWorks";

export default function Faq() {
  const c = useHowItWorks().faq;

  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-7 h-7 text-orange-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">{c.heading}</h2>
          <p className="text-gray-600">{c.sub}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {c.items.map((f, i) => (
              <AccordionItem
                key={i}
                value={`faq-${i}`}
                className="border border-orange-100 rounded-xl px-5 bg-gradient-to-r from-orange-50/50 to-white"
              >
                <AccordionTrigger className="text-left font-semibold text-gray-900 hover:no-underline py-4">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 text-sm leading-relaxed pb-4">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </div>
  );
}