export const CallToAction = () => {
  return (
    <div className="landing-theme bg-primary py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-manrope-bold font-bold text-primary-foreground mb-4">
          Ready to Experience the ProxySock Difference?
        </h2>
        <p className="text-lg font-inter-regular text-primary-foreground mb-8">
          Join thousands of satisfied customers worldwide
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a
            href="/register"
            className="inline-flex items-center justify-center px-10 py-4 bg-primary-foreground text-primary rounded-full hover:bg-primary-foreground/90 transition-colors duration-200 text-lg font-semibold"
          >
            Get Started Today
          </a>
          <a
            href="/contact"
            className="inline-flex items-center justify-center px-10 py-4 bg-transparent border border-primary-foreground text-primary-foreground rounded-full hover:bg-primary-foreground hover:text-primary transition-colors duration-200 text-lg font-semibold"
          >
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
};
