import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { DomainError } from "./policy";
import { ZodError } from "zod";
export async function runAction(
  path: string,
  operation: () => Promise<unknown>,
) {
  let error: string | undefined;
  try {
    await operation();
  } catch (e) {
    if (e instanceof DomainError) error = e.message;
    else if (e instanceof ZodError)
      error = e.issues[0]?.message ?? "Check the submitted details.";
    else throw e;
  }
  revalidatePath("/", "layout");
  redirect(
    error
      ? `${path}${path.includes("?") ? "&" : "?"}error=${encodeURIComponent(error)}`
      : path,
  );
}
