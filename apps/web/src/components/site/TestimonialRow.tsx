import { Reveal } from './Reveal';

export interface Testimonial {
  quote: string;
  name: string;
  detail?: string;
}

export function TestimonialRow({ items }: { items: Testimonial[] }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t, i) => (
        <Reveal key={t.name} delay={(i % 3) * 0.06}>
          <figure className="flex h-full flex-col rounded-lg border border-line bg-surface p-6">
            <blockquote className="flex-1 font-display text-lg font-light italic leading-relaxed tracking-tight">
              “{t.quote}”
            </blockquote>
            <figcaption className="mt-4 text-sm">
              <span className="font-medium">{t.name}</span>
              {t.detail && (
                <span className="text-muted"> · {t.detail}</span>
              )}
            </figcaption>
          </figure>
        </Reveal>
      ))}
    </div>
  );
}
