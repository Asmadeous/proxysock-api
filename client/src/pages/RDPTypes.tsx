import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
<<<<<<< HEAD
import railsApi from "@/lib/railsApi";
=======

>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
import {
  Monitor,
  Home,
  ArrowRight,
  Check,
  Shield,
  MapPin,
  Zap,
  Clock,
  Globe,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

<<<<<<< HEAD
=======
import api from '../services/api';


>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
interface Country {
  code: string;
  name: string;
  flag: string;
}

export default function RDPTypes() {
  const navigate = useNavigate();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [minPrice, setMinPrice] = useState<number>(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);

<<<<<<< HEAD
      // Fetch ALL products to find RDP ones and calculate min price
      // Assuming GET /products returns all products or supports filtering
      const { data } = await railsApi.get('/products', { params: { category: 'rdp' } });

      let plansData: any[] = [];
      if (Array.isArray(data)) {
        plansData = data;
      } else if (data && Array.isArray((data as any).products)) {
        plansData = (data as any).products;
      }

      const calculatedMinPrice =
        plansData && plansData.length > 0
          ? Math.min(...plansData.map((p) => typeof p.price === 'number' ? p.price : parseFloat(p.price) || 29.99))
          : 29.99;

      // Adjust for cents if necessary (assuming Rails returns dollars or I fix it here)
      // If Rails returns cents, divide by 100. If dollars, keep.
      // Esim was cents. RDP might be dollars in DB?
      // I'll assume dollars for now based on 29.99 default. 
      // If price > 1000, probably cents.
      const finalMinPrice = calculatedMinPrice > 1000 ? calculatedMinPrice / 100 : calculatedMinPrice;

      setMinPrice(finalMinPrice);

      // Default countries
      const countriesData: Country[] = [
=======
      const { data } = await api.get('/web/api/products?product_type=rdp');
      const products = data.products || [];

      const calculatedMinPrice =
        products && products.length > 0
          ? Math.min(...products.map((p: any) => p.price))
          : 29.99;

      setMinPrice(calculatedMinPrice);

      // Default countries
      const countriesFallback: Country[] = [
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
        { code: "US", name: "United States", flag: "🇺🇸" },
        { code: "UK", name: "United Kingdom", flag: "🇬🇧" },
        { code: "DE", name: "Germany", flag: "🇩🇪" },
        { code: "CA", name: "Canada", flag: "🇨🇦" },
        { code: "AU", name: "Australia", flag: "🇦🇺" },
      ];

<<<<<<< HEAD
      // Configuration for countries would come from API in future
      // For now, using static list to remove Supabase dependency
      setCountries(countriesData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      console.error("Error fetching RDP data:", err);
=======
      setCountries(countriesFallback);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch data");
      console.error('Failed to load RDP types logic', err);
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    } finally {
      setLoading(false);
    }
  };

  const handleCountryClick = (countryCode: string) => {
    setSelectedCountry(countryCode);
    navigate(`/dashboard/rdp-plans?country=${countryCode}`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading RDP services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-destructive bg-destructive/5">
        <CardContent className="py-8 text-center">
          <p className="text-destructive font-semibold mb-2">
            Error loading RDP services
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const rdpFeatures = [
    "Real residential IP addresses",
    "Authentic geo-location",
    "High trust score websites",
    "Windows, Ubuntu, Debian, CentOS, Fedora",
    "Bypass geo-restrictions",
    "Social media management",
    "E-commerce operations",
    "Market research",
  ];

  const useCases = [
    "Social Media Management",
    "E-commerce Operations",
    "Market Research",
    "Geo-restricted Content",
    "Ad Verification",
    "Price Monitoring",
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Monitor className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">
              Residential RDP Services
            </h1>
            <Badge variant="default" className="mt-1">
              Premium Remote Desktop
            </Badge>
          </div>
        </div>
        <p className="text-muted-foreground mt-2">
          Premium residential IP remote desktop access with authentic
          geo-location
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Supporting Windows and Linux operating systems with enterprise-grade
          security
        </p>

        <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-semibold text-sm mt-4">
          <Zap className="h-4 w-4" />
          Starting from ${minPrice.toFixed(2)}/month
        </div>
      </div>

      {/* Service Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Home className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-2xl">All Residential IPs</CardTitle>
              <CardDescription>
                Authentic residential IP addresses worldwide
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Key Features */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Check className="h-5 w-5 text-primary" />
                Key Features
              </h3>
              <div className="space-y-2">
                {rdpFeatures.map((feature, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors"
                  >
                    <div className="p-1 rounded bg-primary/10">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Perfect For */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Perfect For
              </h3>
              <div className="flex flex-wrap gap-2 mb-6">
                {useCases.map((useCase, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {useCase}
                  </Badge>
                ))}
              </div>

              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Shield className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">
                        Enterprise Security
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Bank-grade encryption, DDoS protection, and 24/7
                        monitoring to keep your remote desktop secure
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Country Selection */}
      <div>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <MapPin className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-semibold">Select Your Country</h2>
          </div>
          <p className="text-muted-foreground">
            Pick a location for your residential RDP server
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {countries.map((country) => (
            <Card
              key={country.code}
              onMouseEnter={() => setHoveredCountry(country.code)}
              onMouseLeave={() => setHoveredCountry(null)}
              onClick={() => handleCountryClick(country.code)}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${selectedCountry === country.code
                ? "border-primary ring-2 ring-primary/50 scale-105"
                : hoveredCountry === country.code
                  ? "border-primary scale-105"
                  : "hover:border-primary/50"
                }`}
            >
              <CardContent className="pt-6 text-center relative">
                {hoveredCountry === country.code && (
                  <Badge
                    variant="default"
                    className="absolute top-4 right-4 animate-pulse"
                  >
                    Available
                  </Badge>
                )}

                <div
                  className={`text-7xl mb-4 transition-transform duration-300 ${hoveredCountry === country.code
                    ? "scale-110 rotate-3"
                    : "scale-100"
                    }`}
                >
                  {country.flag}
                </div>

                <h3 className="text-xl font-semibold mb-2">{country.name}</h3>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span className="font-mono font-medium">{country.code}</span>
                </div>

                <Button
                  className={`w-full gap-2 ${hoveredCountry === country.code
                    ? ""
                    : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  variant={
                    hoveredCountry === country.code ? "default" : "secondary"
                  }
                >
                  {hoveredCountry === country.code
                    ? "View Plans"
                    : "Select Location"}
                  <ArrowRight
                    className={`h-4 w-4 transition-transform ${hoveredCountry === country.code ? "translate-x-1" : ""
                      }`}
                  />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Why Choose Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">
            Why Choose Our RDP?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Instant Setup</h4>
              <p className="text-sm text-muted-foreground">
                Get your RDP server ready in minutes, not hours
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Authentic IPs</h4>
              <p className="text-sm text-muted-foreground">
                Real residential IPs with high trust scores
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">24/7 Support</h4>
              <p className="text-sm text-muted-foreground">
                Expert technical support whenever you need it
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">99.9% Uptime</h4>
              <p className="text-sm text-muted-foreground">
                Reliable performance with guaranteed availability
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Need Help Choosing?</CardTitle>
          <CardDescription className="text-base">
            Not sure which location or plan is right for you? Our team is ready
            to help you select the perfect solution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => navigate("/contact")} size="lg">
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
