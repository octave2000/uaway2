type SearchParamValue = string | string[] | undefined;

export function getSearchParam(value: SearchParamValue): string | undefined {
  return typeof value === "string" ? value : value?.[0];
}

export function getSafeRedirectTarget(
  value: FormDataEntryValue | SearchParamValue | null | undefined,
): string {
  const candidate =
    typeof value === "string" ? value : Array.isArray(value) ? value[0] : null;

  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) {
    return "/dashboard";
  }

  return candidate;
}

export function getAuthErrorMessage(error: string | undefined): string | null {
  if (!error) {
    return null;
  }

  switch (error) {
    case "invalid_fields":
      return "Check the submitted fields and try again.";
    case "account_exists":
      return "An account with that email already exists.";
    case "CredentialsSignin":
      return "Invalid email or password.";
    case "OAuthAccountNotLinked":
      return "This Google account is already linked to a different user.";
    case "Verification":
      return "That magic link is invalid or has expired.";
    case "AccessDenied":
      return "Access was denied for this sign-in attempt.";
    case "Configuration":
      return "Authentication is not configured correctly yet.";
    default:
      return "Authentication failed. Please try again.";
  }
}

export function getAuthNotice(
  provider: string | undefined,
  type: string | undefined,
): string | null {
  if (provider === "email" && type === "email") {
    return "Magic link sent. Check your inbox for the sign-in link.";
  }

  return null;
}
