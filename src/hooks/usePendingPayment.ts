import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

/**
 * Shared hook to check if user has pending payment requests
 * Used by Dashboard and Subscribe pages to maintain consistent state
 */
export function usePendingPayment(userId?: string) {
  return useQuery({
    queryKey: ["payment_check_pending", userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("payment_check_pending_for_user");
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
    select: (data) => {
      // Handle both single object and array responses
      if (Array.isArray(data)) {
        return (data as any)?.[0]?.pending_count > 0;
      }
      return (data as any)?.pending_count > 0;
    },
  });
}
