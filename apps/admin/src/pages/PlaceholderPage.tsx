export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div>
      <p className="eyebrow mb-1">Admin</p>
      <h1 className="text-2xl">{title}</h1>
      <p className="mt-4 text-muted">Coming up in a later task.</p>
    </div>
  );
}
