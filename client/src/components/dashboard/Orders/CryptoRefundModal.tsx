import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import api from "../../../services/api";

interface CryptoRefundModalProps {
  orderId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CryptoRefundModal = ({
  orderId,
  isOpen,
  onClose,
  onSuccess,
}: CryptoRefundModalProps) => {
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [isRefunding, setIsRefunding] = useState(false);

  const submitCryptoRefund = async () => {
    if (!orderId || !address) return;
    try {
      setIsRefunding(true);
      await api.post(`/web/api/orders/${orderId}/claim_crypto_refund`, {
        address,
        network: network || "USDT",
      });
      onSuccess();
      onClose();
      setAddress("");
      setNetwork("");
    } catch (e: any) {
      console.error(e);
      alert(e.response?.data?.error || "Failed to process refund request");
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !isRefunding) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Claim Crypto Refund</DialogTitle>
          <DialogDescription>
            This order failed after payment. Enter your crypto wallet address to
            securely receive your refund.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="address" className="text-sm font-medium">
              Refund Address
            </label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              disabled={isRefunding}
            />
          </div>
          <div className="grid gap-2">
            <label htmlFor="network" className="text-sm font-medium">
              Network/Currency
            </label>
            <Input
              id="network"
              value={network}
              onChange={(e) => setNetwork(e.target.value)}
              placeholder="USDT / BTC / ETH"
              disabled={isRefunding}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isRefunding}>
            Cancel
          </Button>
          <Button onClick={submitCryptoRefund} disabled={isRefunding || !address}>
            {isRefunding ? "Processing..." : "Submit Refund"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
