import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { rpc } from "@/lib/rpc";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router";
import { toast } from "sonner";
import { ArrowLeft, Heart, LogOut, DollarSign, Zap } from "lucide-react";

export default function AdminSettings() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  
  // Credit settings state
  const [creditSettings, setCreditSettings] = useState({ 
    messageCostRate: 5.00, 
    minimumDepositAmount: 29.99 
  });

  // Fetch credit settings
  const { data: adminSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ["admin_settings"],
    queryFn: () => rpc.settings.getAdminSettings(),
    enabled: user?.role === "admin",
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });

  useEffect(() => {
    if (adminSettings) {
      setCreditSettings({
        messageCostRate: adminSettings.message_cost_rate || 5.00,
        minimumDepositAmount: adminSettings.minimum_deposit_amount || 29.99,
      });
    }
  }, [adminSettings]);

  // Update credit settings mutation
  const updateSettings = useMutation({
    mutationFn: async () => {
      const messageCostRate = parseFloat(creditSettings.messageCostRate.toString());
      const minimumDepositAmount = parseFloat(creditSettings.minimumDepositAmount.toString());

      if (isNaN(messageCostRate) || messageCostRate <= 0) {
        throw new Error("Message cost rate must be a positive number");
      }
      if (isNaN(minimumDepositAmount) || minimumDepositAmount <= 0) {
        throw new Error("Minimum deposit must be a positive number");
      }

      return rpc.settings.updateAdminSettings(messageCostRate, minimumDepositAmount);
    },
    onSuccess: () => {
      toast.success("Settings updated successfully!");
      queryClient.invalidateQueries({ queryKey: ["admin_settings"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update settings");
    },
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 flex items-center justify-center">
        <div className="text-red-400">Access denied. Admin only.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 to-neutral-900 text-white">
      <header className="border-b border-white/10 bg-neutral-900/50 backdrop-blur-xl px-4 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
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
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Credit System Settings */}
        <Card className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 pb-5">
            <CardTitle className="flex items-center gap-3 text-xl font-bold tracking-tight text-white">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-rose-400" />
              </div>
              Credit System Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Message Cost Rate */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-neutral-200 tracking-wide">
                Message Cost Rate
              </label>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <div className="flex items-stretch bg-neutral-950/40 border border-white/10 rounded-2xl focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/10 transition-all overflow-hidden shadow-inner">
                    <div className="flex items-center justify-center px-4 bg-white/[0.03] border-r border-white/10 text-neutral-400 font-bold select-none text-base min-h-[48px]">
                      $
                    </div>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={creditSettings.messageCostRate}
                      onChange={(e) =>
                        setCreditSettings({
                          ...creditSettings,
                          messageCostRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-transparent border-0 px-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-0 text-base min-h-[48px]"
                      disabled={updateSettings.isPending}
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-2 ml-1">
                    Amount deducted from user credits for each message sent
                  </p>
                </div>
              </div>
            </div>

            {/* Minimum Deposit Amount */}
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-neutral-200 tracking-wide">
                Minimum Deposit Amount (USD)
              </label>
              <div className="flex gap-3 items-end">
                <div className="flex-1">
                  <div className="flex items-stretch bg-neutral-950/40 border border-white/10 rounded-2xl focus-within:border-rose-500/50 focus-within:ring-2 focus-within:ring-rose-500/10 transition-all overflow-hidden shadow-inner">
                    <div className="flex items-center justify-center px-4 bg-white/[0.03] border-r border-white/10 text-neutral-400 font-bold select-none text-base min-h-[48px]">
                      $
                    </div>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={creditSettings.minimumDepositAmount}
                      onChange={(e) =>
                        setCreditSettings({
                          ...creditSettings,
                          minimumDepositAmount: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-transparent border-0 px-4 text-white placeholder:text-neutral-500 focus:outline-none focus:ring-0 text-base min-h-[48px]"
                      disabled={updateSettings.isPending}
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-2 ml-1">
                    Minimum amount users can deposit at once
                  </p>
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-6 border-t border-white/5 flex justify-end">
              <Button
                className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-semibold shadow-lg shadow-rose-500/25 transition-all hover:scale-[1.02] rounded-xl px-6 py-5 h-auto text-sm"
                onClick={() => updateSettings.mutate()}
                disabled={updateSettings.isPending || settingsLoading}
              >
                {updateSettings.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-3xl shadow-lg p-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-blue-300 font-bold text-lg">Credit System Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-blue-200/90 leading-relaxed">
            <p>
              <strong>Message Cost Rate:</strong> Each message a user sends costs this amount in credits. Adjust this to control credit consumption.
            </p>
            <p>
              <strong>Minimum Deposit:</strong> Users must deposit at least this amount when making a credit purchase. Users can deposit any amount &gt;= this minimum.
            </p>
            <p>
              <strong>System:</strong> Users deposit money → Receive credits → Spend credits on messages
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
