import { z } from "zod";
import { eq } from "drizzle-orm";
import { createRouter, publicQuery, adminQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { settings } from "@db/schema";

export const settingsRouter = createRouter({
  getAll: publicQuery.query(async () => {
    return getDb().select().from(settings);
  }),

  getByKey: publicQuery
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const rows = await getDb().select().from(settings).where(eq(settings.key, input.key)).limit(1);
      return rows[0] || null;
    }),

  getByCategory: publicQuery
    .input(z.object({ category: z.enum(["general", "payment", "email", "homepage", "popup"]) }))
    .query(async ({ input }) => {
      return getDb().select().from(settings).where(eq(settings.category, input.category));
    }),

  update: adminQuery
    .input(z.object({ key: z.string(), value: z.string().optional() }))
    .mutation(async ({ input }) => {
      const existing = await getDb().select().from(settings).where(eq(settings.key, input.key)).limit(1);
      if (existing[0]) {
        await getDb().update(settings).set({ value: input.value || null, updatedAt: new Date() }).where(eq(settings.key, input.key));
      } else {
        await getDb().insert(settings).values({ key: input.key, value: input.value || null, category: "general" });
      }
      return { success: true };
    }),

  bulkUpdate: adminQuery
    .input(z.array(z.object({ key: z.string(), value: z.string().optional(), category: z.enum(["general", "payment", "email", "homepage", "popup"]).optional() })))
    .mutation(async ({ input }) => {
      for (const item of input) {
        const existing = await getDb().select().from(settings).where(eq(settings.key, item.key)).limit(1);
        if (existing[0]) {
          await getDb().update(settings).set({ value: item.value || null, updatedAt: new Date() }).where(eq(settings.key, item.key));
        } else {
          await getDb().insert(settings).values({ key: item.key, value: item.value || null, category: item.category || "general" });
        }
      }
      return { success: true };
    }),
});
