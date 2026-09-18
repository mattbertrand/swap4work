import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Repeat2, Users, ArrowRight, Clock, CheckCircle2, XCircle, Bell } from "lucide-react";

const basics = [
  {
    icon: MessageSquare,
    title: "Start a Negotiation",
    text: "One person expresses interest in an item and proposes a service — with the type of work, an hour estimate, a message, and timing.",
  },
  {
    icon: Repeat2,
    title: "Counteroffer",
    text: "The other person can accept, decline, or propose different terms. Offers and counteroffers go back and forth until you either agree or part ways.",
  },
  {
    icon: Users,
    title: "Multiple Negotiators",
    text: "An item can have up to 3 active negotiations at a time. If the limit is reached, new interested users can join a waitlist and are notified when a spot opens.",
  },
];

const outcomes = [
  {
    icon: CheckCircle2,
    title: "An offer is accepted",
    text: "The negotiation moves to the Agreement step, and all other negotiations for that item are automatically closed (those users are notified).",
  },
  {
    icon: XCircle,
    title: "An offer is declined",
    text: "The negotiation ends — no Agreement is created. Waitlisted users are notified that a spot opened.",
  },
  {
    icon: Repeat2,
    title: "A counteroffer is made",
    text: "The new offer (hours, type of work, and an optional message) is sent to the other person, and the negotiation continues.",
  },
  {
    icon: Clock,
    title: "The negotiation goes quiet",
    text: "Negotiations automatically expire after 48 hours of inactivity, so stale offers don't linger.",
  },
  {
    icon: XCircle,
    title: "The item goes to someone else",
    text: "If the item owner accepts a different offer, your negotiation is closed and you're notified right away.",
  },
  {
    icon: Bell,
    title: "You're on the waitlist",
    text: "You'll get a notification as soon as a negotiation closes or is declined — then it's first come, first served for the open spot.",
  },
];

export default function NegotiationExplainer() {
  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Understanding Negotiations</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Negotiation is the heart of Swap4Work. It's a conversation with structured offers — nothing is final until you both agree.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {basics.map((b, i) => (
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
                    <b.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-600">{b.text}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-2">
            <Badge className="bg-orange-100 text-orange-700 border border-orange-200 px-4 py-2">Offer made</Badge>
            <ArrowRight className="w-5 h-5 text-gray-400 hidden md:block" />
            <div className="flex flex-wrap justify-center gap-2">
              <Badge className="bg-green-100 text-green-700 border border-green-200 px-4 py-2">Accept</Badge>
              <Badge className="bg-blue-100 text-blue-700 border border-blue-200 px-4 py-2">Counteroffer</Badge>
              <Badge className="bg-red-100 text-red-700 border border-red-200 px-4 py-2">Decline</Badge>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500">
            Both parties must agree before a trade moves forward — a negotiation is never a commitment on its own.
          </p>
        </div>

        <div className="mt-10">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">What happens when…</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {outcomes.map((o, i) => (
              <motion.div
                key={o.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.35, delay: (i % 3) * 0.06 }}
                className="p-5 rounded-xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  <o.icon className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <h4 className="font-semibold text-gray-900 text-sm">{o.title}</h4>
                </div>
                <p className="text-sm text-gray-600">{o.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}