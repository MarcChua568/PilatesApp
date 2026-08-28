import { Link } from 'react-router-dom';
import { SITE, socialLinks } from '@/lib/seo';

const COLUMNS = [
  {
    heading: 'Studio',
    links: [
      { to: '/about', label: 'About MILE' },
      { to: '/the-space', label: 'The Space' },
      { to: '/instructors', label: 'Instructors' },
      { to: '/classes', label: 'Classes' },
    ],
  },
  {
    heading: 'Visit',
    links: [
      { to: '/location', label: 'Location & hours' },
      { to: '/contact', label: 'Contact' },
      { to: '/shop', label: 'MILE Shop' },
    ],
  },
  {
    heading: 'Book',
    links: [
      { to: '/schedule', label: 'Timetable' },
      { to: '/pricing', label: 'Pricing' },
      { to: '/events', label: 'Events' },
      { to: '/book/bookings', label: 'My account' },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-deep text-deep-fg">
      <div className="mx-auto max-w-6xl px-5 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <p className="font-display text-2xl tracking-tightpx">
              MILE<span className="text-primary">.</span>
            </p>
            <p className="mt-1 text-xs uppercase tracking-eyebrow text-deep-fg/50">
              {SITE.tagline}
            </p>
            <p className="mt-3 max-w-xs text-sm text-deep-fg/70">
              A boutique Pilates, barre &amp; movement studio in Salcedo Village,
              Makati. A little further every day.
            </p>
            <div className="mt-4 flex gap-4 text-sm">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  className="text-deep-fg/70 hover:text-primary"
                >
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.heading} className="space-y-2 text-sm">
              <p className="eyebrow text-deep-fg/50">{col.heading}</p>
              {col.links.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  className="block text-deep-fg/80 hover:text-primary"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col justify-between gap-2 border-t border-deep-fg/10 pt-6 text-xs text-deep-fg/40 sm:flex-row">
          <p>
            © {new Date().getFullYear()} {SITE.name}. Photography placeholders
            from Unsplash.
          </p>
          <p>
            {SITE.streetAddress}, {SITE.locality} · {SITE.phone}
          </p>
        </div>
      </div>
    </footer>
  );
}
