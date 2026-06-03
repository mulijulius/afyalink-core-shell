import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/referrals")({
  component: () => <PagePlaceholder title="Referrals" description="Inter-facility referrals." />,
});
