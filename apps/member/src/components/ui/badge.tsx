import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@pilates/ui';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium',
  {
    variants: {
      tone: {
        neutral: 'bg-line/60 text-ink',
        primary: 'bg-primary/10 text-primary',
        accent: 'bg-accent/15 text-accent',
        danger: 'bg-danger/15 text-danger',
        muted: 'bg-transparent text-muted border border-line',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
