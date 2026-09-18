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
    q: "What exactly is Swap4Work?",
    a: "Swap4Work is a local marketplace where people exchange physical items for services and time. Instead of a monetary payment, the item owner receives an agreed amount of work from someone nearby — and the worker receives the item.",
  },
  {
    q: "Is money exchanged?",
    a: "The exchange itself is based on items and services, not a payment between members. Listings can show an optional estimated value to help you gauge a fair amount of work, but Swap4Work never processes payments between members. Costs like transportation or materials are between you and the other party to discuss.",
  },
  {
    q: "What can I offer in exchange for an item?",
    a: "A service you can genuinely provide — yard work, moving help, tutoring, repairs, coaching, and so on. You propose the service and the number of hours in your offer. All services must comply with our Terms of Service and applicable laws.",
  },
  {
    q: "What can I list?",
    a: "Any item you own and can hand over locally: electronics, furniture, tools, sports gear, and more. You can also list a service you offer on the Browse Services page. Everything must be accurately described and comply with our Terms of Service.",
  },
  {
    q: "How do I start a negotiation?",
    a: "Open an item's page and choose \"Start Negotiation\". You'll need an account with a completed profile, and you must be within 50 miles of the item — Swap4Work verifies this when you make your first offer. You then propose the service you can offer and the hours.",
  },
  {
    q: "Can I make a counteroffer?",
    a: "Yes. Inside any active negotiation, use the \"Counter Offer\" button to propose new hours, a different type of work, and an optional message. Offers go back and forth until you either agree or one side declines.",
  },
  {
    q: "What happens if we can't agree?",
    a: "That's fine — either side can politely decline and the negotiation simply ends. No agreement is created, and the item stays available. Negotiations also expire automatically after 48 hours of inactivity.",
  },
  {
    q: "What happens after someone accepts my offer?",
    a: "An Agreement draft appears right inside the negotiation. Each person confirms it, and once both have confirmed, the agreement locks, the item is reserved, and you both move to the Work Progress page to schedule and log the work.",
  },
  {
    q: "What is an Agreement?",
    a: "An Agreement is the confirmed plan for the exchange. While a negotiation is the discussion phase, an Agreement means both sides have accepted the terms — the item, the service, the hours, and the timing — and are moving forward.",
  },
  {
    q: "Can multiple people negotiate for the same item?",
    a: "Yes — an item can have up to 3 active negotiations at once. If the limit is reached, you can join the item's waitlist, and you'll be notified as soon as a spot opens (when a negotiation is declined, closed, or expires).",
  },
  {
    q: "What happens if an item is no longer available?",
    a: "When both people confirm an Agreement, the item is reserved and locked. Other negotiations on it are closed automatically and those users are notified. If the agreement is later cancelled, waitlisted users are notified that the item may become available again.",
  },
  {
    q: "How is service time tracked?",
    a: "Every agreement has a Work Progress page. Either party can run a shared work timer, and the worker logs hours manually (up to 12 hours per day) with a date and description. A progress bar tracks logged hours against the agreed total, and agreements can include up to 5 milestones with their own hours and due dates.",
  },
  {
    q: "Can I cancel an agreement?",
    a: "Before work starts, either party can cancel from the negotiation. Once an agreement is locked, cancellation needs the other party's consent — you send a mutual cancellation request with a reason, and cancelling mid-agreement without mutual consent can affect your karma. If there's a genuine disagreement, you can open a formal dispute instead.",
  },
  {
    q: "What happens if the other person doesn't complete the agreed work?",
    a: "Start by communicating through the negotiation — misunderstandings are usually fixable. If not, you can open a formal dispute from the agreement (for example, \"worker stopped working\" or \"no show\"), which the moderation team reviews. You can also report the user directly. Cancellations and upheld disputes affect a member's karma.",
  },
  {
    q: "How do reviews work?",
    a: "After a completed exchange, both users can leave each other a 1–5 star rating and a written review. Reviews appear on public profiles alongside completed trades and hours worked, so the community can see a real track record.",
  },
  {
    q: "How does location work?",
    a: "Swap4Work is built for local exchanges. Distances are shown in miles, you can filter browse results by distance, and you need to be within 50 miles of an item to start negotiating for it.",
  },
  {
    q: "Is my exact address visible?",
    a: "No. Listings and profiles show only your approximate area (city and state) — street addresses and ZIP codes are never displayed. Share specific meeting details privately with the other party only once you're comfortable.",
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
    q: "What areas does Swap4Work support?",
    a: "Swap4Work works anywhere a local community forms — you need to be within 50 miles of an item to negotiate for it. The community is young, so listings may be sparse in your area at first; posting your own item is the best way to get things started.",
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