import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserSearch, MessageSquare, ShieldAlert, Flag, Ban, FileWarning } from "lucide-react";

const beforeAgreeing = [
  "Review the other user's profile",
  "Look at their reviews and history",
  "Ask questions before committing",
  "Clearly define the work involved",
  "Make sure the exchange makes sense to both of you",
];

const duringExchange = [
  "Communicate clearly and often",
  "Follow the agreed terms",
  "Meet in an appropriate location",
  "Don't share unnecessary personal information",
];

const ifWrong = [
  {
    icon: Flag,
    title: "Report a user",
    text: "Open the \"More Options\" menu on their profile and choose Report User. You can also report an item listing directly from its page, or report a conversation from inside a negotiation.",
  },
  {
    icon: Ban,
    title: "Block a user",
    text: "Blocking is available from any profile or negotiation. Blocked users disappear from your browse results and can't negotiate with you — and you can unblock them anytime from your Profile settings.",
  },
  {
    icon: FileWarning,
    title: "Open a dispute",
    text: "For problems inside an active agreement (like a no-show or stopped work), open a formal dispute from the agreement. Reports, disputes, and blocks are all reviewed by the moderation team.",
  },
];

export default function TrustSafety() {
  return (
    <div className="py-16 px-4 bg-gradient-to-b from-blue-50 to-cyan-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="bg-blue-100 text-blue-700 border border-blue-200 mb-3">Trust &amp; Safety</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">Stay Safe on Swap4Work</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            A few habits keep exchanges smooth and safe for everyone.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-blue-100 h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-green-100 flex items-center justify-center">
                    <UserSearch className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Before agreeing</h3>
                </div>
                <ul className="space-y-2">
                  {beforeAgreeing.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.4, delay: 0.08 }}
          >
            <Card className="border-blue-100 h-full">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-100 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">During the exchange</h3>
                </div>
                <ul className="space-y-2">
                  {duringExchange.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                      {b}
                    </li>
                  ))}
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
          <Card className="border-red-100">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-11 h-11 rounded-xl bg-red-100 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">If something goes wrong</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ifWrong.map((w) => (
                  <div key={w.title} className="p-4 rounded-xl border border-red-100 bg-white">
                    <div className="flex items-center gap-2 mb-2">
                      <w.icon className="w-5 h-5 text-red-500 flex-shrink-0" />
                      <h4 className="font-semibold text-gray-900 text-sm">{w.title}</h4>
                    </div>
                    <p className="text-sm text-gray-600">{w.text}</p>
                  </div>
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-6">
                Read our{" "}
                <Link to={createPageUrl("Terms")} className="text-orange-600 underline hover:text-orange-700">
                  Terms of Service
                </Link>
                {", "}
                <Link
                  to={createPageUrl("CommunityGuidelines")}
                  className="text-orange-600 underline hover:text-orange-700"
                >
                  Safety Guidelines
                </Link>
                {", "}
                <Link
                  to={createPageUrl("CommunityGuidelines")}
                  className="text-orange-600 underline hover:text-orange-700"
                >
                  Community Rules
                </Link>
                {", and "}
                <Link
                  to={createPageUrl("Privacy")}
                  className="text-orange-600 underline hover:text-orange-700"
                >
                  Privacy Policy
                </Link>
                .
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}