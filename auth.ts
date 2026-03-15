import type { DefaultSession, NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { EmailConfig } from "next-auth/providers/email";
import Google, { type GoogleProfile } from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { HubMail } from "hubmail";
import { z } from "zod";

import { db } from "@/db";
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
  HUBMAIL_KEY: z.string().min(1, "HUBMAIL_KEY is required."),
});

const authEnv = authEnvSchema.parse(process.env);
const hubmail = new HubMail({
  apiKey: authEnv.HUBMAIL_KEY,
});

const credentialsSchema = z.object({
  email: z.string().trim().email().transform(normalizeEmail),
  password: z.string().min(8),
});

function buildMagicLinkEmail(params: {
  expires: Date;
  host: string;
  url: string;
}) {
  const expiresAt = params.expires.toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return {
    subject: `Your magic link for ${params.host}`,
    text: [
      `Sign in to ${params.host}.`,
      "",
      params.url,
      "",
      `This link expires on ${expiresAt}.`,
      "If you did not request it, you can safely ignore this email.",
    ].join("\n"),
    html: `
      <div style="background:#f6f0e8;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;color:#1d1814;">
        <div style="max-width:560px;margin:0 auto;background:#fffaf5;border:1px solid rgba(51,35,24,.12);border-radius:24px;padding:32px;">
          <p style="margin:0 0 12px;font-size:12px;letter-spacing:.32em;text-transform:uppercase;color:#9f421b;">Uaway</p>
          <h1 style="margin:0 0 16px;font-size:28px;line-height:1.15;">Use your magic link</h1>
          <p style="margin:0 0 24px;font-size:16px;line-height:1.7;color:#6e6257;">
            Click the button below to sign in to <strong>${params.host}</strong>. This link expires on ${expiresAt}.
          </p>
          <a
            href="${params.url}"
            style="display:inline-block;border-radius:999px;background:#cc6231;color:#ffffff;padding:14px 22px;text-decoration:none;font-weight:700;"
          >
            Sign in
          </a>
          <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#6e6257;">
            If the button does not work, paste this URL into your browser:<br />
            <a href="${params.url}" style="color:#9f421b;word-break:break-all;">${params.url}</a>
          </p>
        </div>
      </div>
    `,
  };
}

const magicLinkProvider = {
  id: "email",
  type: "email",
  name: "Email",
  from: authEnv.AUTH_EMAIL_FROM,
  maxAge: 60 * 30,
  async sendVerificationRequest({
    expires,
    identifier,
    provider,
    request,
    url,
  }) {
    const host = new URL(request.url).host;
    const email = buildMagicLinkEmail({
      expires,
      host,
      url,
    });
    try {
      const data = await hubmail.send({
        from: provider.from ?? authEnv.AUTH_EMAIL_FROM,
        to: identifier,
        subject: email.subject,
        text: email.text,
        html: email.html,
      });
      console.log("Email sent successfully:", data);
    } catch (error) {
      console.error("Error sending email:", error);
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
    async jwt({ token }) {
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
