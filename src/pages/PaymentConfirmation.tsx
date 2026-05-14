import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Check, CheckCircle } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  amount: number;
  duration_days: number;
}

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

export default function PaymentConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const plan = location.state?.plan as Plan;

  const createPaymentMutation = useMutation({
    mutationFn: async () => {
      if (!selectedMethod) {
        throw new Error("Please select a payment method");
      }
      if (!termsAccepted) {
        throw new Error("Please accept the terms and conditions");
      }
      if (!plan?.id) {
        throw new Error("Invalid plan. Please go back and select a plan.");
      }
      return rpc.payment.createRequest(plan.id, selectedMethod);
    },
    onSuccess: (data: any) => {
      console.log("Payment request created successfully:", data);
      setIsSubmitted(true);
      toast.success("Payment request submitted successfully! Admin will contact you soon.");
      setTimeout(() => navigate("/dashboard"), 3000);
    },
    onError: (err: any) => {
      console.error("Payment creation error:", err);
      toast.error(err.message || "Failed to create payment request");
    },
  });

  if (!user) return null;

  // Redirect if no plan provided
  if (!plan) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">No plan selected. Please go back and choose a plan.</p>
          <Button onClick={() => navigate("/subscribe")} variant="outline">
            Choose a Plan
          </Button>
        </div>
      </div>
    );
  }

  // Success state
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 flex items-center justify-center text-white">
        <Card className="bg-neutral-900/60 border-neutral-800 max-w-md">
          <CardContent className="pt-8 text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-400" />
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-3">Request Submitted!</h2>
            <p className="text-neutral-300 mb-6">
              Your payment request has been received. Our admin team will contact you via email with payment instructions for your selected method.
            </p>
            <p className="text-sm text-neutral-400">
              Redirecting to your dashboard in 3 seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/subscribe")}
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-semibold">Payment Confirmation</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <p className="text-xs mt-2 text-neutral-400">Plan Selected</p>
            </div>
            <div className="flex-1 h-1 bg-rose-500/30 mx-4" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                2
              </div>
              <p className="text-xs mt-2 text-neutral-400">Payment Details</p>
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
        <Card className="bg-gradient-to-b from-rose-500/10 to-neutral-900/60 border-rose-500/30 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Selected Plan</span>
              <Badge className="bg-gradient-to-r from-rose-500 to-pink-500 text-white">
                {plan.name}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-4 border-b border-neutral-700">
              <span className="text-neutral-400">Plan</span>
              <span className="font-semibold">{plan.name}</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-neutral-700">
              <span className="text-neutral-400">Duration</span>
              <span className="font-semibold">{plan.duration_days} Days</span>
            </div>
            <div className="flex justify-between items-center pb-4 border-b border-neutral-700">
              <span className="text-neutral-400">Amount</span>
              <span className="font-semibold">${plan.amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center pt-2">
              <span className="text-neutral-400">User Email</span>
              <span className="font-semibold text-rose-300">{user?.email}</span>
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
                I confirm this payment request and understand that:
                <ul className="mt-2 ml-4 space-y-1 text-xs">
                  <li>• Admin will contact me via email with payment instructions</li>
                  <li>• I will make the payment using my selected method</li>
                  <li>• Admin will approve the payment on the admin dashboard</li>
                  <li>• I will receive a confirmation email once approved</li>
                  <li>• My subscription will be activated immediately after approval</li>
                </ul>
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Payment Process Flow Info */}
        <Card className="bg-blue-500/10 border-blue-500/30 mb-8">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-semibold text-blue-300">Submit Request</p>
                  <p className="text-sm text-neutral-300">You submit this payment request</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <div>
                  <p className="font-semibold text-blue-300">Email Instructions</p>
                  <p className="text-sm text-neutral-300">Admin sends payment details via email</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  3
                </div>
                <div>
                  <p className="font-semibold text-blue-300">Make Payment</p>
                  <p className="text-sm text-neutral-300">You send payment using selected method</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  4
                </div>
                <div>
                  <p className="font-semibold text-blue-300">Admin Approves</p>
                  <p className="text-sm text-neutral-300">Admin verifies payment in dashboard</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                  5
                </div>
                <div>
                  <p className="font-semibold text-blue-300">Confirmation</p>
                  <p className="text-sm text-neutral-300">You receive confirmation, access granted</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 border-neutral-700"
            onClick={() => navigate("/subscribe")}
            disabled={createPaymentMutation.isPending}
          >
            Back
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-semibold"
            disabled={!selectedMethod || !termsAccepted || createPaymentMutation.isPending}
            onClick={() => createPaymentMutation.mutate()}
          >
            {createPaymentMutation.isPending ? "Submitting..." : "Confirm & Submit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
