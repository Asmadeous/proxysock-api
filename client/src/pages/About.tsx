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
<<<<<<< HEAD

    const s1 = document.createElement("script");
    const s0 = document.getElementsByTagName("script")[0];
    s1.async = true;
    s1.src = "https://embed.tawk.to/67bef4165710c5190bd5e864/1il0uiubo";
    s1.charset = "UTF-8";
    s1.setAttribute("crossorigin", "*");
    if (s0.parentNode) {
      s0.parentNode.insertBefore(s1, s0);
    }

    return () => {
      s1.remove();
    };
=======
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
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
