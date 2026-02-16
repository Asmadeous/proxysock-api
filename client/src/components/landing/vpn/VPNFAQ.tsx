import { motion } from "framer-motion";

export const VPNFAQ = () => {
  const faqs = [
    {
      q: "How fast is your VPN service?",
      a: "Our VPN offers speeds up to 1 Gbps depending on your plan and server location. We use WireGuard protocol for maximum performance and maintain a 99.9% uptime guarantee.",
    },
    {
      q: "Do you keep logs of my activity?",
      a: "No, we have a strict no-logs policy. We don't store any information about your internet activity, IP addresses, or connection timestamps.",
    },
    {
      q: "How many devices can I connect?",
      a: "Device limits vary by plan: Basic (2 devices), Pro (5 devices), Premium (10 devices), and Ultimate (unlimited devices).",
    },
    {
      q: "Can I use VPN for streaming and gaming?",
      a: "Yes! Our VPN is optimized for streaming services and gaming. Choose servers close to content sources for best performance.",
    },
    {
      q: "What protocols do you support?",
      a: "We support OpenVPN, WireGuard, IKEv2, and SSTP protocols. WireGuard is recommended for best speed and security.",
    },
    {
      q: "Is your VPN service secure?",
      a: "Yes, we use military-grade AES-256 encryption, perfect forward secrecy, and include a kill switch to prevent data leaks if your connection drops.",
    },
    {
      q: "Can I get a refund?",
      a: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with our service, contact our support team for a full refund.",
    },
  ];

  return (
    <div className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-manrope-bold font-bold text-foreground text-center mb-12">
          VPN Service FAQ
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
