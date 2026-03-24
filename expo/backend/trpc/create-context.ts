import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { verifyToken } from "../lib/jwt";
import { userStore } from "../lib/user-store";

const BEARER_PREFIX = "bearer ";

function getBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null;
  }

  const normalizedHeader = authorizationHeader.trim();
  if (!normalizedHeader.toLowerCase().startsWith(BEARER_PREFIX)) {
    return null;
  }

  const token = normalizedHeader.slice(BEARER_PREFIX.length).trim();
  return token.length > 0 ? token : null;
}

export const createContext = async (opts: FetchCreateContextFnOptions) => {
  const authHeader = opts.req.headers.get("authorization");
  const token = getBearerToken(authHeader);
  const payload = token ? verifyToken(token) : null;

  return {
    req: opts.req,
    userId: payload?.userId ?? null,
  };
};

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource",
    });
  }

  const user = await userStore.findUserById(ctx.userId);
  if (!user) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "User not found",
    });
  }

  return next({
    ctx: {
      ...ctx,
      userId: ctx.userId,
      user,
    },
  });
});
