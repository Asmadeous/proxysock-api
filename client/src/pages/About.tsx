import { useEffect } from "react";
import { AboutHeroSection } from "@/components/landing/about/AboutHeroSection";
import { CoreValues } from "@/components/landing/about/CoreValues";
import { Journey } from "@/components/landing/about/Journey";
import { Team } from "@/components/landing/about/Team";
import { CallToAction } from "@/components/landing/about/CallToAction";

export default function About() {
  useEffect(() => {
    document.title =
      "About ProxySock - Premium Digital Infrastructure Provider";
  }, []);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <AboutHeroSection />

      {/* Mission & Vision */}
      {/* <MissionVision /> */}
      {/* Core Values */}
      <CoreValues />

      {/* Journey/Timeline */}
      <Journey />

      {/* Team Carousel Section */}
      <Team />

      {/* CTA Section */}
      <CallToAction />

      {/* Why Choose Us - Commented Out */}
      {/* <div className="py-20">...</div> */}

      {/* Testimonials - Commented Out */}
      {/* <div className="py-20 px-4 sm:px-6 lg:px-8">...</div> */}
    </div>
  );
}
