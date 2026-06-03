import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/laboratory")({
  component: () => <PagePlaceholder title="Laboratory" description="Lab orders and results." />,
});
