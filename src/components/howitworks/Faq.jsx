import React from "react";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const faqs = [
  {
    q: "Does Swap4Work use money?",
    a: "No. Exchanges on Swap4Work are based on work and time — you trade an item for a service, and no money changes hands through the platform. Listings can include an optional estimated value to help you gauge a fair amount of work, but no payments are ever processed here.",
  },
  {
    q: "What can I offer in exchange for an item?",
    a: "A service you can genuinely provide — yard work, moving help, tutoring, repairs, coaching, and so on. You propose the service and the number of hours in your offer, and the item owner can accept, decline, or counter. All services must comply with our Terms of Service and applicable laws.",
  },
  {
    q: "Can I negotiate the amount of work?",
    a: "Yes. That's what the negotiation is for. You and the other person exchange offers and counteroffers — adjusting the hours, the type of work, and the timing — until you land on terms you're both happy with.",
  },
  {
    q: "What happens if we can't agree?",
    a: "That's fine — either side can politely decline and the negotiation simply ends. No agreement is created, and the item stays available. Negotiations also expire automatically after 48 hours of inactivity.",
  },
  {
    q: "Can multiple people negotiate for the same item?",
    a: "Yes — an item can have up to 3 active negotiations at once. If the limit is reached, you can join the item's waitlist, and you'll be notified as soon as a spot opens (when a negotiation is declined, closed, or expires).",
  },
  {
    q: "What happens after someone accepts my offer?",
    a: "An Agreement draft appears right inside the negotiation. Each person confirms it, and once both have confirmed, the agreement locks, the item is reserved, and you both move to the Work Progress page to schedule and log the work.",
  },
  {
    q: "Can I cancel an agreement?",
    a: "Before work starts, either party can cancel from the negotiation. Once an agreement is locked, cancellation needs the other party's consent — you send a mutual cancellation request with a reason, and cancelling mid-agreement without mutual consent can affect your karma. If there's a genuine disagreement, you can open a formal dispute instead.",
  },
  {
    q: "How do reviews work?",
    a: "After a completed exchange, both users can leave each other a 1–5 star rating and a written review. Reviews appear on public profiles alongside completed trades and hours worked, so the community can see a real track record.",
  },
  {
    q: "How does location work?",
    a: "Swap4Work only ever shows your approximate area (city and state) — never your street address. Distances are shown in miles, you can filter browse results by distance, and you need to be within 50 miles of an item to start negotiating for it.",
  },
  {
    q: "How do I report someone?",
    a: "Use the \"More Options\" menu on their profile to report the user, the \"Report this listing\" button on an item page, or the report option inside a negotiation to report a conversation. Reports are reviewed by the moderation team.",
  },
  {
    q: "Can I block someone?",
    a: "Yes. You can block a user from their profile or from inside a negotiation. Blocked users disappear from your browse results and can't negotiate or message you, and you can unblock them anytime from your Profile settings.",
  },
  {
    q: "What happens if someone doesn't complete the agreed work?",
    a: "Start by communicating through the negotiation — misunderstandings are usually fixable. If not, you can open a formal dispute from the agreement (for example, \"worker stopped working\" or \"no show\"), which the moderation team reviews. You can also report the user directly. Cancellations and upheld disputes affect a member's karma.",
  },
  {
    q: "Is Swap4Work available everywhere?",
    a: "Swap4Work is built for local communities — you need to be within 50 miles of an item to negotiate for it, so it works wherever enough people near you have joined. The community is young, so listings may be sparse in your area at first; posting your own item is the best way to get things started.",
  },
  {
    q: "How do I get started?",
    a: "Create an account, browse items or post something you no longer need, and start a conversation.",
  },
];

export default function Faq() {
  return (
    <div className="py-16 px-4 bg-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-7 h-7 text-orange-600" />
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Common Questions</h2>
          <p className="text-gray-600">Everything new members usually ask.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
        >
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
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