import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { conversations, messages, notifications } from "@db/schema";

export const conversationRouter = createRouter({
  myConversations: authedQuery.query(async ({ ctx }) => {
    return getDb().query.conversations.findMany({
      where: eq(conversations.userId, ctx.user.id),
      with: { agent: true, messages: { orderBy: desc(messages.createdAt), limit: 1 } },
      orderBy: desc(conversations.lastMessageAt),
    });
  }),

  getMessages: authedQuery
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const conv = await getDb().select().from(conversations).where(eq(conversations.id, input.conversationId)).limit(1);
      if (!conv[0]) throw new Error("Conversation not found");
      if (conv[0].userId !== ctx.user.id && conv[0].agentId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      return getDb().select().from(messages).where(eq(messages.conversationId, input.conversationId)).orderBy(desc(messages.createdAt));
    }),

  sendMessage: authedQuery
    .input(z.object({
      conversationId: z.number(),
      type: z.enum(["media", "voice"]),
      content: z.string().optional(),
      mediaUrl: z.string().optional(),
      duration: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const conv = await getDb().select().from(conversations).where(eq(conversations.id, input.conversationId)).limit(1);
      if (!conv[0]) throw new Error("Conversation not found");
      if (conv[0].status !== "active") throw new Error("Conversation is not active");
      if (conv[0].userId !== ctx.user.id && conv[0].agentId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }
      
      await getDb().insert(messages).values({
        conversationId: input.conversationId,
        senderId: ctx.user.id,
        senderRole: ctx.user.role === "agent" ? "agent" : ctx.user.role === "admin" ? "admin" : "user",
        type: input.type,
        content: input.content || null,
        mediaUrl: input.mediaUrl || null,
        duration: input.duration || null,
      });
      
      await getDb().update(conversations).set({ lastMessageAt: new Date() }).where(eq(conversations.id, input.conversationId));
      
      const recipientId = conv[0].userId === ctx.user.id ? conv[0].agentId : conv[0].userId;
      await getDb().insert(notifications).values({
        userId: recipientId,
        type: "conversation",
        title: "New Message",
        message: "You have a new message",
      });
      
      return { success: true };
    }),

  markRead: authedQuery
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await getDb().update(messages).set({ isRead: true })
        .where(and(eq(messages.conversationId, input.conversationId), eq(messages.senderId, ctx.user.id)));
      return { success: true };
    }),

  allConversations: adminQuery.query(async () => {
    return getDb().query.conversations.findMany({
      with: { user: true, agent: true },
      orderBy: desc(conversations.createdAt),
    });
  }),
});
