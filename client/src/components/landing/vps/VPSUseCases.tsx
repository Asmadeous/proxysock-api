import { motion } from "framer-motion";

export const VPSUseCases = () => {
  const useCases = [
    {
      title: "Web Scraping & Automation",
      description:
        "Run scrapers and bots with residential IPs for better success rates and lower detection.",
    },
    {
      title: "SEO & Marketing",
      description:
        "Host SEO tools and marketing automation with trusted residential IP addresses.",
    },
    {
      title: "Development & Testing",
      description:
        "Test applications from residential IPs to simulate real user environments.",
    },
  ];

  return (
    <div className="bg-background py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
            Perfect For
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
