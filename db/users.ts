import { eq } from "drizzle-orm";

import { db } from "./index";
import { users } from "./schema";

const DUPLICATE_KEY_CODE = "23505";

export class UserAlreadyExistsError extends Error {
  constructor(email: string) {
    super(`A user with email ${email} already exists.`);
    this.name = "UserAlreadyExistsError";
  }
}

export type AuthUserRecord = Pick<
  typeof users.$inferSelect,
  "id" | "name" | "email" | "image" | "emailVerified" | "passwordHash"
>;

function isDatabaseError(error: unknown): error is { code: string } {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  );
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function getUserByEmail(email: string): Promise<AuthUserRecord | null> {
  const [user] = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      image: users.image,
      emailVerified: users.emailVerified,
      passwordHash: users.passwordHash,
    })
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1);

  return user ?? null;
}

export async function createCredentialsUser(input: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<AuthUserRecord> {
  const email = normalizeEmail(input.email);

  try {
    const [user] = await db
      .insert(users)
      .values({
        email,
        name: input.name,
        passwordHash: input.passwordHash,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        emailVerified: users.emailVerified,
        passwordHash: users.passwordHash,
      });

    if (!user) {
      throw new Error("Failed to create user.");
    }

    return user;
  } catch (error) {
    if (isDatabaseError(error) && error.code === DUPLICATE_KEY_CODE) {
      throw new UserAlreadyExistsError(email);
    }

    throw error;
  }
}

export async function markUserEmailVerified(userId: string): Promise<void> {
  await db
    .update(users)
    .set({
      emailVerified: new Date(),
    })
    .where(eq(users.id, userId));
}

export function toAuthUser(user: Pick<AuthUserRecord, "id" | "name" | "email" | "image">) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
  };
}
