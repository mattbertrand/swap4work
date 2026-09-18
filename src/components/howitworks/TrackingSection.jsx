import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Clock, Timer, ListChecks, Milestone, ArrowDown } from "lucide-react";

const timeline = [
  { icon: CheckCircle2, label: "Agreement Accepted", text: "Both parties confirmed and the agreement is locked" },
  { icon: Clock, label: "Work Scheduled", text: "You agree on when the work happens" },
  { icon: Timer, label: "Work Started", text: "The timer runs and hours are logged against the agreement" },
  { icon: Milestone, label: "Work Completed", text: "The worker marks the work complete and the item owner is notified" },
  { icon: ListChecks, label: "Item Exchanged", text: "Both parties confirm the handover" },
  { icon: CheckCircle2, label: "Agreement Completed", text: "The exchange is done — time to leave reviews" },
];

const tools = [
  {
    icon: Timer,
    title: "Work timer",
    text: "Start a shared timer while you work — stopping it turns the elapsed time into a log entry. Both parties see the same timer.",
  },
  {
    icon: Clock,
    title: "Time logs",
    text: "Log hours manually with a date and description (up to 12 hours per day). A progress bar shows logged hours against the agreed total.",
  },
  {
    icon: Milestone,
    title: "Milestones",
    text: "An agreement can include up to 5 milestones with their own hours and due dates, so bigger jobs stay on track.",
  },
];

export default function TrackingSection() {
  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Tracking the Work</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Every agreement has a Work Progress page where both sides can see exactly where the exchange stands.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div className="relative">
            {timeline.map((t, i) => (
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
                    <t.icon className="w-5 h-5 text-white" />
                  </div>
                  {i < timeline.length - 1 && (
                    <ArrowDown className="w-4 h-4 text-orange-300 my-1" />
                  )}
                </div>
                <div className="pb-6">
                  <h4 className="font-bold text-gray-900">{t.label}</h4>
                  <p className="text-sm text-gray-600">{t.text}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="space-y-4">
            {tools.map((tool, i) => (
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
                      <tool.icon className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">{tool.title}</h4>
                      <p className="text-sm text-gray-600">{tool.text}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}