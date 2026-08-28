import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@pilates/ui';

const badgeVariants = cva(
  'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-medium tracking-wide',
  {
    variants: {
      tone: {
        neutral: 'bg-line/60 text-ink',
        primary: 'bg-primary/12 text-primary',
        accent: 'bg-accent/16 text-accent',
        danger: 'bg-danger/14 text-danger',
        muted: 'border border-line bg-transparent text-muted',
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
