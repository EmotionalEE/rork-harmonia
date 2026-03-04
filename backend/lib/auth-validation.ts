import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Invalid email address")
  .transform((value) => value.toLowerCase());

export const passwordSchema = z.string().min(8, "Password must be at least 8 characters");

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name must be 100 characters or fewer");

export const signinInputSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const signupInputSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: nameSchema,
});
