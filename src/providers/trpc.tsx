/**
 * @deprecated This provider is for the old Hono + tRPC backend
 * We've migrated to Supabase with the SupabaseProvider instead
 * This file is kept for reference but should not be imported
 */

// Placeholder export for backward compatibility with old pages
export const trpc = {} as any;

export function TRPCProvider({ children }: { children: unknown }) {
  return children;
}

