
import { motion } from "framer-motion";


const timeline = [
  {
    year: "2019",
    title: "Company Founded",
    description:
      "Started with a vision to provide reliable and secure proxy services to businesses worldwide.",
  },
  {
    year: "2020",
    title: "Global Expansion",
    description:
      "Expanded our network to 50+ countries, serving over 1,000 customers globally.",
  },
  {
    year: "2021",
    title: "Infrastructure Growth",
    description:
      "Invested heavily in infrastructure, reaching 25,000+ available IPs and 99.9% uptime.",
  },
  {
    year: "2022",
    title: "Product Diversification",
    description:
      "Launched RDP and VPS hosting services, becoming a comprehensive digital infrastructure provider.",
  },
  {
    year: "2023",
    title: "Technology Innovation",
    description:
      "Introduced advanced authentication methods and enhanced security protocols across all services.",
  },
  {
    year: "2024",
    title: "Market Leadership",
    description:
      "Reached 15,000+ customers and 50,000+ IPs, establishing ourselves as an industry leader.",
  },
];

export const Journey = () => {


  return (
    <div className="relative bg-background py-20 px-4 sm:px-6 lg:px-8">
      <div
        className="absolute inset-0 z-0 opacity-20 rotate-180"
      // style={{
      //   backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
      //   backgroundSize: "cover",
      //   backgroundPosition: "center",
      //   backgroundRepeat: "no-repeat",
      // }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl sm:text-5xl font-manrope-extrabold  text-foreground mb-4">
            Our Journey
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {timeline.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-primary rounded-3xl p-6 hover:bg-primary/90 transition-colors duration-300"
            >
              <div className="text-primary-foreground font-manrope-bold font-bold text-2xl mb-3">
                {item.year}
              </div>
              <h3 className="text-primary-foreground font-manrope-semibold font-semibold text-xl mb-2">
                {item.title}
              </h3>
              <p className="text-primary-foreground/90 font-inter-regular text-sm leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
