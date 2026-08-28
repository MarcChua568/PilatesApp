import type { EventItem } from '@pilates/api-client';
import { SITE } from './seo';

const fmt = (iso: string) =>
  new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** A downloadable .ics data URI for a single event. */
export function eventIcsHref(event: EventItem): string {
  const end =
    event.endsAt ??
    new Date(new Date(event.startsAt).getTime() + 90 * 60_000).toISOString();
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MILE Wellness//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@milewellness.ph`,
    `DTSTAMP:${fmt(new Date().toISOString())}`,
    `DTSTART:${fmt(event.startsAt)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${event.summary.replace(/\n/g, ' ')}`,
    `LOCATION:${SITE.name}, ${SITE.streetAddress}, ${SITE.locality}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `data:text/calendar;charset=utf-8,${encodeURIComponent(lines.join('\r\n'))}`;
}
