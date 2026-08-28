import * as React from 'react';
import { cn } from '@pilates/ui';

const base =
  'flex w-full rounded-md border border-line bg-surface px-3 text-sm outline-none transition-colors duration-200 ease-editorial placeholder:text-muted/70 focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/25 disabled:opacity-50';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(base, 'h-9 py-1', className)}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(base, 'min-h-[80px] py-2', className)}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
