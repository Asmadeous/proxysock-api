"use client"
<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
import * as authService from '../services/railsAuth';
=======
import React, { useState, useEffect, useCallback } from 'react';

import DepositPayment from '../pages/DepositPayments';
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
import { Wallet, CreditCard, Bitcoin, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
<<<<<<< HEAD
=======
import { fetchBalance } from '../services/api';
import api from '../services/api';
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)

interface BalanceProps {
  className?: string;
  variant?: "default" | "sidebar";
}

type PaymentMethodType = 'paystack' | 'crypto_plisio' | 'crypto_payvra';

const PaymentMethodCard = ({
  title,
  description,
  icon: Icon,
  isSelected,
  onClick,
  colorClass,
  loading
}: {
  id: PaymentMethodType;
  title: string;
  description: string;
  icon: any;
  isSelected: boolean;
  onClick: () => void;
  colorClass: string;
  loading: boolean;
}) => (
  <Card
    className={`cursor-pointer transition-all ${isSelected
      ? `border-${colorClass}-500 bg-${colorClass}-500/5 ring-2 ring-${colorClass}-500/50`
      : 'hover:border-primary/50'
      }`}
    onClick={() => !loading && onClick()}
  >
    <CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className={`w-6 h-6 text-${colorClass}-600 dark:text-${colorClass}-400`} />
          <div>
            <div className="font-semibold">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
        </div>
        {isSelected && (
          <div className={`w-5 h-5 bg-${colorClass}-500 rounded-full flex items-center justify-center`}>
            <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const UserBalance: React.FC<BalanceProps> = ({ className, variant = "default" }) => {
  const [balance, setBalance] = useState<number | null>(null);
<<<<<<< HEAD
=======
  const [currency, setCurrency] = useState<string>('USD');
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('paystack');
  const [amount, setAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<{
    client_secret?: string;
    payment_url?: string;
    checkout_url?: string;
    payment_id?: string;
  } | null>(null);
<<<<<<< HEAD
  const [user, setUser] = useState<any>(null);

  // const fetchExchangeRate = async (): Promise<number> => {
  //   // TODO: Implement actual exchange rate fetching from Rails API
  //   // returning mock rate for now to prevent crashes
  //   return 1500;
  // };

  useEffect(() => {
    let mounted = true;

    const fetchUserAndBalance = async () => {
      try {
        const meData = await authService.getCurrentUser();
        if (!mounted) return;

        if (!meData || !meData.user) {
          setError('Please log in to view balance');
          return;
        }

        setUser(meData.user);
        setBalance(meData.wallet_balance || 0);
      } catch (err) {
        if (mounted) {
          setError('Failed to load balance');
        }
      }
    };

    fetchUserAndBalance();

    // Poll for balance updates every 30 seconds instead of using websocket
    const interval = setInterval(fetchUserAndBalance, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleOpenModal = () => {
    if (!user) {
      setError('Please log in to add funds');
      return;
    }
=======

  const loadBalance = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Please log in to view balance');
        return;
      }
      const { data } = await fetchBalance();
      setBalance(data.available_balance ?? 0);
      setCurrency(data.currency || 'USD');
      setError(null);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        setError('Please log in to view balance');
      } else {
        setError('Failed to load balance');
      }
    }
  }, []);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const handleOpenModal = () => {
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    setIsModalOpen(true);
    setError(null);
    setAmount('');
    setPaymentData(null);
    setLoading(false);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPaymentData(null);
    setError(null);
    setLoading(false);
  };

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
<<<<<<< HEAD
    let total = Number.parseFloat(amount);
    // let convertedAmount = total;

    if (Number.isNaN(total) || total < 0.01) {
      setError('Amount must be at least $0.01');
=======
    const total = Number.parseFloat(amount);

    if (Number.isNaN(total) || total < 10) {
      setError('Amount must be at least $10');
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
      setLoading(false);
      return;
    }
    if (total > 10000) {
      setError('Maximum deposit amount is $10,000');
      setLoading(false);
      return;
    }

<<<<<<< HEAD
    // Logic irrelevant as endpoint is not implemented
    if (paymentMethod === 'paystack') {
      // Placeholder for future implementation
    }

    try {
      // TODO: Implement deposit endpoint in Rails API
      // For now, we'll just throw an error as the endpoint doesn't exist yet in the new system
      throw new Error('Deposit system is currently under maintenance. Please contact support.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate deposit');
=======
    try {
      const strippedGateway = paymentMethod.replace("crypto_", "");
      const { data } = await api.post('/web/api/wallet/deposit', {
        amount: total,
        gateway: strippedGateway,
        currency: 'USD'
      });

      if (data?.payment_url) {
        window.location.href = data.payment_url;
      } else {
        setError('Failed to generate payment link');
      }
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to initiate deposit');
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
    } finally {
      setLoading(false);
    }
  };

  const formatBalance = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
<<<<<<< HEAD
      currency: 'USD',
=======
      currency: currency,
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
      minimumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className={className}>
      {variant === "sidebar" ? (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-foreground/80 px-1">
            <Wallet className="h-4 w-4" />
            <span className="font-medium">
              {balance !== null ? formatBalance(balance) : '...'}
            </span>
          </div>
          <Button
            onClick={handleOpenModal}
<<<<<<< HEAD
            disabled={!user}
=======
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
            size="sm"
            variant="secondary"
            className="w-full h-8 text-xs font-semibold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/20"
          >
            Deposit Funds
          </Button>
        </div>
      ) : (
        <Button
          onClick={handleOpenModal}
<<<<<<< HEAD
          disabled={!user}
          title={!user ? "Please log in to view balance" : "Click to add funds"}
=======
          title="Click to add funds"
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
          className="gap-2"
        >
          <Wallet className="h-4 w-4" />
          {balance !== null ? formatBalance(balance) : 'Loading...'}
        </Button>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Wallet className="h-6 w-6 text-primary" />
              Add Funds to Wallet
            </DialogTitle>
          </DialogHeader>

          {!paymentData ? (
            <form onSubmit={handleDeposit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="deposit-amount" className="text-base font-medium">
                  Amount (USD)
                </Label>
                <Input
                  id="deposit-amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
<<<<<<< HEAD
                  placeholder="Enter amount (min: $0.01, max: $10,000)"
                  min="0.01"
                  max="10000"
                  step="0.01"
=======
                  placeholder="Enter amount (min: $10.00, max: $10,000)"
                  min="10"
                  max="10000"
                  step="1"
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
                  required
                  disabled={loading}
                />
                <div className="text-sm text-muted-foreground mt-2">
                  <p>Current balance: {balance !== null ? formatBalance(balance) : 'Loading...'}</p>
                  {paymentMethod === 'paystack' && (
                    <p className="mt-1 text-warning">
                      Note: Amount will be converted to NGN for Paystack payment
                    </p>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <Label className="text-base font-medium">
                  Payment Method
                </Label>
                <div className="space-y-3">
<<<<<<< HEAD

=======
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
                  <PaymentMethodCard
                    id="paystack"
                    title="Pay with Card (Paystack)"
                    description="Credit/Debit Cards, Mobile Money"
                    icon={CreditCard}
                    isSelected={paymentMethod === 'paystack'}
                    onClick={() => setPaymentMethod('paystack')}
                    colorClass="cyan"
                    loading={loading}
                  />
                  <PaymentMethodCard
                    id="crypto_payvra"
                    title="Pay with Crypto (Payvra)"
                    description="BTC, ETH, USDT & more"
                    icon={Bitcoin}
                    isSelected={paymentMethod === 'crypto_payvra'}
                    onClick={() => setPaymentMethod('crypto_payvra')}
                    colorClass="blue"
                    loading={loading}
                  />
                  <PaymentMethodCard
                    id="crypto_plisio"
                    title="Pay with Crypto (Plisio)"
                    description="BTC, ETH, USDT & more"
                    icon={Bitcoin}
                    isSelected={paymentMethod === 'crypto_plisio'}
                    onClick={() => setPaymentMethod('crypto_plisio')}
                    colorClass="orange"
                    loading={loading}
                  />
                </div>
              </div>
              {error && (
                <Card className="border-l-4 border-l-destructive bg-destructive/5">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                      <p className="text-sm text-destructive">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  onClick={handleCloseModal}
                  variant="outline"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Proceed to Payment'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <Card className="border-l-4 border-l-emerald-500 bg-emerald-500/5">
                <CardContent className="py-3 px-4">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
<<<<<<< HEAD
                    Payment processing is coming soon.
                  </p>
                </CardContent>
              </Card>
=======
                    Payment session created successfully! Complete your payment to add funds.
                  </p>
                </CardContent>
              </Card>
              <DepositPayment
                clientSecret={paymentData.client_secret}
                paymentUrl={paymentData.payment_url || paymentData.checkout_url}
                onCancel={handleCloseModal}
              />
>>>>>>> 83dd057 (feat: implement support chat system, strict ticket order validation, and fix ticket creation body error)
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserBalance;