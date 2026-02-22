import { motion } from "framer-motion";

export const VPNUseCases = () => {
  const useCases = [
    {
      title: "Secure Remote Work",
      description:
        "Protect your company data and access internal resources securely from anywhere in the world with enterprise-grade encryption.",
    },
    {
      title: "Bypass Geo-Restrictions",
      description:
        "Access streaming services, websites, and content that are blocked or restricted in your region with our global server network.",
    },
    {
      title: "Public Wi-Fi Protection",
      description:
        "Safely connect to public Wi-Fi networks in cafes, airports, and hotels without worrying about hackers or data theft.",
    },
    {
      title: "Privacy & Anonymity",
      description:
        "Browse the internet anonymously, hide your IP address, and protect your online identity from trackers and surveillance.",
    },
    {
      title: "Gaming & Streaming",
      description:
        "Reduce latency, prevent DDoS attacks, and access geo-restricted gaming content with our high-speed VPN servers.",
    },
    {
      title: "Torrenting & P2P",
      description:
        "Download and share files safely with our no-logs policy and dedicated P2P-optimized servers.",
    },
  ];

  return (
    <div className="bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
            Perfect For
          </h2>
          <p className="text-muted-foreground font-inter-regular max-w-2xl mx-auto">
            Our VPN service is designed for modern digital lifestyles and business needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-card/80 backdrop-blur-xl rounded-lg p-6 border border-border"
            >
              <h3 className="text-xl font-manrope-bold font-bold text-foreground mb-3">
                {useCase.title}
              </h3>
              <p className="text-muted-foreground font-inter-regular">
                {useCase.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
