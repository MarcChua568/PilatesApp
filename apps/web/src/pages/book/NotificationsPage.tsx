import { formatDistanceToNow } from 'date-fns';
import {
  Bell,
  CalendarCheck,
  CalendarX,
  Clock,
  PartyPopper,
  Sparkles,
} from 'lucide-react';
import type { NotificationType } from '@pilates/api-client';
import { hooks } from '@/lib/api';
import { Button } from '@/components/ui/button';

const ICON: Record<NotificationType, typeof Bell> = {
  booked: CalendarCheck,
  waitlist_promoted: Sparkles,
  reminder: Clock,
  cancelled: CalendarX,
  welcome: PartyPopper,
  event_rsvp: PartyPopper,
};

export function NotificationsPage() {
  const { data: notifications, isLoading } = hooks.useNotifications();
  const markAll = hooks.useMarkAllNotificationsReadMutation();
  const markOne = hooks.useMarkNotificationReadMutation();

  const unread = (notifications ?? []).filter((n) => !n.readAt).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="eyebrow">Your inbox</p>
          <h1 className="mt-1 font-display text-2xl font-light tracking-tight">
            Notifications
          </h1>
        </div>
        {unread > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : (notifications ?? []).length === 0 ? (
        <div className="rounded-lg border border-line bg-surface p-10 text-center">
          <Bell className="mx-auto h-6 w-6 text-muted" />
          <p className="mt-3 text-sm text-muted">Nothing here yet.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line border-y border-line">
          {(notifications ?? []).map((n) => {
            const Icon = ICON[n.type] ?? Bell;
            return (
              <li
                key={n.id}
                className={`flex gap-4 py-4 ${n.readAt ? 'opacity-70' : ''}`}
                onMouseEnter={() => !n.readAt && markOne.mutate(n.id)}
              >
                <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{n.title}</p>
                    {!n.readAt && (
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{n.body}</p>
                  <p className="mt-1 text-xs text-muted">
                    {formatDistanceToNow(new Date(n.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
