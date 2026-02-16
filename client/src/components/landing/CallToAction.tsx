import { Link } from "react-router-dom";


interface CallToActionProps {
  isAuthenticated: boolean;
  trackConversion: (
    eventName: string,
    eventType: string,
    pagePath: string
  ) => void;
}

export const CallToAction = ({
  isAuthenticated,
  trackConversion,
}: CallToActionProps) => {

  return (
    <section className="bg-primary py-20">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-4xl sm:text-5xl font-manrope-bold font-bold text-primary-foreground mb-6">
          Ready to Scale your Business?
        </h2>
        <p className="text-base sm:text-lg font-inter-regular text-primary-foreground mb-8 sm:mb-10">
          Join 15,000+ businesses using our premium digital infrastructure
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to={isAuthenticated ? "/dashboard" : "/register"}
            onClick={() =>
              trackConversion(
                "final_cta_lead",
                "conversion",
                isAuthenticated ? "/dashboard" : "/register"
              )
            }
            className="inline-flex items-center justify-center px-6 sm:px-10 py-3 sm:py-4 bg-primary-foreground text-primary rounded-full hover:bg-primary-foreground/90 transition-all duration-200 text-sm sm:text-lg font-manrope-semibold font-semibold"
          >
            Start Now From $2.99/proxy
          </Link>
          <Link
            to="/contact"
            onClick={() =>
              trackConversion("contact_sales_lead", "sales", "/contact")
            }
            className="inline-flex items-center justify-center px-6 sm:px-10 py-3 sm:py-4 bg-transparent border border-primary-foreground text-primary-foreground rounded-full hover:bg-primary-foreground hover:text-primary transition-all duration-200 text-sm sm:text-lg font-manrope-semibold font-semibold"
          >
            Contact Sales
          </Link>
        </div>
      </div>
    </section>
  );
};
