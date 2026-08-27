import type { ReactNode } from 'react';

export function PageHeader({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="eyebrow mb-1">Admin</p>
        <h1 className="text-2xl">{title}</h1>
        {children}
      </div>
      {action}
    </div>
  );
}
