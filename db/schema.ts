/**
 * @deprecated This file is for the old Hono + Drizzle ORM backend
 * Database schema is now defined in supabase/migrations/20260504_initial_schema.sql
 * Using Supabase PostgreSQL with RLS policies instead of Drizzle ORM
 */

// Placeholder exports to maintain compatibility
export const users = { $inferSelect: {}, $inferInsert: {} } as any;
export const agents = { $inferSelect: {}, $inferInsert: {} } as any;
export const kycSubmissions = { $inferSelect: {}, $inferInsert: {} } as any;
export const payments = { $inferSelect: {}, $inferInsert: {} } as any;
export const conversations = { $inferSelect: {}, $inferInsert: {} } as any;
export const messages = { $inferSelect: {}, $inferInsert: {} } as any;
export const tickets = { $inferSelect: {}, $inferInsert: {} } as any;
export const ticketReplies = { $inferSelect: {}, $inferInsert: {} } as any;
export const settings = { $inferSelect: {}, $inferInsert: {} } as any;
export const notifications = { $inferSelect: {}, $inferInsert: {} } as any;
export const agentMessages = { $inferSelect: {}, $inferInsert: {} } as any;
export const userRequests = { $inferSelect: {}, $inferInsert: {} } as any;

