import type { DefaultSession, NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { EmailConfig } from "next-auth/providers/email";
import Google, { type GoogleProfile } from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { z } from "zod";

import { db } from "@/db";
import { eq } from "drizzle-orm";
import { limit } from "@/lib/domain/shared";
import { sendEmail } from "@/lib/email/mailer";
import { magicLinkEmail } from "@/lib/email/templates";
import { accounts, users, verificationTokens } from "@/db/schema";
import {
  getUserByEmail,
  markUserEmailVerified,
  normalizeEmail,
  toAuthUser,
} from "@/db/users";

declare module "next-auth" {
  interface Session {
    user: NonNullable<DefaultSession["user"]> & {
      id: string;
    };
  }
}

const authEnvSchema = z.object({
  AUTH_SECRET: z.string().min(1, "AUTH_SECRET is required."),
  AUTH_GOOGLE_ID: z.string().min(1, "AUTH_GOOGLE_ID is required."),
  AUTH_GOOGLE_SECRET: z.string().min(1, "AUTH_GOOGLE_SECRET is required."),
  AUTH_EMAIL_FROM: z.string().min(1, "AUTH_EMAIL_FROM is required."),
  SMTP_HOST: z.string().min(1, "SMTP_HOST is required."),
  SMTP_USER: z.string().min(1, "SMTP_USER is required."),
  SMTP_PASSWORD: z.string().min(1, "SMTP_PASSWORD is required."),
});

const authEnv = authEnvSchema.parse(process.env);

const credentialsSchema = z.object({
  email: z.string().trim().email().transform(normalizeEmail),
  password: z.string().min(8),
});

const magicLinkProvider = {
  id: "email",
  type: "email",
  name: "Email",
  from: authEnv.AUTH_EMAIL_FROM,
  maxAge: 60 * 30,
  async sendVerificationRequest({
    expires,
    identifier,
    request,
    url,
  }) {
    await limit(`magic:${identifier}`, 3, 15 * 60000);
    const host = new URL(request.url).host;
    try {
      await sendEmail(identifier, magicLinkEmail(host, url, expires));
    } catch (error) {
      console.error("Magic link delivery failed");
      throw error;
    }
  },
} satisfies EmailConfig;

export const authConfig = {
  secret: authEnv.AUTH_SECRET,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    verificationTokensTable: verificationTokens,
  }),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    verifyRequest: "/login",
    error: "/login",
  },
  providers: [
    Google({
      clientId: authEnv.AUTH_GOOGLE_ID,
      clientSecret: authEnv.AUTH_GOOGLE_SECRET,
      // Google verifies email ownership, which lets us safely merge Google sign-in
      // with an existing credentials-based user that shares the same email address.
      allowDangerousEmailAccountLinking: true,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified ? new Date() : null,
        };
      },
    }),
    magicLinkProvider,
    Credentials({
      credentials: {
        email: {
          label: "Email",
          type: "email",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        const parsedCredentials = credentialsSchema.safeParse(credentials);

        if (!parsedCredentials.success) {
          return null;
        }

        await limit(`login:${parsedCredentials.data.email}`, 10, 15 * 60000);
        const user = await getUserByEmail(parsedCredentials.data.email);

        if (!user?.passwordHash) {
          return null;
        }

        const passwordMatches = await compare(
          parsedCredentials.data.password,
          user.passwordHash,
        );

        if (!passwordMatches) {
          return null;
        }

        return toAuthUser(user);
      },
    }),
  ],
  events: {
    async linkAccount({ account, user }) {
      if (account.provider === "google" && user.id) {
        await markUserEmailVerified(user.id);
      }
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const googleProfile = profile as GoogleProfile | undefined;
        return Boolean(googleProfile?.email_verified && googleProfile.email);
      }

      return true;
    },
    async jwt({ token, user }) {
      if (!token.sub) return null;
      const [record] = await db
        .select({ suspended: users.suspended, version: users.sessionVersion })
        .from(users)
        .where(eq(users.id, token.sub));
      if (!record || record.suspended) return null;
      if (user) token.version = record.version;
      if (token.version !== record.version) return null;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
