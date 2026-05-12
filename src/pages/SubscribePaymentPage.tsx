import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Check, AlertCircle } from "lucide-react";

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

export default function SubscribePaymentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: currentPlan = {}, isLoading: planLoading } = useQuery({
    queryKey: ["payment", "currentPlan"],
    queryFn: () => rpc.payment.getCurrentPlan(),
  });

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMethod) {
        throw new Error("Please select a payment method");
      }
      if (!termsAccepted) {
        throw new Error("Please accept the terms and conditions");
      }
      // Validate that we have a valid plan ID
      if (!currentPlan?.planId) {
        throw new Error("No subscription plans available. Please contact support.");
      }
      return rpc.payment.createRequest(currentPlan.planId, selectedMethod);
    },
    onSuccess: () => {
      toast.success("Payment request submitted! Admin will contact you soon.");
      setTimeout(() => navigate("/"), 2000);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create payment request");
    },
  });

  if (!user) return null;

  if (planLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 flex items-center justify-center">
        <div className="text-white">Loading subscription details...</div>
      </div>
    );
  }

  const planAmount = currentPlan?.amount || 99.99;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-semibold">Subscribe to ComeClsr</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <p className="text-xs mt-2 text-neutral-400">Plan Selected</p>
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

        {/* Plan Summary */}
        <Card className="bg-neutral-900/60 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle>Subscription Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
              <span className="text-neutral-400">Monthly Plan</span>
              <span className="font-semibold">${planAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-neutral-800">
              <span className="text-neutral-400">Duration</span>
              <span className="font-semibold">30 Days</span>
            </div>
            <div className="flex justify-between items-center pt-4">
              <span className="text-neutral-400">Total Amount</span>
              <span className="text-2xl font-bold text-rose-400">
                ${planAmount.toFixed(2)}
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
                I agree that admin will contact me via email with payment details. I understand that subscription access will be granted after payment confirmation.
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 border-neutral-700"
            onClick={() => navigate("/")}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
            disabled={!selectedMethod || !termsAccepted || createPaymentMutation.isPending || !currentPlan?.planId}
            onClick={() => createPaymentMutation.mutate()}
          >
            {createPaymentMutation.isPending ? "Processing..." : "Proceed to Payment"}
          </Button>
        </div>

        {!currentPlan?.planId && (
          <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-red-300">
              No subscription plans available at this time. Please contact support.
            </div>
          </div>
        )}

        {/* Info Message */}
        <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-300">
            <p className="font-semibold mb-1">How it works</p>
            <p>
              After you submit your payment request, our admin team will send you an email with payment instructions for your selected method. Once payment is confirmed, you'll receive access to start chatting with your assigned agent.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
