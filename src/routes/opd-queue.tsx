import { createFileRoute } from "@tanstack/react-router";
import { PagePlaceholder } from "@/components/PagePlaceholder";

export const Route = createFileRoute("/opd-queue")({
  component: () => <PagePlaceholder title="OPD Queue" description="Outpatient queue management." />,
});
