import { useState, useEffect } from 'react';
import { Phone, MessageSquare, Wifi, ShoppingCart, Check, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { conversionTracker } from '@/utils/redditPixel';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import api from '../../services/api';


interface USAESIMPlan {
  id: string;
  provider: 'colt' | 'lyca';
  name: string;
  price: number;
  currency_code: string;
  voice_minutes: string;
  sms_included: boolean;
  data_amount: string;
  duration: number;
  duration_unit: string;
  features: string[];
  phone_number_included: boolean;
}

interface CartItem {
  usaEsimPlan?: USAESIMPlan;
  quantity?: number;
  productType: 'usa-esim';
}

// Helper function to get carrier logo
const getCarrierLogo = (provider: string): string => {
  if (provider.toLowerCase() === 'lyca') {
    return '/at&t.png'; // AT&T logo
  }
  if (provider.toLowerCase() === 'colt') {
    return '/t-mobile.png'; // T-Mobile logo
  }
  return '';
};

const USAESIMCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-all duration-200 hover:border-primary/50">
    <CardHeader className="border-b">
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-xl" />
          </div>

          <Skeleton className="h-8 w-3/4 mb-3" />
          <div className="flex items-baseline gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    </CardHeader>

    <CardContent className="pt-6 space-y-6">
      {/* Key Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-muted/50 rounded-lg border text-center">
          <Skeleton className="h-5 w-5 mx-auto mb-2" />
          <Skeleton className="h-4 w-12 mx-auto mb-1" />
          <Skeleton className="h-3 w-8 mx-auto" />
        </div>
        <div className="p-3 bg-muted/50 rounded-lg border text-center">
          <Skeleton className="h-5 w-5 mx-auto mb-2" />
          <Skeleton className="h-4 w-16 mx-auto mb-1" />
          <Skeleton className="h-3 w-6 mx-auto" />
        </div>
        <div className="p-3 bg-muted/50 rounded-lg border text-center">
          <Skeleton className="h-5 w-5 mx-auto mb-2" />
          <Skeleton className="h-4 w-10 mx-auto mb-1" />
          <Skeleton className="h-3 w-6 mx-auto" />
        </div>
      </div>

      {/* Features List */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <Skeleton className="h-4 flex-1" />
        </div>
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <Skeleton className="h-4 flex-1" />
        </div>
        <div className="flex items-start gap-3">
          <Skeleton className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>

      {/* Info Box */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-start gap-2">
            <Skeleton className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div className="space-y-1 flex-1">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-2/3" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Skeleton className="h-10 w-full" />
    </CardContent>
  </Card>
);

export default function USAESIMPlansPage() {
  const [plans, setPlans] = useState<USAESIMPlan[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showSuccessAlert, setShowSuccessAlert] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const { data } = await api.get('/web/api/products?product_type=usa_esim');

        const products = data.products || [];
        const mappedPlans: USAESIMPlan[] = products.map((p: any) => ({
          id: p.id.toString(),
          provider: p.provider_type === 'colt' ? 'colt' : 'lyca',
          name: p.name,
          price: p.price || 0,
          currency_code: p.currency || 'USD',
          voice_minutes: p.calling_minutes === null ? "Unlimited" : (p.calling_minutes ? `${p.calling_minutes} Min` : "0 Min"),
          sms_included: p.sms_quota === null || (p.sms_quota && p.sms_quota > 0),
          data_amount: p.data_gb ? `${p.data_gb} GB` : "Unlimited Data",
          duration: p.duration_days || 30,
          duration_unit: "Days",
          features: p.features || ['4G/5G Coverage', 'Instant QR Activation'],
          phone_number_included: p.esim_type === 'voice_data_sms'
        }));

        setPlans(mappedPlans);
      } catch (err: any) {
        setError(err.message || 'Error loading plans. Please try again.');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlans();

    const loadCartFromStorage = () => {
      try {
        const storedCart = localStorage.getItem('cartItems');
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart);
          if (Array.isArray(parsedCart)) {
            const usaEsimItems = parsedCart.filter(item => item.productType === 'usa-esim');
            setCartItems(usaEsimItems);
          }
        }
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    };

    loadCartFromStorage();

    const handleCartUpdate = () => loadCartFromStorage();
    globalThis.addEventListener('cart-updated', handleCartUpdate);
    return () => globalThis.removeEventListener('cart-updated', handleCartUpdate);
  }, []);

  const addToCart = (plan: USAESIMPlan) => {
    const storedCart = localStorage.getItem('cartItems');
    let currentCart = [];

    if (storedCart) {
      try {
        currentCart = JSON.parse(storedCart);
      } catch (e) {
        currentCart = [];
      }
    }

    const existingItemIndex = currentCart.findIndex(
      (item: CartItem) => item.productType === 'usa-esim' && item.usaEsimPlan?.id === plan.id
    );

    if (existingItemIndex >= 0) {
      currentCart[existingItemIndex].quantity = (currentCart[existingItemIndex].quantity || 0) + 1;
    } else {
      currentCart.push({ usaEsimPlan: plan, quantity: 1, productType: 'usa-esim' });
    }

    localStorage.setItem('cartItems', JSON.stringify(currentCart));
    setCartItems(currentCart.filter((item: CartItem) => item.productType === 'usa-esim'));
    setShowSuccessAlert(true);
    setTimeout(() => setShowSuccessAlert(false), 3000);

    const totalItems = currentCart.reduce((total: number, item: CartItem) => total + (item.quantity || 1), 0);
    globalThis.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalItems } }));

    // Track AddToCart
    conversionTracker.trackAddToCart({
      productId: plan.id,
      productName: plan.name,
      category: "usa-esim",
      value: plan.price / 100,
      currency: plan.currency_code
    });
  };

  const removeFromCart = (planId: string) => {
    const storedCart = localStorage.getItem('cartItems');
    let currentCart = [];

    if (storedCart) {
      try {
        currentCart = JSON.parse(storedCart);
      } catch (e) {
        currentCart = [];
      }
    }

    const updatedCart = currentCart.filter(
      (item: CartItem) => !(item.productType === 'usa-esim' && item.usaEsimPlan?.id === planId)
    );

    localStorage.setItem('cartItems', JSON.stringify(updatedCart));
    setCartItems(updatedCart.filter((item: CartItem) => item.productType === 'usa-esim'));

    const totalItems = updatedCart.reduce((total: number, item: CartItem) => total + (item.quantity || 1), 0);
    globalThis.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalItems } }));
  };

  const updateQuantity = (planId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(planId);
      return;
    }

    const storedCart = localStorage.getItem('cartItems');
    let currentCart = [];

    if (storedCart) {
      try {
        currentCart = JSON.parse(storedCart);
      } catch (e) {
        currentCart = [];
      }
    }

    const updatedCart = currentCart.map((item: CartItem) =>
      item.productType === 'usa-esim' && item.usaEsimPlan?.id === planId ? { ...item, quantity } : item
    );

    localStorage.setItem('cartItems', JSON.stringify(updatedCart));
    setCartItems(updatedCart.filter((item: CartItem) => item.productType === 'usa-esim'));

    const totalItems = updatedCart.reduce((total: number, item: CartItem) => total + (item.quantity || 1), 0);
    globalThis.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: totalItems } }));
  };

  const getCartItemForPlan = (plan: USAESIMPlan) => {
    return cartItems.find(item => item.usaEsimPlan?.id === plan.id);
  };

  const formatPrice = (priceInCents: number, currency: string = 'USD') => {
    const price = priceInCents / 100;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header - Static */}
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => globalThis.history.back()}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>

            <h1 className="text-3xl font-semibold text-foreground">
              USA eSIM Plans
            </h1>
          </div>
          <p className="text-muted-foreground">
            Complete mobile service with voice calling, unlimited texting, and high-speed data
          </p>
        </div>

        {/* Skeleton Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <USAESIMCardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-l-4 border-l-destructive bg-destructive/5">
        <CardContent className="py-8 text-center">
          <p className="text-destructive font-semibold mb-2">
            Error loading USA eSIM plans
          </p>
          <p className="text-muted-foreground text-sm">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => globalThis.history.back()}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>

          <h1 className="text-3xl font-semibold text-foreground">
            USA eSIM Plans
          </h1>
        </div>
        <p className="text-muted-foreground">
          Complete mobile service with voice calling, unlimited texting, and high-speed data
        </p>
      </div>

      {/* Success Alert */}
      {showSuccessAlert && (
        <Card className="border-l-4 border-l-emerald-500 bg-emerald-500/5">
          <CardContent className="flex items-center gap-3 py-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Check className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-emerald-600">Added to Cart!</h3>
              <p className="text-sm text-muted-foreground">
                Your USA eSIM plan has been added to cart.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuccessAlert(false)}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => {
          const cartItem = getCartItemForPlan(plan);
          const inCart = !!cartItem;
          const carrierLogo = getCarrierLogo(plan.provider);

          return (
            <Card key={plan.id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/50">
              <CardHeader className="border-b">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                      <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-bold">
                        <Phone className="h-4 w-4" />
                        {plan.provider.toUpperCase()}
                      </div>

                      {/* Carrier Logo - Sponsored by */}
                      {carrierLogo && (
                        <div className="flex items-center gap-2 bg-muted/50 px-4 py-2 rounded-xl border">
                          <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">Sponsored by</span>
                          <img
                            src={carrierLogo}
                            alt="Carrier Logo"
                            className="h-6 w-auto object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <CardTitle className="text-2xl mb-3">{plan.name}</CardTitle>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-black text-primary">
                        {formatPrice(plan.price, plan.currency_code)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        /{plan.duration} {plan.duration_unit}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-6 space-y-6">
                {/* Key Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-muted/50 rounded-lg border text-center">
                    <Phone className="h-5 w-5 text-primary mx-auto mb-2" />
                    <span className="font-bold text-sm block">{plan.voice_minutes}</span>
                    <span className="text-xs text-muted-foreground">Voice</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg border text-center">
                    <MessageSquare className="h-5 w-5 text-primary mx-auto mb-2" />
                    <span className="font-bold text-sm block">Unlimited</span>
                    <span className="text-xs text-muted-foreground">SMS</span>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg border text-center">
                    <Wifi className="h-5 w-5 text-primary mx-auto mb-2" />
                    <span className="font-bold text-sm block">{plan.data_amount}</span>
                    <span className="text-xs text-muted-foreground">Data</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <Check className="h-5 w-5 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Info Box */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-2">
                      <Phone className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Includes a real US phone number for voice calls and text messaging. Perfect for staying connected in the United States.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Add to Cart Section */}
                {inCart ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-center gap-3 bg-muted/50 rounded-lg p-3 border border-primary/30">
                      <Button
                        onClick={() => updateQuantity(plan.id, (cartItem?.quantity || 1) - 1)}
                        variant="default"
                        size="sm"
                        className="h-9 w-9 p-0"
                      >
                        −
                      </Button>
                      <div className="flex-1 text-center">
                        <span className="text-lg font-bold">{cartItem?.quantity || 0}</span>
                        <div className="text-primary text-xs font-medium">in cart</div>
                      </div>
                      <Button
                        onClick={() => updateQuantity(plan.id, (cartItem?.quantity || 0) + 1)}
                        variant="default"
                        size="sm"
                        className="h-9 w-9 p-0"
                      >
                        +
                      </Button>
                    </div>
                    <Button
                      onClick={() => removeFromCart(plan.id)}
                      variant="destructive"
                      className="w-full"
                    >
                      Remove from Cart
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => addToCart(plan)}
                    className="w-full gap-2"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <Card>
        <CardHeader>
          <CardTitle>Why Choose USA eSIM?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Real US Phone Number</h4>
                <p className="text-sm text-muted-foreground">
                  Get a genuine US phone number for making and receiving calls just like a local resident.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <MessageSquare className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Unlimited Messaging</h4>
                <p className="text-sm text-muted-foreground">
                  Send and receive unlimited SMS and MMS messages to any US number without restrictions.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <Wifi className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">High-Speed Data</h4>
                <p className="text-sm text-muted-foreground">
                  Enjoy fast 4G/5G data connectivity for browsing, streaming, and staying connected on the go.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
                <Check className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">Instant Activation</h4>
                <p className="text-sm text-muted-foreground">
                  Activate your eSIM instantly after purchase. No waiting for physical SIM cards to arrive.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}