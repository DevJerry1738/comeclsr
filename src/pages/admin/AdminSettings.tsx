import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Heart, LogOut, Save, DollarSign, Home } from "lucide-react";

interface SubscriptionPlan {
  id: string;
  name: string;
  amount: number;
  duration_days: number;
  is_active: boolean;
}

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [newPlanForm, setNewPlanForm] = useState({ name: "Standard Plan", amount: 99.99, duration_days: 30 });

  // Fetch subscription plans
  const { data: subscriptionPlans, isLoading } = useQuery({
    queryKey: ["subscription_plans"],
    queryFn: async () => {
      const { data } = await supabase
        .from("subscription_plans")
        .select("*")
        .order("created_at", { ascending: false });
      return data as SubscriptionPlan[];
    },
    enabled: user?.role === "admin",
  });

  useEffect(() => {
    if (subscriptionPlans) {
      setPlans(subscriptionPlans);
    }
  }, [subscriptionPlans]);

  // Update plan mutation
  const updatePlan = useMutation({
    mutationFn: async (plan: SubscriptionPlan) => {
      const { error } = await supabase
        .from("subscription_plans")
        .update({
          name: plan.name,
          amount: plan.amount,
          duration_days: plan.duration_days,
          is_active: plan.is_active,
        })
        .eq("id", plan.id);
      if (error) throw error;
      return plan;
    },
    onSuccess: () => {
      toast.success("Plan updated!");
      setEditingPlan(null);
      queryClient.invalidateQueries({ queryKey: ["subscription_plans"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update plan");
    },
  });

  // Create plan mutation
  const createPlan = useMutation({
    mutationFn: async (form: typeof newPlanForm) => {
      const { data, error } = await supabase
        .from("subscription_plans")
        .insert({
          name: form.name,
          amount: form.amount,
          duration_days: form.duration_days,
          is_active: true,
        })
        .select();
      if (error) throw error;
      return data?.[0];
    },
    onSuccess: () => {
      toast.success("Plan created!");
      setNewPlanForm({ name: "Standard Plan", amount: 99.99, duration_days: 30 });
      queryClient.invalidateQueries({ queryKey: ["subscription_plans"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to create plan");
    },
  });

  if (!user || user.role !== "admin") return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button
              variant="ghost"
              size="icon"
              className="text-neutral-400 hover:text-white hover:bg-white/5"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <h1 className="font-semibold">System Settings</h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={logout}
          className="text-neutral-400 hover:text-red-400 hover:bg-red-500/10"
        >
          <LogOut className="w-5 h-5" />
        </Button>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs defaultValue="payment">
          <TabsList className="bg-neutral-900 border border-neutral-800 mb-6">
            <TabsTrigger
              value="payment"
              className="data-[state=active]:bg-rose-500/20 data-[state=active]:text-rose-400"
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Subscription Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="payment" className="space-y-6">
            {/* Create New Plan */}
            <Card className="bg-neutral-900/60 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-lg">Create New Subscription Plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-neutral-400 block mb-2">Plan Name</label>
                    <input
                      className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm"
                      placeholder="e.g., Standard Plan"
                      value={newPlanForm.name}
                      onChange={(e) =>
                        setNewPlanForm({ ...newPlanForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 block mb-2">Amount ($)</label>
                    <input
                      className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm"
                      type="number"
                      step="0.01"
                      placeholder="99.99"
                      value={newPlanForm.amount}
                      onChange={(e) =>
                        setNewPlanForm({
                          ...newPlanForm,
                          amount: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm text-neutral-400 block mb-2">Duration (days)</label>
                    <input
                      className="w-full p-3 rounded-lg bg-neutral-800 border border-neutral-700 text-white text-sm"
                      type="number"
                      placeholder="30"
                      value={newPlanForm.duration_days}
                      onChange={(e) =>
                        setNewPlanForm({
                          ...newPlanForm,
                          duration_days: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => createPlan.mutate(newPlanForm)}
                      disabled={createPlan.isPending}
                      className="w-full bg-gradient-to-r from-rose-500 to-pink-600"
                    >
                      {createPlan.isPending ? "Creating..." : "Create Plan"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Existing Plans */}
            <Card className="bg-neutral-900/60 border-neutral-800">
              <CardHeader>
                <CardTitle className="text-lg">Active Subscription Plans</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-neutral-400">Loading plans...</p>
                ) : plans.length > 0 ? (
                  <div className="space-y-4">
                    {plans.map((plan) => (
                      <div
                        key={plan.id}
                        className="p-4 rounded-lg bg-neutral-800/50 border border-neutral-700 space-y-3"
                      >
                        {editingPlan?.id === plan.id ? (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs text-neutral-400 block mb-1">
                                  Plan Name
                                </label>
                                <input
                                  className="w-full p-2 rounded bg-neutral-700 border border-neutral-600 text-white text-sm"
                                  value={editingPlan.name}
                                  onChange={(e) =>
                                    setEditingPlan({
                                      ...editingPlan,
                                      name: e.target.value,
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-xs text-neutral-400 block mb-1">
                                  Amount ($)
                                </label>
                                <input
                                  className="w-full p-2 rounded bg-neutral-700 border border-neutral-600 text-white text-sm"
                                  type="number"
                                  step="0.01"
                                  value={editingPlan.amount}
                                  onChange={(e) =>
                                    setEditingPlan({
                                      ...editingPlan,
                                      amount: parseFloat(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div>
                                <label className="text-xs text-neutral-400 block mb-1">
                                  Duration (days)
                                </label>
                                <input
                                  className="w-full p-2 rounded bg-neutral-700 border border-neutral-600 text-white text-sm"
                                  type="number"
                                  value={editingPlan.duration_days}
                                  onChange={(e) =>
                                    setEditingPlan({
                                      ...editingPlan,
                                      duration_days: parseInt(e.target.value),
                                    })
                                  }
                                />
                              </div>
                              <div className="flex gap-2 items-end">
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    updatePlan.mutate(editingPlan)
                                  }
                                  disabled={updatePlan.isPending}
                                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingPlan(null)}
                                  className="flex-1 border-neutral-600"
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="font-medium text-white">{plan.name}</h3>
                                <p className="text-sm text-neutral-400">
                                  ${plan.amount.toFixed(2)} / {plan.duration_days} days
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setEditingPlan(plan)}
                                className="border-neutral-600"
                              >
                                Edit
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-neutral-400">No plans created yet.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
