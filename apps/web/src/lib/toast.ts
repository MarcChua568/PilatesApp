import { toast } from 'sonner';
import { ApiError } from '@pilates/api-client';

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (Array.isArray((err.body as { message?: unknown })?.message)) {
      return ((err.body as { message: string[] }).message).join(', ');
    }
    return err.message;
  }
  return err instanceof Error ? err.message : 'Something went wrong';
}

export function toastError(err: unknown) {
  toast.error(errorMessage(err));
}

export { toast };
