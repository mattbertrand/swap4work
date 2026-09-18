import React, { useEffect } from "react";
import HowItWorksHero from "@/components/howitworks/HowItWorksHero";
import ProcessSteps from "@/components/howitworks/ProcessSteps";
import TradeExamples from "@/components/howitworks/TradeExamples";
import ListingTips from "@/components/howitworks/ListingTips";
import NegotiationExplainer from "@/components/howitworks/NegotiationExplainer";
import AgreementsSection from "@/components/howitworks/AgreementsSection";
import TrackingSection from "@/components/howitworks/TrackingSection";
import ReviewsKarma from "@/components/howitworks/ReviewsKarma";
import LocationPrivacy from "@/components/howitworks/LocationPrivacy";
import TrustSafety from "@/components/howitworks/TrustSafety";
import Faq from "@/components/howitworks/Faq";
import FinalCta from "@/components/howitworks/FinalCta";

export default function HowItWorks() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <HowItWorksHero />
      <ProcessSteps />
      <TradeExamples />
      <ListingTips />
      <NegotiationExplainer />
      <AgreementsSection />
      <TrackingSection />
      <ReviewsKarma />
      <LocationPrivacy />
      <TrustSafety />
      <Faq />
      <FinalCta />
    </div>
  );
}