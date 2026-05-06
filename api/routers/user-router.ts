import { z } from "zod";
import { eq, desc } from "drizzle-orm";
import { createRouter, authedQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { users, payments, kycSubmissions, notifications, userRequests } from "@db/schema";

export const userRouter = createRouter({
  profile: authedQuery.query(async ({ ctx }) => {
    const user = await getDb().query.users.findFirst({
      where: eq(users.id, ctx.user.id),
      with: { kyc: true, payments: true, assignedAgent: true },
    });
    return user;
  }),

  updateProfile: authedQuery
    .input(z.object({
      fullName: z.string().optional(),
      phone: z.string().optional(),
      location: z.string().optional(),
      interests: z.string().optional(),
      bio: z.string().optional(),
      profilePhoto: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await getDb().update(users).set({ ...input, updatedAt: new Date() }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  notifications: authedQuery.query(async ({ ctx }) => {
    return getDb().select().from(notifications).where(eq(notifications.userId, ctx.user.id)).orderBy(desc(notifications.createdAt)).limit(50);
  }),

  markNotificationRead: authedQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await getDb().update(notifications).set({ isRead: true }).where(eq(notifications.id, input.id));
      return { success: true };
    }),

  createRequest: authedQuery
    .input(z.object({ type: z.enum(["agent_change", "report_inactivity", "other"]), message: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await getDb().insert(userRequests).values({
        userId: ctx.user.id,
        type: input.type,
        message: input.message || null,
      });
      return { success: true };
    }),
});

export const paymentRouter = createRouter({
  create: authedQuery
    .input(z.object({ amount: z.string(), method: z.string(), transactionRef: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      await getDb().insert(payments).values({
        userId: ctx.user.id,
        amount: input.amount,
        method: input.method,
        transactionRef: input.transactionRef || null,
        status: "pending",
      });
      await getDb().update(users).set({ paymentStatus: "pending" }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  myPayments: authedQuery.query(async ({ ctx }) => {
    return getDb().select().from(payments).where(eq(payments.userId, ctx.user.id)).orderBy(desc(payments.createdAt));
  }),

  allPayments: adminQuery.query(async () => {
    return getDb().select().from(payments).orderBy(desc(payments.createdAt));
  }),

  updateStatus: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected"]), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const payment = await getDb().select().from(payments).where(eq(payments.id, input.id)).limit(1);
      if (!payment[0]) throw new Error("Payment not found");
      
      await getDb().update(payments).set({ status: input.status, adminNotes: input.notes || null, updatedAt: new Date() }).where(eq(payments.id, input.id));
      
      if (input.status === "approved") {
        await getDb().update(users).set({ paymentStatus: "approved" }).where(eq(users.id, payment[0].userId));
        await getDb().insert(notifications).values({
          userId: payment[0].userId,
          type: "payment",
          title: "Payment Approved",
          message: "Your payment has been approved. Please complete KYC if you haven't already.",
        });
      } else if (input.status === "rejected") {
        await getDb().update(users).set({ paymentStatus: "rejected" }).where(eq(users.id, payment[0].userId));
        await getDb().insert(notifications).values({
          userId: payment[0].userId,
          type: "payment",
          title: "Payment Rejected",
          message: "Your payment was rejected. Please contact support for assistance.",
        });
      }
      return { success: true };
    }),
});

export const kycRouter = createRouter({
  submit: authedQuery
    .input(z.object({
      peopleType: z.string().optional(),
      conversationType: z.string().optional(),
      personalityPrefs: z.string().optional(),
      expectations: z.string().optional(),
      idDocument: z.string().optional(),
      selfiePhoto: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getDb().select().from(kycSubmissions).where(eq(kycSubmissions.userId, ctx.user.id)).limit(1);
      if (existing[0]) {
        await getDb().update(kycSubmissions).set({ ...input, status: "pending", updatedAt: new Date() }).where(eq(kycSubmissions.userId, ctx.user.id));
      } else {
        await getDb().insert(kycSubmissions).values({
          userId: ctx.user.id,
          ...input,
          status: "pending",
        });
      }
      await getDb().update(users).set({ kycStatus: "submitted" }).where(eq(users.id, ctx.user.id));
      return { success: true };
    }),

  myKyc: authedQuery.query(async ({ ctx }) => {
    return getDb().select().from(kycSubmissions).where(eq(kycSubmissions.userId, ctx.user.id)).limit(1);
  }),

  allKyc: adminQuery.query(async () => {
    return getDb().select().from(kycSubmissions).orderBy(desc(kycSubmissions.createdAt));
  }),

  updateStatus: adminQuery
    .input(z.object({ id: z.number(), status: z.enum(["pending", "approved", "rejected"]), notes: z.string().optional() }))
    .mutation(async ({ input }) => {
      const kyc = await getDb().select().from(kycSubmissions).where(eq(kycSubmissions.id, input.id)).limit(1);
      if (!kyc[0]) throw new Error("KYC not found");
      
      await getDb().update(kycSubmissions).set({ status: input.status, adminNotes: input.notes || null, updatedAt: new Date() }).where(eq(kycSubmissions.id, input.id));
      await getDb().update(users).set({ kycStatus: input.status }).where(eq(users.id, kyc[0].userId));
      
      await getDb().insert(notifications).values({
        userId: kyc[0].userId,
        type: "kyc",
        title: `KYC ${input.status.charAt(0).toUpperCase() + input.status.slice(1)}`,
        message: input.status === "approved" ? "Your KYC has been approved." : "Your KYC was rejected. Please update your information.",
      });
      return { success: true };
    }),
});
