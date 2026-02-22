import { motion } from "framer-motion";

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

        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card/50 rounded-lg p-6 border border-border/50"
            >
              <h3 className="text-lg font-manrope-semibold font-semibold text-foreground mb-2">
                {faq.q}
              </h3>
              <p className="text-muted-foreground font-inter-regular text-sm">
                {faq.a}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
