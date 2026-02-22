import { motion } from "framer-motion";
import { StarIcon } from "lucide-react";

export const RDPTestimonials = () => {
  const testimonials = [
    {
      name: "David Lee",
      role: "Forex Trader",
      content:
        "Running MT4 on their residential RDP for 8 months now. Zero downtime, excellent speeds, no detection issues.",
      rating: 5,
    },
    {
      name: "Emma Wilson",
      role: "SEO Specialist",
      content:
        "The residential IPs make all the difference for my SEO tools. Best pricing I've found, especially in Canada!",
      rating: 5,
    },
    {
      name: "James Brown",
      role: "Developer",
      content:
        "Great for hosting bots 24/7 with residential IPs. Support team helped me set everything up quickly.",
      rating: 5,
    },
  ];

  return (
    <div className="bg-card py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
            What Our Customers Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="bg-background/50 backdrop-blur-sm p-6 rounded-xl border border-border/50"
            >
              <div className="flex mb-3">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <StarIcon key={i} className="h-5 w-5 text-yellow-400" />
                ))}
              </div>
              <p className="text-muted-foreground mb-4 font-inter-regular">
                "{testimonial.content}"
              </p>
              <div className="border-t border-border pt-4">
                <p className="text-foreground font-manrope-semibold font-semibold">
                  {testimonial.name}
                </p>
                <p className="text-muted-foreground text-sm font-inter-regular">
                  {testimonial.role}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
