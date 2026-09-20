import React, { useEffect } from "react";
import HomeHero from "@/components/home/HomeHero";
import TwoJourneys from "@/components/home/TwoJourneys";
import FeaturedItems from "@/components/home/FeaturedItems";
import WhatCouldYouTrade from "@/components/home/WhatCouldYouTrade";
import NearbyWorkers from "@/components/home/NearbyWorkers";
import TrustSection from "@/components/home/TrustSection";
import HowItWorksPreview from "@/components/home/HowItWorksPreview";
import HomeCta from "@/components/home/HomeCta";
import SocialFollow from "@/components/home/SocialFollow";

export default function Home() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen">
      <HomeHero />
      <TwoJourneys />
      <FeaturedItems />
      <WhatCouldYouTrade />
      <NearbyWorkers />
      <TrustSection />
      <HowItWorksPreview />
      <HomeCta />
      <SocialFollow />
    </div>
  );
}