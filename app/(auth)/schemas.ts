import { z } from "zod";

import { normalizeEmail } from "@/db/users";

const emailField = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .transform(normalizeEmail);

export const credentialsFormSchema = z.object({
  email: emailField,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const magicLinkFormSchema = z.object({
  email: emailField,
});

export const registerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be 80 characters or fewer."),
  email: emailField,
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer."),
});
