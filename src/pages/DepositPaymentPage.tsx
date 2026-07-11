import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Check, AlertCircle, Zap } from "lucide-react";

const PAYMENT_METHODS = [
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "paypal", label: "PayPal" },
  { value: "crypto", label: "Crypto (Bitcoin, Ethereum)" },
  { value: "coinhub", label: "Coinhub" },
  { value: "apple_pay", label: "Apple Pay" },
  { value: "cashapp", label: "Cash App" },
  { value: "venmo", label: "Venmo" },
  { value: "credit_card", label: "Credit/Debit Card" },
  { value: "other", label: "Other" },
];

interface CreditPackage {
  id: string;
  name: string;
  credit_amount: number;
  price: number;
  messageRate: number;
}

export default function DepositPaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const packageData = (location.state?.package || {}) as CreditPackage;

  const createDepositMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMethod) {
        throw new Error("Please select a payment method");
      }
      if (!termsAccepted) {
        throw new Error("Please accept the terms and conditions");
      }
      if (!packageData?.id) {
        throw new Error("No credit package selected. Please go back and select one.");
      }
      return rpc.payment.createDepositRequest(packageData.id, selectedMethod);
    },
    onSuccess: () => {
      toast.success("Deposit request submitted! Admin will contact you soon.");
      setTimeout(() => navigate("/"), 2000);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create deposit request");
    },
  });

  if (!user) return null;

  if (!packageData?.id) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white mb-6">No credit package selected</p>
          <Button onClick={() => navigate("/deposit")} className="bg-rose-500 hover:bg-rose-600">
            Back to Credit Packages
          </Button>
        </div>
      </div>
    );
  }

  const messagesCount = Math.floor(packageData.price / (packageData.messageRate || 5.00));

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/deposit")}
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-semibold">Deposit Credits to ComeClsr</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                <Check className="w-5 h-5" />
              </div>
              <p className="text-xs mt-2 text-neutral-400">Package Selected</p>
            </div>
            <div className="flex-1 h-1 bg-rose-500/30 mx-4" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              <p className="text-xs mt-2 text-neutral-400">Payment Method</p>
            </div>
            <div className="flex-1 h-1 bg-neutral-800 mx-4" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border border-rose-500 text-rose-400 flex items-center justify-center font-bold">
                3
              </div>
              <p className="text-xs mt-2 text-neutral-400">Confirmation</p>
            </div>
          </div>
        </div>

        {/* Credit Package Summary */}
        <Card className="bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/30 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-rose-400" />
              Credit Package Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-rose-500/20">
              <span className="text-neutral-400">Package</span>
              <span className="font-semibold">{packageData.name}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-rose-500/20">
              <span className="text-neutral-400">Credits</span>
              <span className="font-semibold text-rose-400">{packageData.credit_amount} credits</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-rose-500/20">
              <span className="text-neutral-400">Message Rate</span>
              <span className="font-semibold">${(packageData.messageRate || 5.00).toFixed(2)}/msg</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-rose-500/20">
              <span className="text-neutral-400">Estimated Messages</span>
              <span className="font-semibold text-rose-400">~{messagesCount} messages</span>
            </div>
            <div className="flex justify-between items-center pt-4 bg-rose-500/10 p-3 rounded-lg">
              <span className="text-neutral-300 font-medium">Total Amount</span>
              <span className="text-2xl font-bold text-rose-400">
                ${packageData.price.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card className="bg-neutral-900/60 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle>Select Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.value}
                className="flex items-center p-4 border border-neutral-700 rounded-lg cursor-pointer hover:border-rose-500/50 hover:bg-neutral-800/50 transition"
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={method.value}
                  checked={selectedMethod === method.value}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="mr-4"
                />
                <span className="flex-1 font-medium">{method.label}</span>
                {selectedMethod === method.value && (
                  <Check className="w-5 h-5 text-rose-400" />
                )}
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card className="bg-neutral-900/60 border-neutral-800 mb-8">
          <CardContent className="pt-6">
            <label className="flex items-start p-4 border border-neutral-700 rounded-lg cursor-pointer hover:border-rose-500/50 hover:bg-neutral-800/50 transition">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mr-4 mt-1"
              />
              <span className="text-sm text-neutral-300">
                I understand that admin will contact me via email with secure payment instructions. After payment is verified, credits will be added to my account immediately and I can start chatting with all available agents.
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 border-neutral-700"
            onClick={() => navigate("/deposit")}
          >
            Change Package
          </Button>
          <Button
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
            disabled={!selectedMethod || !termsAccepted || createDepositMutation.isPending}
            onClick={() => createDepositMutation.mutate()}
          >
            {createDepositMutation.isPending ? "Processing..." : "Proceed to Payment"}
          </Button>
        </div>

        {/* How it Works */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-2">How the Credit System Works</p>
            <ul className="space-y-1 text-xs">
              <li>1. Submit your payment request with your preferred method</li>
              <li>2. Admin will email you with secure payment details</li>
              <li>3. Once payment is confirmed, credits are added instantly</li>
              <li>4. Each message costs {packageData.messageRate ? `$${(packageData.messageRate).toFixed(2)}` : "the configured rate"} in credits</li>
              <li>5. You can chat with any available agent after approval</li>
            </ul>
          </div>
        </div>

        {/* Safety Note */}
        <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex gap-3">
          <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-green-300">
            Your payment details will be handled securely by our admin team. We never store payment information in our system.
          </div>
        </div>
      </div>
    </div>
  );
}
