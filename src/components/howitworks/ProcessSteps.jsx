import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Search, MessageSquare, FileCheck, CheckCircle2, Package, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: Package,
    title: "Post an Item",
    text: "List an item you no longer need and describe the type of service you'd like in exchange.",
    bullets: [
      "A clear, specific title",
      "Good, well-lit photos of the actual item",
      "An honest description with any defects",
      "The item's condition and approximate value",
      "The type of service you're looking for",
      "Your general area — never your exact home address",
    ],
    cta: { label: "Post an Item", url: createPageUrl("CreateItem") },
  },
  {
    icon: Search,
    title: "Browse & Discover",
    text: "Search available items and use filters to find opportunities that interest you.",
    bullets: [
      "Filter by category",
      "Filter by distance from your area",
      "Sort by newest additions",
      "Find items where a service you can offer is wanted",
      "Only approximate areas are shown — exact locations stay private",
    ],
    cta: { label: "Browse Items", url: createPageUrl("Browse") },
  },
  {
    icon: MessageSquare,
    title: "Start a Negotiation",
    text: "Interested in an item? Propose the service you can provide in exchange.",
    bullets: [
      "The service you're offering",
      "An estimate of the hours involved",
      "Timing and scheduling",
      "Details of the work",
      "Counteroffers and questions through messaging",
      "Starting a negotiation is not a commitment — both sides must agree before anything is locked in",
    ],
  },
  {
    icon: FileCheck,
    title: "Create an Agreement",
    text: "Once you both agree on the terms, the negotiation becomes an official Agreement that records the details of the exchange.",
    example: {
      ITEM: "Used bicycle",
      SERVICE: "3 hours of yard work",
      SCHEDULE: "Saturday morning",
    },
    note: "Review the Agreement carefully before accepting — make sure the item, the work, the hours, and the timing all match what you discussed.",
  },
  {
    icon: CheckCircle2,
    title: "Complete the Exchange",
    text: "Follow through on the agreed terms, then close things out.",
    bullets: [
      "Complete the agreed service",
      "Log and confirm the work",
      "Exchange the item",
      "Mark the agreement complete",
      "Leave a review",
      "Communicate through Swap4Work whenever possible",
    ],
    cta: { label: "Start Browsing", url: createPageUrl("Browse") },
  },
];

export default function ProcessSteps() {
  return (
    <div className="py-16 px-4 bg-gradient-to-b from-white to-orange-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">The Basic Process</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From posting to completed exchange — five steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {steps.map((step, i) => (
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
                      <step.icon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide">Step {i + 1}</p>
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
                      {Object.entries(step.example).map(([k, v]) => (
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

                  {step.cta && (
                    <Link to={step.cta.url} className="mt-auto">
                      <Button size="sm" className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 w-full">
                        {step.cta.label}
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}