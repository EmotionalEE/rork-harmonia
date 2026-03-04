import { protectedProcedure } from "../../../create-context";

export const meProcedure = protectedProcedure.query(async ({ ctx }) => {
  console.log('[Auth] Getting current user:', ctx.user.email);

  return {
    id: ctx.user.id,
    email: ctx.user.email,
    name: ctx.user.name,
    createdAt: ctx.user.createdAt,
  };
});
