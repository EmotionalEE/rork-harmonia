import { publicProcedure } from "../../../create-context";
import { userStore } from "../../../../lib/user-store";
import { generateToken } from "../../../../lib/jwt";
import { TRPCError } from "@trpc/server";
import { signupInputSchema } from "../../../../lib/auth-validation";

export const signupProcedure = publicProcedure
  .input(signupInputSchema)
  .mutation(async ({ input }) => {
    console.log("[Auth] Signup attempt:", input.email);

    try {
      const user = await userStore.createUser(input.email, input.password, input.name);

      const token = generateToken({
        userId: user.id,
        email: user.email,
      });

      console.log("[Auth] Signup successful:", user.email);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create account";
      const code = message.includes("already exists") ? "CONFLICT" : "BAD_REQUEST";

      console.error("[Auth] Signup error:", message);
      throw new TRPCError({
        code,
        message,
      });
    }
  });
