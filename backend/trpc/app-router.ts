import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import { signupProcedure } from "./routes/auth/signup/route";
import { signinProcedure } from "./routes/auth/signin/route";
import { meProcedure } from "./routes/auth/me/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  auth: createTRPCRouter({
    signup: signupProcedure,
    signin: signinProcedure,
    me: meProcedure,
  }),
});

export type AppRouter = typeof appRouter;
