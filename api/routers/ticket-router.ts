import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { tickets, ticketReplies, notifications } from "@db/schema";

export const ticketRouter = createRouter({
  create: authedQuery
    .input(z.object({
      subject: z.string().min(1).max(255),
      category: z.enum(["general", "payment", "agent", "technical", "other"]),
    }))
    .mutation(async ({ ctx, input }) => {
      await getDb().insert(tickets).values({
        userId: ctx.user.id,
        subject: input.subject,
        category: input.category,
        status: "open",
      });
      return { success: true };
    }),

  myTickets: authedQuery.query(async ({ ctx }) => {
    return getDb().query.tickets.findMany({
      where: eq(tickets.userId, ctx.user.id),
      with: { replies: true },
      orderBy: desc(tickets.createdAt),
    });
  }),

  allTickets: adminQuery.query(async () => {
    return getDb().query.tickets.findMany({
      with: { user: true, replies: true },
      orderBy: desc(tickets.createdAt),
    });
  }),

  reply: authedQuery
    .input(z.object({ ticketId: z.number(), message: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const ticket = await getDb().select().from(tickets).where(eq(tickets.id, input.ticketId)).limit(1);
      if (!ticket[0]) throw new Error("Ticket not found");
      
      await getDb().insert(ticketReplies).values({
        ticketId: input.ticketId,
        senderId: ctx.user.id,
        senderRole: ctx.user.role === "admin" ? "admin" : "user",
        message: input.message,
      });
      
      if (ctx.user.role === "admin") {
        await getDb().update(tickets).set({ status: "in_progress" }).where(eq(tickets.id, input.ticketId));
        await getDb().insert(notifications).values({
          userId: ticket[0].userId,
          type: "ticket",
          title: "New Ticket Reply",
          message: "Admin has responded to your ticket",
        });
      }
      
      return { success: true };
    }),

  updateStatus: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["open", "in_progress", "resolved", "closed"]) }))
    .mutation(async ({ input }) => {
      await getDb().update(tickets).set({ status: input.status, updatedAt: new Date() }).where(eq(tickets.id, input.id));
      return { success: true };
    }),
});
