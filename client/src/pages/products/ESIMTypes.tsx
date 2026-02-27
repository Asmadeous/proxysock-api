import {
  Smartphone,
  Globe,
  Phone,
  MessageSquare,
  Wifi,
  ArrowRight,
  Check,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function ESIMTypes() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Smartphone className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-semibold text-foreground">
            eSIM Solutions
          </h1>
        </div>
        <p className="text-muted-foreground">
          Select the perfect eSIM type for your connectivity needs
        </p>
      </div>

      {/* eSIM Type Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* USA eSIM Card */}
        <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Phone className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">USA eSIM</CardTitle>
                <Badge variant="default" className="mt-1">
                  Voice + Data + Text
                </Badge>
              </div>
            </div>
            <CardDescription className="text-base">
              Complete mobile service with voice calling, data, and text
              messaging for the United States
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Phone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Voice Calling</p>
                  <p className="text-xs text-muted-foreground">
                    US phone number included
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wifi className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">High-Speed Data</p>
                  <p className="text-xs text-muted-foreground">
                    4G/5G connectivity
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">SMS & MMS</p>
                  <p className="text-xs text-muted-foreground">
                    Unlimited texting
                  </p>
                </div>
              </div>
            </div>

            {/* Provider Info */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm mb-2">
                  <span className="font-semibold text-primary">Providers:</span>{" "}
                  Colt & Lyca
                </p>
                <p className="text-xs text-muted-foreground">
                  Get a real US phone number with complete mobile service
                </p>
              </CardContent>
            </Card>

            {/* CTA Button */}
            <Link
              to="/dashboard/usa-esim"
              className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all flex items-center justify-center gap-2 group"
            >
              View USA Plans
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>

        {/* Global eSIM Card */}
        <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/50">
          <CardHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">Global eSIM</CardTitle>
                <Badge variant="secondary" className="mt-1">
                  Data Plans Worldwide
                </Badge>
              </div>
            </div>
            <CardDescription className="text-base">
              Flexible data-only plans with coverage in 170+ countries worldwide
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Features */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Wifi className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Data Only</p>
                  <p className="text-xs text-muted-foreground">
                    High-speed internet access
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Globe className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Global Coverage</p>
                  <p className="text-xs text-muted-foreground">
                    170+ countries supported
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <div className="p-2 rounded-lg bg-primary/10">
                  <MessageSquare className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-sm">SMS Support</p>
                  <p className="text-xs text-muted-foreground">
                    Available on select plans
                  </p>
                </div>
              </div>
            </div>

            {/* Features Info */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="pt-4 pb-4">
                <p className="text-sm font-semibold text-primary mb-2">
                  Features:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" />
                    No phone number assigned
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" />
                    Instant activation worldwide
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3 h-3 text-primary" />
                    Perfect for travelers & remote workers
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* CTA Button */}
            <Link
              to="/dashboard/global-esim"
              className="w-full py-3 px-4 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all flex items-center justify-center gap-2 group"
            >
              View Global Plans
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            Not sure which to choose?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                Choose USA eSIM if you need:
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>A US phone number for calls and texts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Complete mobile service in the United States</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Voice calling capabilities</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 rounded">
                  <Globe className="w-4 h-4 text-primary" />
                </div>
                Choose Global eSIM if you need:
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Data-only plans for multiple countries</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>International travel connectivity</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <span>Flexible plans without phone numbers</span>
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
