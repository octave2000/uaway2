import { redirect } from "next/navigation";
export default async function Journey({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  redirect(`/rides/${(await params).id}`);
}
