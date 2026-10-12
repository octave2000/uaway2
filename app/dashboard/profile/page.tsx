import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, trustedContacts } from "@/db/schema";
import { requireAuthenticatedUser } from "@/lib/auth/roles";
import { SubmitButton } from "@/components/ui/submit-button";
import { FileUploadField } from "@/components/uploadthing/file-upload-field";
import { Notice } from "@/components/shared/notice";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutUser } from "@/app/(auth)/actions";
import {
  updateProfileAction,
  submitVerificationAction,
  verifyEmailAction,
  revokeSessionsAction,
  saveTrustedContactAction,
  deleteTrustedContactAction,
} from "./actions";
export default async function Profile({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const { userId, role } = await requireAuthenticatedUser();
  const [[u], contacts] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)),
    db.select().from(trustedContacts).where(eq(trustedContacts.userId, userId)),
  ]);
  return (
    <div className="page-content max-w-3xl">
      <h1 className="page-title">Profile and verification</h1>
      <Notice {...await searchParams} />
      <form className="panel space-y-4" action={updateProfileAction}>
        <FileUploadField
          name="profilePhotoUrl"
          endpoint="profilePhoto"
          label="Public profile photo"
          helper="A clear photo helps other riders recognize you. This image is visible on ride listings."
          accept="image/*"
          acceptedLabel="Image up to 4 MB"
          value={u.profilePhoto}
        />
        <label className="field">
          Full name
          <input
            className="control"
            name="name"
            defaultValue={u.name ?? ""}
            required
            minLength={2}
            maxLength={100}
          />
        </label>
        <label className="field">
          Phone
          <input
            className="control"
            name="phone"
            type="tel"
            defaultValue={u.phone ?? ""}
          />
        </label>
        {role !== "super_admin" && (
          <label className="field">
            Preferred view
            <select
              className="control"
              name="defaultRole"
              defaultValue={u.defaultRole ?? "passenger"}
            >
              <option value="passenger">Passenger</option>
              <option value="driver">Driver</option>
            </select>
          </label>
        )}
        <SubmitButton>Save profile</SubmitButton>
      </form>
      <section className="panel">
        <h2 className="font-semibold">
          Email · {u.emailVerified ? "Verified" : "Needs verification"}
        </h2>
        <p className="my-3 text-sm">{u.email}</p>
        {!u.emailVerified && (
          <form action={verifyEmailAction}>
            <SubmitButton>Send verification link</SubmitButton>
          </form>
        )}
      </section>
      <section className="panel">
        <h2 className="font-semibold">
          Identity ·{" "}
          {u.verified
            ? "Approved"
            : u.idPhoto && u.selfiePhoto
              ? "Under review"
              : "Documents needed"}
        </h2>
        <p className="my-3 text-sm text-muted-foreground">
          Your ID and selfie are private. Only you and authorized reviewers can
          access them.
        </p>
        {u.verificationNote && (
          <p className="my-4 rounded-lg bg-muted p-4 text-sm">
            Reviewer: {u.verificationNote}
          </p>
        )}
        <form action={submitVerificationAction} className="space-y-5">
          <FileUploadField
            name="idPhotoUrl"
            endpoint="identityDocument"
            label="Identity document"
            helper="A clear photo or PDF of your ID."
            accept="image/*,application/pdf"
            acceptedLabel="Image or PDF, up to 8 MB"
            kind="document"
            value={u.idPhoto?.startsWith("/api/files/") ? u.idPhoto : null}
          />
          <FileUploadField
            name="selfiePhotoUrl"
            endpoint="selfiePhoto"
            label="Selfie"
            helper="A clear, recent photo of your face."
            accept="image/*"
            acceptedLabel="Image, up to 4 MB"
            value={
              u.selfiePhoto?.startsWith("/api/files/") ? u.selfiePhoto : null
            }
          />
          <SubmitButton>Submit for review</SubmitButton>
        </form>
      </section>
      <section className="panel">
        <h2 className="mb-4 font-semibold">Security and appearance</h2>
        <ThemeToggle />
        <div className="mt-4 flex flex-wrap gap-3">
          <form action={revokeSessionsAction}>
            <SubmitButton variant="outline">Sign out all devices</SubmitButton>
          </form>
          <form action={signOutUser}>
            <SubmitButton variant="outline">Sign out</SubmitButton>
          </form>
        </div>
      </section>
      <section className="panel space-y-4">
        <div>
          <h2 className="font-semibold">Trusted contacts</h2>
          <p className="mt-1 text-sm text-muted-foreground">Save people you may want to send an active trip link to. Uaway does not message them automatically.</p>
        </div>
        <form action={saveTrustedContactAction} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="field">Contact name<input className="control" name="name" minLength={2} maxLength={100} required /></label>
          <label className="field">Phone number<input className="control" name="phone" type="tel" placeholder="+2547…" minLength={9} maxLength={16} required /></label>
          <SubmitButton>Save contact</SubmitButton>
        </form>
        {contacts.map((contact) => (
          <div key={contact.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
            <span>{contact.name} · {contact.phone}</span>
            <form action={deleteTrustedContactAction}><input type="hidden" name="contactId" value={contact.id} /><SubmitButton variant="outline">Remove</SubmitButton></form>
          </div>
        ))}
      </section>
    </div>
  );
}
