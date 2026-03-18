import { PageLoader } from "@/components/feedback/page-loader";

export default function DashboardLoading() {
  return (
    <PageLoader
      eyebrow="Dashboard"
      title="Loading your control center"
      description="Pulling together journeys, bookings, vehicles, payouts, and verification status."
    />
  );
}
