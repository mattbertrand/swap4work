import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, ShieldCheck, Eye, AlertTriangle } from "lucide-react";

const points = [
  {
    icon: MapPin,
    title: "Location connects you — but stays vague",
    text: "Swap4Work uses your general area to help you find items and people nearby. Other members only ever see your approximate area (like your city and state) — never your street address.",
  },
  {
    icon: Eye,
    title: "A 50-mile range keeps it local",
    text: "To start a negotiation on an item, you need to be within 50 miles of it — Swap4Work verifies this when you make your first offer. You can also filter browse results by distance.",
  },
  {
    icon: ShieldCheck,
    title: "Share details only when appropriate",
    text: "Keep your exact home address out of your listing. Share specific meeting or work details privately with the other party only once you're comfortable.",
  },
  {
    icon: AlertTriangle,
    title: "Meet smart",
    text: "Use public or otherwise appropriate meeting locations for item exchanges when possible, and use good judgment when meeting someone for the first time.",
  },
];

export default function LocationPrivacy() {
  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Location &amp; Privacy</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Nearby is the whole point — but your privacy comes first.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {points.map((p, i) => (
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
                    <p.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{p.title}</h3>
                    <p className="text-sm text-gray-600">{p.text}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}