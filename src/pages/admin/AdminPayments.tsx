import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Heart, LogOut, CheckCircle, DollarSign, UserCheck } from "lucide-react";

interface PaymentRequest {
  request_id: string;
  user_id: string;
  username: string;
  full_name: string;
  email: string;
  plan_id: string | null;
  plan_name: string;
  amount: number;
  payment_method: string;
  status: "pending" | "confirmed" | "failed" | "refunded";
  requested_at: string;
  credits_to_grant: number | null;
}

type FilterStatus = "all" | "pending" | "confirmed" | "failed";

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-amber-500/20 text-amber-400 border-amber-500/30",
  confirmed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  failed:    "bg-red-500/20 text-red-400 border-red-500/30",
  refunded:  "bg-neutral-500/20 text-neutral-400 border-neutral-500/30",
};

export default function AdminPayments() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [creditsToGrant, setCreditsToGrant] = useState<string>("");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [filter, setFilter] = useState<FilterStatus>("all");

  // Fetch all payment requests with user and package info
  const { data: payments, isLoading: paymentsLoading, error: paymentsError } = useQuery({
    queryKey: ["payment", "all"],
    queryFn: async () => {
      const { data: paymentRequests, error } = await supabase
        .from("payment_requests")
        .select("id, user_id, plan_id, payment_method, amount, status, requested_at, admin_notes, credits_to_grant")
        .order("requested_at", { ascending: false });

      if (error) {
        console.error("Error fetching payment_requests:", error.message);
        throw error;
      }
      if (!paymentRequests || paymentRequests.length === 0) return [];

      const userIds = [...new Set(paymentRequests.map((p: any) => p.user_id))];
      const planIds = [...new Set(paymentRequests.map((p: any) => p.plan_id).filter(Boolean))];

      const [{ data: users }, { data: plans }] = await Promise.all([
        supabase.from("user_profiles").select("id, email, full_name, username").in("id", userIds),
        planIds.length > 0
          ? supabase.from("credit_packages").select("id, name, credit_amount").in("id", planIds)
          : Promise.resolve({ data: [] }),
      ]);

      const usersMap = new Map((users || []).map((u: any) => [u.id, u]));
      const plansMap = new Map((plans || []).map((p: any) => [p.id, p]));

      return paymentRequests.map((item: any) => {
        const userData = usersMap.get(item.user_id);
        const planData = item.plan_id ? plansMap.get(item.plan_id) : null;
        return {
          request_id: item.id,
          user_id: item.user_id,
          username: userData?.username || "User",
          full_name: userData?.full_name || userData?.email || "Unknown",
          email: userData?.email || "—",
          plan_id: item.plan_id ?? null,
          plan_name: planData?.name ?? (item.plan_id ? "Unknown Package" : "Custom Deposit"),
          amount: item.amount,
          payment_method: item.payment_method,
          status: item.status,
          requested_at: item.requested_at,
          credits_to_grant: item.credits_to_grant ?? (planData ? (planData as any).credit_amount : null),
        } as PaymentRequest;
      });
    },
    enabled: user?.role === "admin",
    staleTime: 5 * 1000,
    gcTime: 2 * 60 * 1000,
  });

  const filteredPayments = (payments || []).filter((p) =>
    filter === "all" ? true : p.status === filter
  );

  const counts = {
    all:       payments?.length ?? 0,
    pending:   payments?.filter((p) => p.status === "pending").length ?? 0,
    confirmed: payments?.filter((p) => p.status === "confirmed").length ?? 0,
    failed:    payments?.filter((p) => p.status === "failed").length ?? 0,
  };

  // Approve and grant credits mutation
  const approvePayment = useMutation({
    mutationFn: async ({ paymentRequestId, creditsToGrant, notes }: { paymentRequestId: string; creditsToGrant: number; notes?: string }) => {
      return rpc.payment.approveDeposit(paymentRequestId, creditsToGrant, notes);
    },
    onSuccess: () => {
      toast.success("Payment approved and credits granted!");
      queryClient.invalidateQueries({ queryKey: ["payment", "all"] });
      setSelectedPayment(null);
      setCreditsToGrant("");
      setAdminNotes("");
      setShowConfirmDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to approve payment");
    },
  });

  const handleConfirmClick = (payment: PaymentRequest) => {
    setSelectedPayment(payment);
    const defaultCredits = payment.amount;
    setCreditsToGrant(defaultCredits.toString());
    setAdminNotes("");
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = () => {
    if (!selectedPayment) return toast.error("No payment selected");
    const creditsNum = parseInt(creditsToGrant, 10);
    if (isNaN(creditsNum) || creditsNum <= 0) {
      return toast.error("Please enter a valid credit amount greater than 0");
    }
    approvePayment.mutate({
      paymentRequestId: selectedPayment.request_id,
      creditsToGrant: creditsNum,
      notes: adminNotes || undefined,
    });
  };

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-white hover:bg-white/5">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-semibold">Deposit Management</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10">
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-xl font-bold">Payment History</h2>
          <p className="text-sm text-neutral-500">
            {paymentsLoading ? "Loading..." : `${counts.all} total · ${counts.pending} pending`}
          </p>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {(["all", "pending", "confirmed", "failed"] as FilterStatus[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filter === tab
                  ? "bg-white/10 border-white/30 text-white"
                  : "border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              <span className="ml-2 text-xs opacity-70">{counts[tab]}</span>
            </button>
          ))}
        </div>

        {paymentsError && (
          <Card className="bg-red-500/10 border-red-500/30 p-4 mb-6">
            <p className="text-red-400 text-sm">
              <strong>Error:</strong> {paymentsError instanceof Error ? paymentsError.message : String(paymentsError)}
            </p>
          </Card>
        )}

        {paymentsLoading ? (
          <Card className="bg-neutral-900/60 border-neutral-800 p-8 text-center">
            <p className="text-neutral-400">Loading payments...</p>
          </Card>
        ) : filteredPayments.length > 0 ? (
          <Card className="bg-neutral-900/60 border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-800 text-left">
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">ID</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">User</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Plan</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Amount</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Method</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Status</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Date</th>
                    <th className="p-4 text-xs font-medium text-neutral-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p) => (
                    <tr key={p.request_id} className="border-b border-neutral-800/50 hover:bg-white/5">
                      <td className="p-4 text-sm text-neutral-500">#{p.request_id.slice(0, 8)}</td>
                      <td className="p-4 text-sm">
                        <p className="font-medium">{p.full_name || p.username}</p>
                        <p className="text-xs text-neutral-500">{p.email}</p>
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${p.plan_id ? "bg-violet-500/20 text-violet-400 border-violet-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}>
                          {p.plan_name}
                        </span>
                      </td>
                      <td className="p-4 text-sm font-medium flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                        {p.amount.toFixed(2)}
                      </td>
                      <td className="p-4 text-sm capitalize">{p.payment_method.replace(/_/g, " ")}</td>
                      <td className="p-4">
                        <Badge className={STATUS_COLORS[p.status] ?? "bg-neutral-500/20 text-neutral-400"}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-neutral-500">
                        {new Date(p.requested_at).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        {p.status === "pending" && (
                          <Button
                            size="sm"
                            className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                            onClick={() => handleConfirmClick(p)}
                            disabled={approvePayment.isPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approve
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="bg-neutral-900/60 border-neutral-800 p-8 text-center">
            <p className="text-neutral-400">
              {filter === "all" ? "No payment requests yet" : `No ${filter} payments`}
            </p>
          </Card>
        )}
      </div>

      {/* Confirm Approval Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="bg-neutral-900 border-neutral-800 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              Approve Deposit & Grant Credits
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Confirm payment and specify the number of credits to add to the user's account.
            </DialogDescription>
          </DialogHeader>

          {selectedPayment && (
            <div className="space-y-4 py-2">
              {/* Payment summary */}
              <div className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700 space-y-3">
                <div className="flex justify-between">
                  <div>
                    <p className="text-xs text-neutral-400">User</p>
                    <p className="font-medium text-white">{selectedPayment.full_name}</p>
                    <p className="text-xs text-neutral-500">{selectedPayment.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-400">Amount</p>
                    <p className="font-semibold text-emerald-400 text-lg">${selectedPayment.amount.toFixed(2)}</p>
                  </div>
                </div>
                <div className="flex justify-between pt-2 border-t border-neutral-700">
                  <div>
                    <p className="text-xs text-neutral-400">Plan</p>
                    <p className="text-sm text-white">{selectedPayment.plan_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-neutral-400">Method</p>
                    <p className="text-sm text-white capitalize">{selectedPayment.payment_method.replace(/_/g, " ")}</p>
                  </div>
                </div>
              </div>

              {/* Credits to Grant */}
              <div>
                <label className="text-sm font-medium text-neutral-300 block mb-2">
                  Credits to Grant <span className="text-red-400">*</span>
                </label>
                
                  <input
                    type="number"
                    className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm focus:outline-none focus:border-emerald-500"
                    value={creditsToGrant}
                    readOnly
                    disabled
                  />
                  <p className="text-xs text-neutral-500 mt-1.5">
                    Credits are set equal to the deposit amount.
                  </p>
              </div>

              {/* Optional admin notes */}
              <div>
                <label className="text-sm font-medium text-neutral-300 block mb-2">
                  Admin Notes <span className="text-neutral-500">(optional)</span>
                </label>
                <textarea
                  className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm resize-none focus:outline-none focus:border-emerald-500"
                  rows={2}
                  placeholder="Payment verified, notes..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowConfirmDialog(false)}
                  className="border-neutral-700 text-neutral-300 hover:text-white"
                  disabled={approvePayment.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmSubmit}
                  disabled={approvePayment.isPending || !creditsToGrant}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {approvePayment.isPending ? "Approving..." : "Approve & Grant"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
