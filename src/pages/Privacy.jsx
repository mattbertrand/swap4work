import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText, Link as LinkIcon } from "lucide-react";

const PRIVACY_VERSION = "1.0";
const EFFECTIVE_DATE = "September 18, 2026";

const SECTIONS = [
  {
    title: "1. What This Policy Covers",
    body: [
      "This Privacy Policy explains what information Swap4Work collects when you use the platform, how we use it, who can see it, and the choices you have. It applies to the Swap4Work marketplace — listings, profiles, negotiations, agreements, reviews, and moderation tools."
    ]
  },
  {
    title: "2. Information We Collect",
    body: [
      "Account information. When you sign up, we collect your name, email address, and sign-in details through the platform's authentication service. If you use a social sign-in option, we receive the basic profile information (such as your name and email) associated with that account.",
      "Profile information. Your profile can include a photo, a phone number used for verification, your general location, a short bio, your skills, and your availability. Location is stored as an approximate map point so we can show distances between members — other members only ever see your city and state.",
      "Listing information. Anything you post as a listing: title, description, category, photos, condition, the hours involved, and the listing's approximate location.",
      "Activity and communications. Your negotiations, offers, and messages with other members, plus the agreements, milestones, and logged work hours that come out of them. We keep these records so both sides of an exchange have a clear history of what was agreed and done.",
      "Trust and safety records. Ratings and reviews you give or receive, reports you file, users you block, dispute records, and the timestamp showing when you accepted our Terms."
    ]
  },
  {
    title: "3. What Other Members Can See",
    body: [
      "Other members can see your name, profile photo, city and state, bio, skills, availability, your active listings, and your ratings, reviews, and completed-exchange history. Your street address and exact coordinates are never displayed to other members.",
      "Your messages are visible to you and the member you're talking to, and to our moderation team when a conversation is reported. Your phone number and email are not shown on your public profile."
    ]
  },
  {
    title: "4. How We Use Your Information",
    body: [
      "We use your information to operate the marketplace: to show your profile and listings, to sort results by distance, to record negotiations, agreements, and logged hours, to send you in-app notifications about your activity, and to run the trust and safety systems — reviews, reports, disputes, and moderation.",
      "We do not sell your personal information, and we do not use your profile information for advertising."
    ]
  },
  {
    title: "5. Location and Address Search",
    body: [
      "When you type an address or use the \"Locate Me\" option, the text you enter is sent to the OpenStreetMap Nominatim service, which converts it into map coordinates. Your stored coordinates are used only for distance-based sorting and filtering. Listings and profiles display city and state only."
    ]
  },
  {
    title: "6. Cookies and Sessions",
    body: [
      "Swap4Work uses essential browser cookies to keep you signed in and to protect your account. We do not set advertising or cross-site tracking cookies."
    ]
  },
  {
    title: "7. Sharing With Others",
    body: [
      "We share your information with other members only as described in section 3. Account and authentication data is processed by the hosting platform that operates Swap4Work's infrastructure on our behalf. We may disclose information if required by law or to protect the rights and safety of our members."
    ]
  },
  {
    title: "8. Data Retention and Account Deletion",
    body: [
      "We keep your information while your account is active. If your account is deleted — at your request through the moderation team, or by us for serious violations — your listings, profile, messages, and reviews are removed, and the anonymized records of past completed exchanges and moderation actions may be retained so that other members' histories remain accurate."
    ]
  },
  {
    title: "9. Your Choices",
    body: [
      "You can edit or update your profile information at any time from your Profile page, delete your own listings, and block any member from contacting you. To request deletion of your account, contact the moderation team through the in-app reporting tools.",
      "You can also choose how visible your worker profile is in member search from your Profile settings."
    ]
  },
  {
    title: "10. Security",
    body: [
      "We use reasonable technical and organizational measures to protect your information, including the platform's authentication and access controls. No method of transmission or storage is perfectly secure, so please treat communications with other members accordingly and avoid sharing sensitive personal details."
    ]
  },
  {
    title: "11. Age Requirements",
    body: [
      "Swap4Work is intended for adults. You must be at least 18 years old to use the platform."
    ]
  },
  {
    title: "12. Changes to This Policy",
    body: [
      "We may update this Privacy Policy as the platform evolves. The version number and effective date at the top of this page always identify the current policy, and material changes will be reflected here for you to review."
    ]
  },
  {
    title: "13. Questions",
    body: [
      "Questions or requests about your personal information can be sent to the moderation team through the platform's in-app reporting tools."
    ]
  }
];

export default function Privacy() {
  return (
    <div className="min-h-screen p-4 md:p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ScrollText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Privacy Policy
          </h1>
          <p className="text-gray-600 mb-4">
            What Swap4Work collects, how it's used, and the choices you have.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              Version {PRIVACY_VERSION}
            </Badge>
            <Badge variant="outline" className="text-orange-700 border-orange-300">
              Effective {EFFECTIVE_DATE}
            </Badge>
          </div>
        </div>

        {/* Quick Summary */}
        <Card className="border-orange-200 shadow-lg mb-8 bg-white/90">
          <CardContent className="p-6">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-orange-600" />
              The Short Version
            </h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              We collect what's needed to run a marketplace of people exchanging
              items for work: your account details, the profile and listing
              information you choose to add, and the records of your
              negotiations, agreements, and reviews. Other members only ever see
              your approximate location — never your street address. We don't
              sell your information or use it for advertising.
            </p>
          </CardContent>
        </Card>

        {/* Full Policy */}
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

            <div className="mt-10 pt-6 border-t border-orange-100 text-sm text-gray-600 text-center space-y-3">
              <p>
                See also our{" "}
                <Link to={createPageUrl("Terms")} className="text-orange-600 underline hover:text-orange-700">
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link to={createPageUrl("CommunityGuidelines")} className="text-orange-600 underline hover:text-orange-700">
                  Community Guidelines
                </Link>
                .
              </p>
              <p className="text-xs text-gray-500">
                Version {PRIVACY_VERSION}, effective {EFFECTIVE_DATE}.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}