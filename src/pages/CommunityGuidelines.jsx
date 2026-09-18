import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ScrollText,
  HeartHandshake,
  BadgeCheck,
  HandCoins,
  ShieldAlert,
  MapPin,
  Lock,
  Flag,
  Gavel,
} from "lucide-react";

const GUIDELINE_VERSION = "1.0";
const EFFECTIVE_DATE = "September 18, 2026";

const RULES = [
  {
    icon: HeartHandshake,
    color: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "1. Treat people with respect",
    body: "Every member is a real person giving their time and skills. No harassment, threats, slurs, hate speech, or discriminatory behavior — in listings, messages, negotiations, or reviews. Keep communication clear and courteous, even when a trade doesn't work out."
  },
  {
    icon: BadgeCheck,
    color: "bg-green-100",
    iconColor: "text-green-600",
    title: "2. Be honest and accurate",
    body: "Use real photos of the actual item, describe its condition fairly, and set a realistic hour estimate. If you offer a service, describe what you can genuinely do. Log the hours you actually worked, honor your confirmed agreements, and show up when you say you will."
  },
  {
    icon: HandCoins,
    color: "bg-amber-100",
    iconColor: "text-amber-600",
    title: "3. Keep it an exchange — no money",
    body: "Swap4Work exists to exchange work and time for items, not to buy or sell for cash. Don't ask other members for money, offer to pay for an item, or use the platform to find paid work. Negotiations should be about hours, tasks, and items."
  },
  {
    icon: ShieldAlert,
    color: "bg-red-100",
    iconColor: "text-red-600",
    title: "4. Nothing illegal, stolen, or dangerous",
    body: "Never list or request stolen, counterfeit, or prohibited goods — including weapons, drugs, and regulated items. Don't offer services that require a license you don't have, and don't propose anything that puts anyone's safety or the law at risk."
  },
  {
    icon: MapPin,
    color: "bg-purple-100",
    iconColor: "text-purple-600",
    title: "5. Meet and exchange responsibly",
    body: "Meet in public, well-lit places during the day when you can, let someone know where you're going, and bring a friend when doing work at someone's home. Inspect an item before you agree, and re-check it at handover. You can always walk away from a trade before it's confirmed."
  },
  {
    icon: Lock,
    color: "bg-cyan-100",
    iconColor: "text-cyan-600",
    title: "6. Protect your personal information",
    body: "Keep conversations on the platform so there's a record if something goes wrong. Don't share your street address, financial details, or passwords in chat — share the minimum needed to arrange a meeting or the work location, and only once you trust the other member."
  },
  {
    icon: Flag,
    color: "bg-orange-100",
    iconColor: "text-orange-600",
    title: "7. Report and block when needed",
    body: "If a listing, profile, message, or negotiation feels wrong — scammy, harassing, or unsafe — report it. You can report a listing from its page, a member from their profile, or a conversation from inside a negotiation. You can also block anyone from a profile or negotiation; blocked members disappear from your results and can't contact you, and you can unblock them anytime from your Profile settings."
  }
];

export default function CommunityGuidelines() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ScrollText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Community Guidelines
          </h1>
          <p className="text-gray-600 mb-4">
            How we keep Swap4Work a safe, fair place to exchange work for items.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              Version {GUIDELINE_VERSION}
            </Badge>
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              Effective {EFFECTIVE_DATE}
            </Badge>
          </div>
        </div>

        {/* The rules */}
        <div className="space-y-5 mb-8">
          {RULES.map((rule) => (
            <Card key={rule.title} className="border-orange-100 shadow-md bg-white">
              <CardContent className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  <div className={`w-12 h-12 ${rule.color} rounded-xl flex items-center justify-center flex-shrink-0 mx-auto md:mx-0`}>
                    <rule.icon className={`w-6 h-6 ${rule.iconColor}`} />
                  </div>
                  <div className="text-center md:text-left">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">{rule.title}</h2>
                    <p className="text-sm text-gray-700 leading-relaxed">{rule.body}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Enforcement */}
        <Card className="border-orange-200 shadow-lg bg-white/90">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center">
                <Gavel className="w-6 h-6 text-gray-600" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">If the rules are broken</h2>
            </div>
            <p className="text-sm text-gray-700 leading-relaxed mb-3">
              Our moderation team reviews every report. Depending on how serious
              and how repeated a violation is, we may issue a warning, hide a
              listing, suspend an account, or remove a member from the
              community. Reputation and karma scores can also be adjusted — for
              example, after an abandoned agreement — and disputes over active
              agreements can be reviewed with partial credit awarded for work
              that was genuinely completed.
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              For the full legal terms, see our{" "}
              <Link to={createPageUrl("Terms")} className="text-orange-600 underline hover:text-orange-700">
                Terms &amp; Conditions
              </Link>
              , and for how your information is handled, our{" "}
              <Link to={createPageUrl("Privacy")} className="text-orange-600 underline hover:text-orange-700">
                Privacy Policy
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}