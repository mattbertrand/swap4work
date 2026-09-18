import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, ShieldCheck, Clock, Users, Gavel } from "lucide-react";

const TERMS_VERSION = "1.0";
const EFFECTIVE_DATE = "September 17, 2026";

const SECTIONS = [
  {
    title: "1. About These Terms",
    body: [
      "Welcome to Swap4Work. These Terms & Conditions (\"Terms\") are a binding agreement between you and Swap4Work governing your use of our platform, website, and services. By creating an account, completing your profile, or using the platform in any way, you confirm that you have read, understood, and agreed to these Terms. If you do not agree, please do not use the platform."
    ]
  },
  {
    title: "2. Who Can Use Swap4Work",
    body: [
      "You may use Swap4Work only if you are at least 18 years old and can form a legally binding contract. You may hold only one account, and your profile information must be accurate and belong to you. Swap4Work is a community platform for individuals — it is not intended for commercial resale operations or business inventory."
    ]
  },
  {
    title: "3. How Swap4Work Works",
    body: [
      "Swap4Work is a community marketplace where members exchange their skills, time, and work hours for physical items. Members negotiate directly with one another — including the number of hours, the type of work, and the schedule — and the platform records those negotiations, agreements, milestones, and logged hours to help both sides stay accountable.",
      "Swap4Work is not a party to any trade between members. We do not own, inspect, store, deliver, or guarantee any item or service exchanged on the platform, and we do not guarantee the quality, safety, condition, or legality of any work performed or item provided.",
      "Swap4Work does not process payments of any kind. The platform exists specifically for exchanges of work for goods without money. You may not use the platform to solicit paid work, to buy or sell items for cash, or to move money between members."
    ]
  },
  {
    title: "4. Your Responsibilities as a Member",
    body: [
      "You are responsible for everything you post and for every trade you agree to. Specifically, you agree to:",
      "• Provide accurate, current information in your profile and listings, including honest photos and fair descriptions of item condition.",
      "• Communicate through the platform's messaging and negotiation tools so there is a clear record of what was agreed.",
      "• Honor the agreements you confirm, log your hours truthfully, and treat milestone deadlines seriously.",
      "• Keep your availability up to date and promptly close or cancel negotiations you no longer intend to pursue."
    ]
  },
  {
    title: "5. Community Rules",
    body: [
      "To keep the community safe and trustworthy, you may not:",
      "• Offer, request, or exchange anything illegal, stolen, counterfeit, unsafe, or that you do not have the right or licenses to provide.",
      "• Post weapons, regulated goods, drugs, adult content, or any item or service restricted by applicable law.",
      "• Harass, threaten, defame, or discriminate against other members.",
      "• Create fake listings, misrepresent items or your identity, or engage in any form of fraud or deception.",
      "• Repeatedly no-show, waste other members' time, or use the platform to spam or advertise outside services."
    ]
  },
  {
    title: "6. Staying Safe",
    body: [
      "Your safety is your responsibility. We encourage every member to meet in public, well-lit places during daytime, to let someone know where you are going, and to bring a friend when doing work at someone's home.",
      "Our phone verification and profile features help build trust, but they are not a background check and do not guarantee anyone's identity or intentions. Review a member's ratings, reviews, and history before agreeing to a trade, and use the report and block tools if anything feels wrong. You always have the right to walk away from a trade at any point before it is confirmed."
    ]
  },
  {
    title: "7. Trades: Negotiation, Agreements, Milestones & Disputes",
    body: [
      "The terms of each trade — hours, work description, location, and due dates — are set entirely by the members involved. Once both members confirm an agreement, it becomes the record of what was promised, and it should be completed as written. Changes should be agreed by both members and reflected in the platform.",
      "Either member may request a mutual cancellation where an agreement has not yet been completed. If a trade goes wrong, either member may open a dispute through the platform. Our team may review the record, request information from both sides, award partial credit for completed milestones, and adjust reputation scores as a result. Dispute decisions are aimed at fairness to both sides and at protecting the community."
    ]
  },
  {
    title: "8. Ratings, Reviews & Moderation",
    body: [
      "Ratings and reviews must be truthful and based on your genuine, first-hand experience. We may remove reviews that are fraudulent, abusive, or unrelated to a real trade.",
      "Members can report listings, messages, and other members, and can block anyone from contacting them. Our moderation team reviews reports and may take action including warnings, hiding listings, suspending accounts, or removing members from the platform. We may adjust reputation and karma points to reflect completed trades, abandoned agreements, or violations of these Terms."
    ]
  },
  {
    title: "9. Intellectual Property",
    body: [
      "You keep ownership of the content you post, such as photos and descriptions. By posting content, you give Swap4Work a non-exclusive, worldwide license to host and display it within the platform as needed to operate the service. Do not post content you do not have the rights to use."
    ]
  },
  {
    title: "10. Privacy",
    body: [
      "Profile information such as your name, photo, general area, skills, and reviews is visible to other members to enable trades. Your exact address is never shown. We handle your personal information as described in our Privacy Policy."
    ]
  },
  {
    title: "11. Disclaimers & Limitation of Liability",
    body: [
      "The platform is provided \"as is\" without warranties of any kind. To the maximum extent permitted by law, Swap4Work is not liable for any loss, injury, or damage arising from your use of the platform or from any trade, meeting, work performed, or item exchanged between members — including disputes over work quality, item condition, hours worked, or no-shows.",
      "Where liability cannot be excluded, our total liability for any claim relating to the platform is limited to the greater of one hundred U.S. dollars ($100) or the total amount you paid to Swap4Work in the twelve months before the claim, which is typically zero."
    ]
  },
  {
    title: "12. Termination",
    body: [
      "You may stop using Swap4Work and delete your account at any time. We may suspend or terminate accounts that violate these Terms, that create risk for other members, or that are required by law. Records of completed trades and moderation actions may be retained after an account is closed."
    ]
  },
  {
    title: "13. Changes to These Terms",
    body: [
      "We may update these Terms as the platform evolves. The version number and effective date at the top of this page always identify the current Terms. If we make material changes, we will ask you to review and accept the updated version the next time you complete or edit your profile. Continuing to use the platform after an update means you accept the revised Terms."
    ]
  },
  {
    title: "14. Governing Law & Contact",
    body: [
      "These Terms are governed by the laws of the State of California, without regard to conflict-of-law rules. If any provision of these Terms is found unenforceable, the remaining provisions stay in effect. Questions about these Terms can be sent to the moderation team through the platform's in-app reporting tools."
    ]
  }
];

export default function Terms() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ScrollText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Terms &amp; Conditions
          </h1>
          <p className="text-gray-600 mb-4">
            The rules for using Swap4Work — written in plain language.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              Version {TERMS_VERSION}
            </Badge>
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              Effective {EFFECTIVE_DATE}
            </Badge>
          </div>
        </div>

        {/* Quick Summary */}
        <Card className="border-orange-200 shadow-lg mb-8 bg-white/90">
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
              The Short Version
            </h2>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-700">
              <div className="flex items-start gap-2">
                <Users className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <p>You trade your skills and time directly with other members — the exchange itself is based on items and services, not payments between members.</p>
              </div>
              <div className="flex items-start gap-2">
                <Clock className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <p>Honor your agreements, log honest hours, and be someone the community can count on.</p>
              </div>
              <div className="flex items-start gap-2">
                <Gavel className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <p>Be safe, be truthful, and follow the community rules — moderation actions apply.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Full Terms */}
        <Card className="border-orange-100 shadow-xl bg-white">
          <CardContent className="p-6 md:p-8">
            <div className="space-y-8">
              {SECTIONS.map((section) => (
                <section key={section.title}>
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">{section.title}</h2>
                  <div className="space-y-3">
                    {section.body.map((paragraph, i) => (
                      <p key={i} className="text-sm text-gray-700 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            <div className="mt-10 pt-6 border-t border-orange-100 text-xs text-gray-500 text-center">
              <p>
                By completing your profile or using Swap4Work, you acknowledge that you have read and accepted these Terms &amp; Conditions (version {TERMS_VERSION}, effective {EFFECTIVE_DATE}).
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}