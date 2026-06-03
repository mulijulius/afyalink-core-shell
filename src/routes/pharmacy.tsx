import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/pharmacy")({
  component: () => <PagePlaceholder title="Pharmacy" description="Dispensing & stock." />,
});
