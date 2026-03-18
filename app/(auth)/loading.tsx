import { PageLoader } from "@/components/feedback/page-loader";

export default function AuthLoading() {
  return (
    <PageLoader
      eyebrow="Authentication"
      title="Securing your session"
      description="Preparing sign-in and registration so you can get back to your rides."
    />
  );
}
