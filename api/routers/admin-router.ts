import { z } from "zod";
import { eq, desc, count, sql, and } from "drizzle-orm";
import { createRouter, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, agents, payments, conversations, tickets, notifications, userRequests } from "@db/schema";
import bcrypt from "bcryptjs";

export const adminRouter = createRouter({
  dashboardStats: adminQuery.query(async () => {
    const db = getDb();
    
    const totalUsers = await db.select({ count: count() }).from(users).where(eq(users.role, "user"));
    const activeUsers = await db.select({ count: count() }).from(users).where(and(eq(users.role, "user"), eq(users.status, "active")));
    const pendingPayments = await db.select({ count: count() }).from(payments).where(eq(payments.status, "pending"));
    const approvedUsers = await db.select({ count: count() }).from(users).where(and(eq(users.role, "user"), eq(users.paymentStatus, "approved")));
    const totalAgents = await db.select({ count: count() }).from(agents);
    const activeConversations = await db.select({ count: count() }).from(conversations).where(eq(conversations.status, "active"));
    const totalTickets = await db.select({ count: count() }).from(tickets);
    const openTickets = await db.select({ count: count() }).from(tickets).where(eq(tickets.status, "open"));
    
    const revenue = await db.select({ total: sql<number>`COALESCE(SUM(${payments.amount}), 0)` }).from(payments).where(eq(payments.status, "approved"));
    
    return {
      totalUsers: totalUsers[0].count,
      activeUsers: activeUsers[0].count,
      pendingPayments: pendingPayments[0].count,
      approvedUsers: approvedUsers[0].count,
      totalAgents: totalAgents[0].count,
      activeConversations: activeConversations[0].count,
      totalTickets: totalTickets[0].count,
      openTickets: openTickets[0].count,
      revenue: Number(revenue[0].total),
    };
  }),

  allUsers: adminQuery.query(async () => {
    return getDb().query.users.findMany({
      with: { kyc: true, payments: true, assignedAgent: true },
      orderBy: desc(users.createdAt),
    });
  }),

  updateUser: adminQuery
    .input(z.object({
      id: z.number(),
      status: z.enum(["active", "suspended", "blocked", "pending"]).optional(),
      paymentStatus: z.enum(["pending", "approved", "rejected"]).optional(),
      kycStatus: z.enum(["pending", "submitted", "approved", "rejected"]).optional(),
      conversationStatus: z.enum(["pending", "assigned", "active", "stopped"]).optional(),
      assignedAgentId: z.number().optional().nullable(),
      role: z.enum(["user", "admin", "agent"]).optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await getDb().update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id));
      return { success: true };
    }),

  deleteUser: adminQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().delete(users).where(eq(users.id, input.id));
      return { success: true };
    }),

  resetPassword: adminQuery
    .input(z.object({ id: z.number(), newPassword: z.string().min(6) }))
    .mutation(async ({ input }) => {
      const hashed = await bcrypt.hash(input.newPassword, 12);
      await getDb().update(users).set({ password: hashed, updatedAt: new Date() }).where(eq(users.id, input.id));
      return { success: true };
    }),

  createNotification: adminQuery
    .input(z.object({
      userId: z.number(),
      type: z.enum(["payment", "kyc", "agent", "conversation", "ticket", "system"]),
      title: z.string(),
      message: z.string(),
    }))
    .mutation(async ({ input }) => {
      await getDb().insert(notifications).values(input);
      return { success: true };
    }),

  userRequests: adminQuery.query(async () => {
    return getDb().query.userRequests.findMany({
      with: { user: true },
      orderBy: desc(userRequests.createdAt),
    });
  }),

  updateRequestStatus: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected"]) }))
    .mutation(async ({ input }) => {
      await getDb().update(userRequests).set({ status: input.status }).where(eq(userRequests.id, input.id));
      return { success: true };
    }),
});
