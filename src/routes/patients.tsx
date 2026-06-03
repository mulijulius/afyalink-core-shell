import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/patients")({
  component: () => <PagePlaceholder title="Patients" description="Manage patient records." />,
});
