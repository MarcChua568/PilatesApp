import { useState } from 'react';
import { Check } from 'lucide-react';
import { Seo } from '@/components/site/Seo';
import { Reveal } from '@/components/site/Reveal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ShopPage() {
  const [done, setDone] = useState(false);

  return (
    <div className="mx-auto max-w-2xl px-5 py-24 text-center">
      <Seo
        title="MILE Shop"
        description="Grip socks, apparel and small-batch wellness goods — the MILE Shop opens soon."
        path="/shop"
      />

      <Reveal>
        <p className="eyebrow">MILE Shop</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tightpx sm:text-5xl">
          Opening soon
        </h1>
        <p className="mt-4 text-muted">
          Grip socks, a small apparel line, and the wellness goods we actually
          use around the studio. We're putting it together — leave your email and
          we'll tell you when it's live.
        </p>
      </Reveal>

      {done ? (
        <Reveal className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent/15 px-4 py-2 text-sm text-accent">
          <Check className="h-4 w-4" /> You're on the list.
        </Reveal>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
          className="mx-auto mt-8 flex max-w-sm gap-2"
        >
          <Input type="email" required placeholder="you@example.com" />
          <Button type="submit">Notify me</Button>
        </form>
      )}
    </div>
  );
}
