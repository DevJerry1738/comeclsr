import { authRouter } from "./auth-router";
import { localAuthRouter } from "./local-auth-router";
import { userRouter, paymentRouter, kycRouter } from "./routers/user-router";
import { settingsRouter } from "./routers/settings-router";
import { agentRouter } from "./routers/agent-router";
import { conversationRouter } from "./routers/conversation-router";
import { ticketRouter } from "./routers/ticket-router";
import { adminRouter } from "./routers/admin-router";
import { createRouter, publicQuery } from "./middleware";

export const appRouter = createRouter({
  ping: publicQuery.query(() => ({ ok: true, ts: Date.now() })),
  auth: authRouter,
  localAuth: localAuthRouter,
  user: userRouter,
  payment: paymentRouter,
  kyc: kycRouter,
  settings: settingsRouter,
  agent: agentRouter,
  conversation: conversationRouter,
  ticket: ticketRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
