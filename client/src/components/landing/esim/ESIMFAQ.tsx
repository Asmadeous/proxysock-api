import { motion } from "framer-motion";

export const ESIMFAQ = () => {
  const faqs = [
    {
      q: "What is an eSIM?",
      a: "An eSIM is a digital SIM that allows you to activate a cellular plan without a physical SIM card. It's built into newer smartphones and can store multiple profiles.",
    },
    {
      q: "How do I know if my phone supports eSIM?",
      a: "Most phones from 2018 onwards support eSIM. Check Settings > Cellular/Mobile Data for 'Add eSIM' option, or dial *#06# to see if you have an EID number.",
    },
    {
      q: "Can I use eSIM and physical SIM at the same time?",
      a: "Yes! Most eSIM-compatible phones support dual SIM functionality, allowing you to use your regular SIM for calls/texts and eSIM for data.",
    },
    {
      q: "When should I activate my eSIM?",
      a: "You can install the eSIM anytime after purchase, but we recommend activating it just before or upon arrival at your destination to maximize validity period.",
    },
    {
      q: "What happens if I run out of data?",
      a: "You can easily top up your eSIM through our app or website. Simply purchase additional data and it will be added to your existing eSIM.",
    },
  ];

  return (
    <div className="bg-background py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-manrope-bold font-bold text-foreground text-center mb-12">
          eSIM Frequently Asked Questions
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
