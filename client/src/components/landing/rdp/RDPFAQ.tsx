import { motion } from "framer-motion";

export const RDPFAQ = () => {
  const faqs = [
    {
      q: "How quickly can I access my RDP?",
      a: "Your RDP server will be ready within 5 minutes of payment. You'll receive login credentials via email.",
    },
    {
      q: "What makes an RDP 'residential'?",
      a: "Residential RDP uses real home internet IPs from ISPs instead of datacenter IPs, providing better trust scores and lower detection rates for automation and trading applications.",
    },
    {
      q: "Why are Canada prices cheaper?",
      a: "We offer special pricing for our Canadian datacenter to provide the best value. All features and performance remain the same across all locations.",
    },
    {
      q: "Can I install any software?",
      a: "Yes! You have full admin access and can install any compatible software on Windows Server 2022, Ubuntu Desktop, or Fedora Desktop.",
    },
    {
      q: "Is there a bandwidth limit?",
      a: "No, all plans include unlimited bandwidth at no extra cost.",
    },
  ];

  return (
    <div className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-manrope-bold font-bold text-foreground text-center mb-12">
          Residential RDP FAQ
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
