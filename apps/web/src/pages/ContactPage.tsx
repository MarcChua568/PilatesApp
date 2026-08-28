import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { hooks } from '@/lib/api';
import { block } from '@/lib/content';
import { SITE } from '@/lib/seo';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';

export function ContactPage() {
  const { data: content } = hooks.useSiteContent();
  const intro = block(content, 'contact.intro', {
    heading: 'Say hello',
    body: 'Questions about classes, memberships, events or the café — send them here.',
  });
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    // No mail provider wired — validate, pause, confirm. Nothing leaves the browser.
    setTimeout(() => {
      setBusy(false);
      setSent(true);
    }, 700);
  }

  return (
    <div className="mx-auto max-w-3xl px-5 py-16">
      <Seo
        title="Contact"
        description="Get in touch with MILE Wellness in Salcedo Village, Makati."
        path="/contact"
      />

      <Reveal>
        <p className="eyebrow">Contact</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tight sm:text-5xl">
          {intro.heading}
        </h1>
        <p className="mt-3 text-muted">{intro.body}</p>
        <p className="mt-2 text-sm text-muted">
          {SITE.email} · {SITE.phone}
        </p>
      </Reveal>

      {sent ? (
        <Reveal className="mt-10 rounded-lg border border-line bg-surface p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-accent/15 text-accent">
            <Check className="h-6 w-6" />
          </div>
          <p className="mt-4 font-display text-2xl font-light tracking-tight">
            Thanks — we'll reply within one business day.
          </p>
          <p className="mt-2 text-sm text-muted">
            To book a class you don't need to wait for us — use the{' '}
            <Link to="/schedule" className="text-primary underline">
              timetable
            </Link>
            .
          </p>
        </Reveal>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Name" htmlFor="c-name">
              <Input id="c-name" required />
            </Field>
            <Field label="Email" htmlFor="c-email">
              <Input id="c-email" type="email" required />
            </Field>
          </div>
          <Field label="What can we help with?" htmlFor="c-subject">
            <Input id="c-subject" placeholder="Memberships, events, the café…" />
          </Field>
          <Field label="Message" htmlFor="c-message">
            <textarea
              id="c-message"
              required
              rows={5}
              className="w-full rounded-md border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </Field>
          <Button type="submit" size="lg" disabled={busy}>
            {busy ? 'Sending…' : 'Send message'}
          </Button>
          <p className="text-xs text-muted">
            This form isn't wired to email yet — it's a preview.
          </p>
        </form>
      )}
    </div>
  );
}
