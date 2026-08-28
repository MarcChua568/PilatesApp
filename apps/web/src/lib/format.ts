/** Philippine peso, no decimals: 1800 -> "₱1,800". */
export const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;

/** "Sat, Sep 6" */
export const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

/** "9:00 AM" */
export const time = (iso: string) =>
  new Date(iso).toLocaleTimeString('en-PH', {
    hour: 'numeric',
    minute: '2-digit',
  });

/** "Saturday, September 6 · 9:00 AM" */
export const longDateTime = (iso: string) =>
  `${new Date(iso).toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })} · ${time(iso)}`;
