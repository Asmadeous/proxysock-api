import { Fragment } from "react";
import { motion } from "framer-motion";
import { useThemeStore } from "../../store/themeStore";
import backgroundNode from "../../assets/images/backgroundNode.webp";
import backgroundNodeRed from "../../assets/images/backgroundNodeRed.webp";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
}

interface TestimonialColumnProps {
  testimonials: Testimonial[];
  reverse?: boolean;
  className?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Alex Chen",
    role: "Data Scientist at TechCorp",
    content:
      "ProxySock's proxy service has been a game-changer for our data collection. 99.9% uptime and lightning-fast speeds. Absolutely recommend!",
    rating: 5,
  },
  {
    name: "Sarah Johnson",
    role: "Digital Marketing Director",
    content:
      "The RDP hosting is perfect for running our marketing automation 24/7. Professional service with excellent support team.",
    rating: 5,
  },
  {
    name: "Mike Williams",
    role: "Senior Developer",
    content:
      "VPS performance exceeds expectations. Great value for money and the technical support is top-notch. Been with them for 2 years now.",
    rating: 5,
  },
];

const TestimonialColumn = ({
  testimonials,
  reverse = false,
  className = "",
}: TestimonialColumnProps) => {
  return (
    <motion.div
      initial={{
        y: reverse ? "-50%" : 0,
      }}
      animate={{
        y: reverse ? 0 : "-50%",
      }}
      transition={{
        duration: 20,
        repeat: Infinity,
        ease: "linear",
      }}
      className={`flex flex-col gap-4 pb-4 ${className}`}
    >
      {Array.from({ length: 2 }).map((_, i) => (
        <Fragment key={i}>
          {testimonials.map((testimonial: Testimonial, index: number) => (
            <div
              key={`${testimonial.name}-${i}-${index}`}
              className="rounded-3xl bg-primary p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center text-primary-foreground font-bold">
                  {testimonial.name
                    .split(" ")
                    .map((n: string) => n[0])
                    .join("")}
                </div>
                <div>
                  <p className="text-primary-foreground font-manrope-semibold font-semibold text-sm">
                    {testimonial.name}
                  </p>
                  <p className="text-primary-foreground/80 font-inter-regular text-xs">
                    {testimonial.role}
                  </p>
                </div>
              </div>
              <p className="text-primary-foreground font-inter-regular text-sm leading-relaxed">
                {testimonial.content}
              </p>
            </div>
          ))}
        </Fragment>
      ))}
    </motion.div>
  );
};

export const TestimonialsSection = () => {
  const { dark } = useThemeStore();
  return (
    <section
      className="relative bg-background py-24 overflow-hidden"
      aria-labelledby="testimonials-heading"
    >
      <div
        className="absolute inset-0 z-0 opacity-20 rotate-[23deg]"
        style={{
          backgroundImage: `url(${dark ? backgroundNode : backgroundNodeRed})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      ></div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center lg:grid-cols-2 lg:gap-16">
          <div>
            <h2
              id="testimonials-heading"
              className="text-4xl md:text-5xl font-manrope-bold font-bold text-foreground mb-4 leading-tight"
            >
              Trusted by Industry Leaders
            </h2>
          </div>
          <div>
            <div className="mt-8 grid h-[350px] sm:h-[400px] gap-4 overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_10%,black_90%,transparent)] md:grid-cols-2 lg:mt-0 lg:h-[500px] xl:h-[600px]">
              <TestimonialColumn testimonials={testimonials} />
              <TestimonialColumn
                testimonials={testimonials.slice().reverse()}
                className="hidden md:flex"
                reverse
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
