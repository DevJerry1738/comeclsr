import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { ArrowLeft, Check, AlertCircle, Wallet } from "lucide-react";

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

export default function DepositPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Fetch admin settings for minimum deposit
  const { data: adminSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin_settings"],
    queryFn: () => rpc.settings.getAdminSettings(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
  });

  const createDepositMutation = useMutation({
    mutationFn: async () => {
      const amount = parseFloat(depositAmount);
      
      if (!depositAmount || isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid deposit amount");
      }
      if (!selectedMethod) {
        throw new Error("Please select a payment method");
      }
      if (!termsAccepted) {
        throw new Error("Please accept the terms and conditions");
      }

      return rpc.payment.createCustomDeposit(amount, selectedMethod);
    },
    onSuccess: () => {
      toast.success("Deposit request submitted! Admin will contact you soon.");
      setTimeout(() => navigate("/dashboard"), 2000);
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create deposit request");
    },
  });

  if (!user) return null;

  const minimumDeposit = adminSettings?.minimum_deposit_amount || 29.99;
  const depositAmountNum = parseFloat(depositAmount) || 0;
  const isAmountValid = depositAmountNum >= minimumDeposit;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-neutral-400 hover:text-white"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-4 text-xl font-semibold">Deposit Credits</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold">
                1
              </div>
              <p className="text-xs mt-2 text-neutral-400">Deposit Amount</p>
            </div>
            <div className="flex-1 h-1 bg-rose-500/30 mx-4" />
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full border border-rose-500 text-rose-400 flex items-center justify-center font-bold">
                2
              </div>
              <p className="text-xs mt-2 text-neutral-400">Payment Method</p>
            </div>
          </div>
        </div>

        {/* Deposit Amount Section */}
        <Card className="bg-neutral-900/60 border-neutral-800 mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Enter Deposit Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Amount (USD)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-neutral-400">$</span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="pl-8 bg-neutral-800 border-neutral-700 text-white placeholder-neutral-500"
                />
              </div>
              <p className="text-xs text-neutral-400 mt-2">
                Minimum deposit: ${minimumDeposit.toFixed(2)}
              </p>
            </div>

            {/* Deposit Summary */}
            <div className="pt-4 border-t border-neutral-800">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Deposit Amount</span>
                <span className="text-2xl font-bold text-rose-400">
                  ${depositAmountNum.toFixed(2)}
                </span>
              </div>
              {!isAmountValid && depositAmount && (
                <p className="text-xs text-red-400 mt-3">
                  Amount must be at least ${minimumDeposit.toFixed(2)}
                </p>
              )}
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
                I agree that admin will contact me via email with payment details. I understand that credits will be added to my account after payment confirmation.
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 border-neutral-700"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-rose-500 hover:bg-rose-600 text-white"
            disabled={!selectedMethod || !termsAccepted || !isAmountValid || createDepositMutation.isPending || settingsLoading}
            onClick={() => createDepositMutation.mutate()}
          >
            {createDepositMutation.isPending ? "Processing..." : `Deposit $${depositAmountNum.toFixed(2)}`}
          </Button>
        </div>

        {/* Info Message */}
        <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-semibold mb-1">How it works</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Enter the amount you want to deposit</li>
              <li>Select your preferred payment method</li>
              <li>Our admin team will send you payment instructions via email</li>
              <li>Once payment is confirmed, credits are added to your account</li>
              <li>Each message deducts ${adminSettings?.message_cost_rate || '5.00'} from your credits</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
