import { z } from "zod";
import bcrypt from "bcryptjs";
import * as cookie from "cookie";
import { TRPCError } from "@trpc/server";
import { createRouter, publicQuery } from "./middleware";
import { findUserByUsername, findUserByEmail, findUserById, updateUserLastSignIn } from "./queries/users";
import { getDb } from "./queries/connection";
import { users } from "@db/schema";
import { signLocalSessionToken } from "./local/session";
import { getSessionCookieOptions } from "./lib/cookies";
import { Session } from "@contracts/constants";
import { eq } from "drizzle-orm";

export const localAuthRouter = createRouter({
  register: publicQuery
    .input(
      z.object({
        fullName: z.string().min(2).max(255),
        username: z.string().min(3).max(100),
        email: z.string().email().max(320),
        password: z.string().min(6).max(100),
        phone: z.string().min(5).max(50),
        gender: z.enum(["male", "female", "other"]),
        age: z.number().min(18).max(120),
        location: z.string().min(1).max(255),
        interests: z.string().optional(),
        bio: z.string().optional(),
        profilePhoto: z.string().optional(),
        peopleType: z.string().optional(),
        conversationType: z.string().optional(),
        personalityPrefs: z.string().optional(),
        expectations: z.string().optional(),
      }),
    )
    .mutation(async ({ input }) => {
      const existingUsername = await findUserByUsername(input.username);
      if (existingUsername) {
        throw new TRPCError({ code: "CONFLICT", message: "Username already taken" });
      }
      const existingEmail = await findUserByEmail(input.email);
      if (existingEmail) {
        throw new TRPCError({ code: "CONFLICT", message: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(input.password, 12);

      const result = await getDb().insert(users).values({
        fullName: input.fullName,
        username: input.username,
        email: input.email,
        password: hashedPassword,
        phone: input.phone,
        gender: input.gender,
        age: input.age,
        location: input.location,
        interests: input.interests || null,
        bio: input.bio || null,
        profilePhoto: input.profilePhoto || null,
        role: "user",
        status: "pending",
        paymentStatus: "pending",
        kycStatus: "pending",
        conversationStatus: "pending",
        lastSignInAt: new Date(),
      });

      const userId = Number(result[0].insertId);

      if (input.peopleType || input.conversationType || input.personalityPrefs || input.expectations) {
        const { kycSubmissions } = await import("@db/schema");
        await getDb().insert(kycSubmissions).values({
          userId,
          peopleType: input.peopleType || null,
          conversationType: input.conversationType || null,
          personalityPrefs: input.personalityPrefs || null,
          expectations: input.expectations || null,
          status: "pending",
        });
        await getDb().update(users).set({ kycStatus: "submitted" }).where(eq(users.id, userId));
      }

      const token = await signLocalSessionToken({ userId, role: "user" });

      return { success: true, token, userId };
    }),

  login: publicQuery
    .input(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const user = await findUserByUsername(input.username);
      if (!user || !user.password) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(input.password, user.password);
      if (!valid) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Invalid credentials" });
      }

      if (user.status === "blocked") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Account has been blocked" });
      }
      if (user.status === "suspended") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Account has been suspended" });
      }

      await updateUserLastSignIn(user.id);

      const token = await signLocalSessionToken({ userId: user.id, role: user.role });

      return { success: true, token, user: { id: user.id, role: user.role, username: user.username } };
    }),

  me: publicQuery.query(async ({ ctx }) => {
    const cookies = cookie.parse(ctx.req.headers.get("cookie") || "");
    const localToken = cookies["local_sid"];
    if (!localToken) return null;

    const claim = await verifyLocalSessionToken(localToken);
    if (!claim) return null;

    const user = await findUserById(claim.userId);
    if (!user) return null;

    return user;
  }),

  logout: publicQuery.mutation(async ({ ctx }) => {
    const opts = getSessionCookieOptions(ctx.req.headers);
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize("local_sid", "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    ctx.resHeaders.append(
      "set-cookie",
      cookie.serialize(Session.cookieName, "", {
        httpOnly: opts.httpOnly,
        path: opts.path,
        sameSite: opts.sameSite?.toLowerCase() as "lax" | "none",
        secure: opts.secure,
        maxAge: 0,
      }),
    );
    return { success: true };
  }),
});

async function verifyLocalSessionToken(token: string): Promise<{ userId: number; role: string } | null> {
  if (!token) return null;
  try {
    const { verifyLocalSessionToken: verify } = await import("./local/session");
    return verify(token);
  } catch {
    return null;
  }
}
