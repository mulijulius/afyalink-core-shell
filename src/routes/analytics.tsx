import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/analytics")({
  component: () => <PagePlaceholder title="Analytics" description="Reports and insights." />,
});
