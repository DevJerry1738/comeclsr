import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Bell, Check, BellRing } from "lucide-react";
import AppShell from "@/components/AppShell";

export default function Notifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<any[]>({
    queryKey: ["notifications", "all", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 10 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  const loading = isLoading;

  const markAsRead = async (id: number) => {
    try {
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "unreadCount"] });
      toast.success("Marked as read");
    } catch (err: any) {
      toast.error("Failed to mark as read");
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await (supabase as any)
        .from("notifications")
        .update({ is_read: true })
        .eq("user_id", user?.id as string)
        .eq("is_read", false);

      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["messages", "unreadCount"] });
      toast.success("All marked as read");
    } catch (err: any) {
      toast.error("Failed to mark all as read");
    }
  };

  if (!user) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <AppShell
      title="Notifications"
      showBackButton={true}
      onBackClick={() => navigate("/dashboard")}
      rightAction={
        unreadCount > 0 ? (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={markAllAsRead}
            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs"
          >
            <Check className="w-4 h-4 mr-1" /> All Read
          </Button>
        ) : null
      }
    >
      <div className="px-4 py-6 max-w-lg mx-auto space-y-4">
        {loading ? (
          <div className="text-center py-12 text-neutral-500">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 bg-surface-1 border border-surface-3 rounded-3xl">
            <Bell className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
            <p className="text-neutral-400">You're all caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div 
                key={n.id} 
                className={`p-4 rounded-2xl border transition-all ${
                  n.is_read 
                    ? "bg-surface-1 border-surface-3 opacity-70" 
                    : "bg-rose-500/10 border-rose-500/30 ring-1 ring-rose-500/20"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {n.is_read ? (
                      <Bell className="w-5 h-5 text-neutral-500" />
                    ) : (
                      <BellRing className="w-5 h-5 text-rose-400" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-medium text-sm ${n.is_read ? "text-neutral-300" : "text-rose-100"}`}>
                      {n.title}
                    </h4>
                    <p className={`text-sm mt-1 ${n.is_read ? "text-neutral-500" : "text-neutral-300"}`}>
                      {n.message}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-neutral-500">
                        {new Date(n.created_at).toLocaleString()}
                      </span>
                      {!n.is_read && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          onClick={() => markAsRead(n.id)}
                          className="h-6 px-2 text-xs text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10"
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
