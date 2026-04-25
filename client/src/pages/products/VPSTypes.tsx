import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import {
  Server,
  Home,
  ArrowRight,
  Shield,
  MapPin,
  Zap,
  Clock,
  Globe,
  Check
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import api from '../../services/api';


interface Country {
  code: string;
  name: string;
  flag: string;
}

interface VPSTypesProps {
  onNavigate?: (countryCode: string) => void;
}

export default function VPSTypes({ onNavigate }: VPSTypesProps = {}) {
  const navigate = useNavigate();
  const [hoveredCountry, setHoveredCountry] = useState<string | null>(null);
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

      const { data } = await api.get('/web/api/products?product_type=vps');
      const products = data.products || [];

      const calculatedMinPrice = products && products.length > 0
        ? Math.min(...products.map((p: any) => p.price))
        : 9.99;

      setMinPrice(calculatedMinPrice);

      const countriesFallback: Country[] = [
        { code: 'US', name: 'United States', flag: '🇺🇸' },
        { code: 'UK', name: 'United Kingdom', flag: '🇬🇧' },
        { code: 'DE', name: 'Germany', flag: '🇩🇪' },
        { code: 'NL', name: 'Netherlands', flag: '🇳🇱' },
        { code: 'CA', name: 'Canada', flag: '🇨🇦' }
      ];

      setCountries(countriesFallback);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleCountryClick = (countryCode: string) => {
    if (onNavigate) {
      onNavigate(countryCode);
    } else {
      navigate(`/dashboard/vps-plans/residential?country=${countryCode}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading VPS services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-destructive bg-destructive/5">
        <CardContent className="py-8 text-center">
          <p className="text-destructive font-semibold mb-2">Error loading VPS services</p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  const vpsFeatures = [
    'Residential IP addresses',
    'Authentic geo-location',
    'High trust score websites',
    'Ubuntu, Debian, CentOS, RHEL, Rocky, Windows, FreeBSD',
    'Bypass geo-restrictions',
    'Social media management',
    'E-commerce operations',
    'Priority support'
  ];

  const useCases = [
    'Social Media Management',
    'E-commerce Operations',
    'Market Research',
    'Geo-restricted Content',
    'Ad Verification',
    'Price Monitoring'
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Server className="w-8 h-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold text-foreground">Choose Your Location</h1>
            <Badge variant="default" className="mt-1">Residential VPS</Badge>
          </div>
        </div>
        <p className="text-muted-foreground mt-2">
          Premium residential IP VPS with authentic geo-location and multiple OS support
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Supporting Windows, Linux, and BSD operating systems with enterprise-grade security
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
              <CardTitle className="text-2xl">Residential VPS Solutions</CardTitle>
              <CardDescription>Authentic residential IPs worldwide</CardDescription>
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
                {vpsFeatures.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 bg-muted/50 rounded-lg border hover:border-primary/50 transition-colors">
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
                      <h4 className="font-semibold mb-1">Enterprise Security</h4>
                      <p className="text-sm text-muted-foreground">
                        Bank-grade encryption, DDoS protection, and 24/7 monitoring to keep your VPS secure
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
          <p className="text-muted-foreground">Pick a location for your residential VPS server</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {countries.map((country) => (
            <Card
              key={country.code}
              onMouseEnter={() => setHoveredCountry(country.code)}
              onMouseLeave={() => setHoveredCountry(null)}
              onClick={() => handleCountryClick(country.code)}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${hoveredCountry === country.code ? 'border-primary scale-105' : 'hover:border-primary/50'
                }`}
            >
              <CardContent className="pt-6 text-center relative">
                {hoveredCountry === country.code && (
                  <Badge variant="default" className="absolute top-4 right-4">
                    Available
                  </Badge>
                )}

                <div className={`text-7xl mb-4 transition-transform duration-300 ${hoveredCountry === country.code ? 'scale-110' : 'scale-100'
                  }`}>
                  {country.flag}
                </div>

                <h3 className="text-xl font-semibold mb-2">{country.name}</h3>

                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                  <MapPin className="h-4 w-4" />
                  <span className="font-mono font-medium">{country.code}</span>
                </div>

                <Button
                  className={`w-full gap-2 ${hoveredCountry === country.code ? '' : 'bg-muted text-foreground hover:bg-muted/80'
                    }`}
                  variant={hoveredCountry === country.code ? "default" : "secondary"}
                >
                  View Plans
                  <ArrowRight className={`h-4 w-4 transition-transform ${hoveredCountry === country.code ? 'translate-x-1' : ''
                    }`} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Why Choose Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Why Choose Our VPS?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Instant Setup</h4>
              <p className="text-sm text-muted-foreground">VPS ready within minutes of payment</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Server className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">Full Control</h4>
              <p className="text-sm text-muted-foreground">Root access with complete server management</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">24/7 Support</h4>
              <p className="text-sm text-muted-foreground">Expert technical support whenever needed</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2">99.9% Uptime</h4>
              <p className="text-sm text-muted-foreground">Reliable with guaranteed availability</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Section */}
      <Card className="text-center">
        <CardHeader>
          <CardTitle className="text-2xl">Need Help?</CardTitle>
          <CardDescription className="text-base">
            Not sure which location or plan is right for you? Our team is ready to help.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => navigate('/contact')}
            size="lg"
          >
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}