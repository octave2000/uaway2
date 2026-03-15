"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";

import { signIn, signOut } from "@/auth";
import { createCredentialsUser, UserAlreadyExistsError } from "@/db/users";

import {
  credentialsFormSchema,
  magicLinkFormSchema,
  registerFormSchema,
} from "./schemas";
import { getSafeRedirectTarget } from "./helpers";

function withRedirectParam(pathname: string, redirectTo: string): string {
  const url = new URL(pathname, "http://localhost");

  if (redirectTo !== "/dashboard") {
    url.searchParams.set("callbackUrl", redirectTo);
  }

  return `${url.pathname}${url.search}`;
}

export async function signInWithGoogle(formData: FormData): Promise<void> {
  const redirectTo = getSafeRedirectTarget(formData.get("redirectTo"));
  await signIn("google", { redirectTo });
}

export async function signInWithCredentials(formData: FormData): Promise<void> {
  const redirectTo = getSafeRedirectTarget(formData.get("redirectTo"));
  const parsedCredentials = credentialsFormSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedCredentials.success) {
    redirect(
      withRedirectParam(`/login?error=invalid_fields`, redirectTo),
    );
  }

  await signIn("credentials", {
    email: parsedCredentials.data.email,
    password: parsedCredentials.data.password,
    redirectTo,
  });
}

export async function sendMagicLink(formData: FormData): Promise<void> {
  const redirectTo = getSafeRedirectTarget(formData.get("redirectTo"));
  const parsedEmail = magicLinkFormSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsedEmail.success) {
    redirect(
      withRedirectParam(`/login?error=invalid_fields`, redirectTo),
    );
  }

  await signIn("email", {
    email: parsedEmail.data.email,
    redirectTo,
  });
}

export async function registerWithPassword(formData: FormData): Promise<void> {
  const redirectTo = getSafeRedirectTarget(formData.get("redirectTo"));
  const parsedRegistration = registerFormSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsedRegistration.success) {
    redirect(
      withRedirectParam(`/register?error=invalid_fields`, redirectTo),
    );
  }

  try {
    const passwordHash = await hash(parsedRegistration.data.password, 12);

    await createCredentialsUser({
      email: parsedRegistration.data.email,
      name: parsedRegistration.data.name,
      passwordHash,
    });
  } catch (error) {
    if (error instanceof UserAlreadyExistsError) {
      redirect(
        withRedirectParam(`/register?error=account_exists`, redirectTo),
      );
    }

    throw error;
  }

  await signIn("credentials", {
    email: parsedRegistration.data.email,
    password: parsedRegistration.data.password,
    redirectTo,
  });
}

export async function signOutUser(): Promise<void> {
  await signOut({
    redirectTo: "/login",
  });
}
