import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/settings")({
  component: () => <PagePlaceholder title="Settings" description="Facility & user settings." />,
});
