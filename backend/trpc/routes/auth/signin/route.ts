import { publicProcedure } from "../../../create-context";
import { userStore } from "../../../../lib/user-store";
import { generateToken } from "../../../../lib/jwt";
import { TRPCError } from "@trpc/server";
import { signinInputSchema } from "../../../../lib/auth-validation";

export const signinProcedure = publicProcedure
  .input(signinInputSchema)
  .mutation(async ({ input }) => {
    console.log("[Auth] Signin attempt:", input.email);

    const user = await userStore.findUserByEmail(input.email);

    if (!user) {
      console.log("[Auth] Signin failed: User not found");
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    const isValidPassword = await userStore.verifyPassword(user, input.password);

    if (!isValidPassword) {
      console.log("[Auth] Signin failed: Invalid password");
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "Invalid email or password",
      });
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
    });

    console.log("[Auth] Signin successful:", user.email);

    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  });
