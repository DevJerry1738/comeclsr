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
  { value: "paypal", label: "PayPal" },
  { value: "apple_pay", label: "Apple Pay" },
  { value: "cashapp", label: "Cash App" },
  { value: "venmo", label: "Venmo" },
  { value: "credit_card", label: "Credit/Debit Card" },
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
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 sticky top-0 z-50 h-14 flex items-center">
        <div className="max-w-4xl mx-auto w-full flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/dashboard")}
            className="text-neutral-400 hover:text-white hover:bg-white/5 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="ml-3 text-lg font-semibold tracking-tight">Deposit Credits</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Progress Indicator */}
        <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center font-bold shadow-lg shadow-rose-500/20">
                1
              </div>
              <p className="text-xs font-semibold mt-2.5 text-neutral-200">Deposit Amount</p>
            </div>
            <div className="flex-1 h-[2px] bg-rose-500/20 mx-4" />
            <div className="flex flex-col items-center">
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold transition-all ${
                selectedMethod 
                  ? "bg-gradient-to-br from-rose-500 to-pink-600 text-white shadow-lg shadow-rose-500/20"
                  : "border border-rose-500/30 text-rose-400"
              }`}>
                2
              </div>
              <p className="text-xs font-semibold mt-2.5 text-neutral-400">Payment Method</p>
            </div>
          </div>
        </div>

        {/* Deposit Amount Section */}
        <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-4">
            <CardTitle className="flex items-center gap-3 text-lg font-bold text-white">
              <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-rose-400" />
              </div>
              Enter Deposit Amount
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-neutral-200 tracking-wide">
                Amount (USD)
              </label>
              <div className="flex items-stretch bg-neutral-950/40 border border-white/10 rounded-2xl focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/10 transition-all overflow-hidden shadow-inner">
                <div className="flex items-center justify-center px-4 bg-white/[0.03] border-r border-white/10 text-neutral-400 font-bold select-none text-base min-h-[48px]">
                  $
                </div>
                <input
                  type="number"
                  placeholder="0.00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  min="0"
                  step="0.01"
                  className="w-full bg-transparent border-0 px-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-0 text-base min-h-[48px]"
                />
              </div>
              <p className="text-xs text-neutral-400 mt-2 ml-1">
                Minimum deposit required: ${minimumDeposit.toFixed(2)}
              </p>
            </div>

            {/* Deposit Summary */}
            <div className="pt-5 border-t border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-sm text-neutral-400 font-medium">Custom Deposit Amount</span>
                <span className="text-2xl font-bold text-rose-400 tracking-tight">
                  ${depositAmountNum.toFixed(2)}
                </span>
              </div>
              {!isAmountValid && depositAmount && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl mt-4">
                  Amount must be at least ${minimumDeposit.toFixed(2)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Selection */}
        <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl p-6">
          <CardHeader className="p-0 pb-4 mb-4 border-b border-white/5">
            <CardTitle className="text-lg font-bold text-white">Select Payment Method</CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-2.5">
            {PAYMENT_METHODS.map((method) => (
              <label
                key={method.value}
                className={`flex items-center p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${
                  selectedMethod === method.value
                    ? "bg-rose-500/10 border-rose-500/40 ring-1 ring-rose-500/30"
                    : "bg-white/[0.01] border-white/5 hover:border-white/10 hover:bg-white/[0.03]"
                }`}
              >
                <input
                  type="radio"
                  name="payment_method"
                  value={method.value}
                  checked={selectedMethod === method.value}
                  onChange={(e) => setSelectedMethod(e.target.value)}
                  className="sr-only"
                />
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-4 transition-all ${
                  selectedMethod === method.value 
                    ? "border-rose-500 bg-rose-500 scale-105" 
                    : "border-neutral-600 bg-transparent"
                }`}>
                  {selectedMethod === method.value && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
                <span className="flex-1 font-medium text-sm text-neutral-200">{method.label}</span>
                {selectedMethod === method.value && (
                  <Check className="w-4 h-4 text-rose-400 shrink-0" />
                )}
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
          <CardContent className="p-6">
            <label className={`flex items-start p-4 border rounded-2xl cursor-pointer transition-all duration-200 ${
              termsAccepted
                ? "bg-rose-500/5 border-rose-500/20"
                : "bg-white/[0.01] border-white/5 hover:border-white/10"
            }`}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded-lg border flex items-center justify-center mr-4 mt-0.5 transition-all shrink-0 ${
                termsAccepted ? "border-rose-500 bg-rose-500 scale-105" : "border-neutral-600 bg-transparent"
              }`}>
                {termsAccepted && <Check className="w-3.5 h-3.5 text-white stroke-[3.5]" />}
              </div>
              <span className="text-xs sm:text-sm text-neutral-300 leading-relaxed select-none">
                I agree that admin will contact me via email with payment details. I understand that credits will be added to my account after payment confirmation.
              </span>
            </label>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button
            variant="outline"
            className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all h-12 text-sm font-semibold rounded-2xl"
            onClick={() => navigate("/dashboard")}
          >
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white shadow-lg shadow-rose-500/20 transition-all h-12 text-sm font-semibold hover:scale-[1.02] disabled:scale-100 disabled:opacity-50 rounded-2xl"
            disabled={!selectedMethod || !termsAccepted || !isAmountValid || createDepositMutation.isPending || settingsLoading}
            onClick={() => createDepositMutation.mutate()}
          >
            {createDepositMutation.isPending ? "Processing..." : `Deposit $${depositAmountNum.toFixed(2)}`}
          </Button>
        </div>

        {/* Info Message */}
        <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-3xl p-6 flex gap-4">
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-200/90 leading-relaxed">
            <p className="font-bold text-white mb-2 text-base">How it works</p>
            <ul className="list-disc list-inside space-y-1.5 pl-1">
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
