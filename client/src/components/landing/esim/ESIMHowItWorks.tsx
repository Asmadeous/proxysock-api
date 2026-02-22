import { motion } from "framer-motion";

export const ESIMHowItWorks = () => {
  const steps = [
    {
      number: 1,
      title: "Choose Your Plan",
      description: "Select the destination and data package that fits your travel needs.",
    },
    {
      number: 2,
      title: "Scan QR Code",
      description: "Receive your eSIM QR code instantly via email and scan it with your phone.",
    },
    {
      number: 3,
      title: "Start Using Data",
      description: "Your eSIM activates automatically. Start using data immediately upon arrival.",
    },
  ];

  return (
    <div className="bg-card py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-manrope-bold font-bold text-foreground mb-3">
            How eSIM Works
          </h2>
          <p className="text-base font-inter-regular text-muted-foreground max-w-2xl mx-auto">
            Get connected in 3 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-4">
                <span className="text-2xl font-manrope-bold font-bold text-primary">
                  {step.number}
                </span>
              </div>
              <h3 className="text-xl font-manrope-bold font-bold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground font-inter-regular">
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
