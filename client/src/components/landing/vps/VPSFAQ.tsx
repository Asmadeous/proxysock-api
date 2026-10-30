import { FAQList } from "../FAQList";

export const VPSFAQ = () => {
  const faqs = [
    {
      q: "What makes a VPS 'residential'?",
      a: "Residential VPS uses real residential IP addresses from ISPs, making your server appear as a home internet connection rather than a datacenter. This provides better trust scores and lower detection rates.",
    },
    {
      q: "Why are Canada prices cheaper?",
      a: "We offer special pricing for our Canadian datacenter to provide the best value. All features remain the same across all locations.",
    },
    {
      q: "Can I upgrade my VPS later?",
      a: "Yes! You can upgrade your VPS anytime from your dashboard. Upgrades are processed instantly with minimal downtime.",
    },
    {
      q: "Which operating systems are available?",
      a: "All plans support Ubuntu Server, Debian, Rocky Linux, AlmaLinux, and Windows Server 2022. You can choose during deployment.",
    },
  ];

  return (
    <div className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-manrope-bold font-bold text-foreground text-center mb-12">
          Residential VPS FAQ
        </h2>

        <FAQList items={faqs.map((faq) => ({ question: faq.q, answer: faq.a }))} />
      </div>
    </div>
  );
};
