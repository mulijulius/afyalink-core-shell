import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/billing")({
  component: () => <PagePlaceholder title="Billing" description="Invoicing and NHIF claims." />,
});
