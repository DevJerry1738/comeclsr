import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { createRouter, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { agents, users, conversations, messages, notifications, agentMessages } from "@db/schema";
import bcrypt from "bcryptjs";

export const agentRouter = createRouter({
  list: adminQuery.query(async () => {
    return getDb().select().from(agents).orderBy(desc(agents.createdAt));
  }),

  create: adminQuery
    .input(z.object({
      username: z.string().min(3).max(100),
      password: z.string().min(6),
      displayName: z.string().min(1).max(255),
      profilePhoto: z.string().optional(),
      bio: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const hashedPassword = await bcrypt.hash(input.password, 12);
      
      const userResult = await getDb().insert(users).values({
        fullName: input.displayName,
        username: input.username,
        email: `${input.username}@agent.comeclsr`,
        password: hashedPassword,
        role: "agent",
        status: "active",
        paymentStatus: "approved",
        kycStatus: "approved",
        lastSignInAt: new Date(),
      });
      
      const userId = Number(userResult[0].insertId);
      
      await getDb().insert(agents).values({
        userId,
        username: input.username,
        password: hashedPassword,
        displayName: input.displayName,
        profilePhoto: input.profilePhoto || null,
        bio: input.bio || null,
      });
      
      return { success: true };
    }),

  assignToUser: adminQuery
    .input(z.object({ agentId: z.number(), userId: z.number() }))
    .mutation(async ({ input }) => {
      const agent = await getDb().select().from(agents).where(eq(agents.id, input.agentId)).limit(1);
      if (!agent[0]) throw new Error("Agent not found");
      
      await getDb().update(agents).set({ assignedUserId: input.userId, updatedAt: new Date() }).where(eq(agents.id, input.agentId));
      await getDb().update(users).set({ assignedAgentId: input.agentId, conversationStatus: "assigned" }).where(eq(users.id, input.userId));
      
      const existingConv = await getDb().select().from(conversations)
        .where(and(eq(conversations.userId, input.userId), eq(conversations.agentId, input.agentId)))
        .limit(1);
      
      if (!existingConv[0]) {
        await getDb().insert(conversations).values({
          userId: input.userId,
          agentId: input.agentId,
          status: "pending",
          adminApproved: false,
        });
      }
      
      await getDb().insert(notifications).values({
        userId: input.userId,
        type: "agent",
        title: "Agent Assigned",
        message: `You have been assigned a connection partner. Please wait for admin approval to start chatting.`,
      });
      
      return { success: true };
    }),

  approveConversation: adminQuery
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input }) => {
      const conv = await getDb().select().from(conversations).where(eq(conversations.id, input.conversationId)).limit(1);
      if (!conv[0]) throw new Error("Conversation not found");
      
      await getDb().update(conversations).set({ status: "active", adminApproved: true }).where(eq(conversations.id, input.conversationId));
      await getDb().update(users).set({ conversationStatus: "active" }).where(eq(users.id, conv[0].userId));
      
      const welcomeMsg = await getDb().select().from(agentMessages)
        .where(eq(agentMessages.agentId, conv[0].agentId))
        .limit(1);
      
      const defaultMsg = welcomeMsg[0]?.content || "Hey there! I'm so glad you joined ComeClsr. I can't wait to get to know you better!";
      
      await getDb().insert(messages).values({
        conversationId: input.conversationId,
        senderId: conv[0].agentId,
        senderRole: "agent",
        type: "media",
        content: defaultMsg,
        isRead: false,
      });
      
      await getDb().update(conversations).set({ welcomeMessageSent: true }).where(eq(conversations.id, input.conversationId));
      
      await getDb().insert(notifications).values({
        userId: conv[0].userId,
        type: "conversation",
        title: "Conversation Started",
        message: "Your connection partner has reached out! Check your messages.",
      });
      
      return { success: true };
    }),

  stopConversation: adminQuery
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ input }) => {
      const conv = await getDb().select().from(conversations).where(eq(conversations.id, input.conversationId)).limit(1);
      if (!conv[0]) throw new Error("Conversation not found");
      
      await getDb().update(conversations).set({ status: "stopped" }).where(eq(conversations.id, input.conversationId));
      await getDb().update(users).set({ conversationStatus: "stopped" }).where(eq(users.id, conv[0].userId));
      await getDb().update(agents).set({ assignedUserId: null }).where(eq(agents.id, conv[0].agentId));
      
      return { success: true };
    }),

  setWelcomeMessage: adminQuery
    .input(z.object({ agentId: z.number(), content: z.string(), isDefault: z.boolean().optional() }))
    .mutation(async ({ input }) => {
      await getDb().insert(agentMessages).values({
        agentId: input.agentId,
        content: input.content,
        isDefault: input.isDefault || false,
      });
      return { success: true };
    }),

  getWelcomeMessages: adminQuery
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input }) => {
      return getDb().select().from(agentMessages).where(eq(agentMessages.agentId, input.agentId)).orderBy(desc(agentMessages.createdAt));
    }),
});
