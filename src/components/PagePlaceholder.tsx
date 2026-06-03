export function PagePlaceholder({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed bg-card text-sm text-muted-foreground">
        {title} module coming soon
      </div>
    </div>
  );
}
