import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface ESIMTypesProps {
  onNavigateUSA?: () => void;
  onNavigateGlobal?: () => void;
}

export default function ESIMTypes({ onNavigateUSA, onNavigateGlobal }: ESIMTypesProps = {}) {
  const services = [
    {
      title: "Voice, Data + Text eSIM",
      description: "A local phone number for everyday calls, texts, and mobile data.",
      details: [
        ["Phone number", "USA or UK"],
        ["Service", "Calls, texts, and data"],
        ["Coverage", "Varies by country and plan"],
      ],
      action: "Browse phone-number plans",
      href: "/dashboard/usa-esim",
      onNavigate: onNavigateUSA,
    },
    {
      title: "Data Only eSIM",
      description: "Mobile internet for travel, browsing, and staying in touch through apps.",
      details: [
        ["Phone number", "Not included"],
        ["Service", "Mobile data"],
        ["Coverage", "Country and regional plans"],
      ],
      action: "Browse data plans",
      href: "/dashboard/global-esim",
      onNavigate: onNavigateGlobal,
    },
  ];

  return (
    <div className="w-full space-y-8">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Find your eSIM plan</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
          Choose a service to compare plans, check coverage, and add your selection to the cart.
        </p>
      </header>
      <div className="grid gap-5 md:grid-cols-2">
        {services.map((service) => (
          <section key={service.title} className="flex min-w-0 flex-col rounded-xl border border-border bg-card p-6 sm:p-7">
            <h2 className="text-xl font-semibold tracking-tight">{service.title}</h2>
            <p className="mt-3 min-h-12 text-sm leading-6 text-muted-foreground">{service.description}</p>
            <dl className="my-6 divide-y divide-border border-y border-border">
              {service.details.map(([label, value]) => (
                <div key={label} className="flex justify-between gap-5 py-3 text-sm">
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd className="text-right font-medium">{value}</dd>
                </div>
              ))}
            </dl>
            {service.onNavigate ? (
              <Button onClick={service.onNavigate} className="mt-auto min-h-12 h-auto whitespace-normal">{service.action}</Button>
            ) : (
              <Button asChild className="mt-auto min-h-12 h-auto whitespace-normal">
                <Link to={service.href}>{service.action}</Link>
              </Button>
            )}
          </section>
        ))}
      </div>
      <aside className="border-t border-border pt-6">
        <h2 className="text-sm font-semibold">Before you choose</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Check that your phone is unlocked and supports eSIM. Review the plan’s coverage,
          validity, and activation instructions before purchasing. Available plans vary by country.
        </p>
      </aside>
    </div>
  );
}
