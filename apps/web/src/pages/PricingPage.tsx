import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { Reveal } from '@/components/site/Reveal';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const PLANS = [
  {
    name: 'Intro offer',
    price: '$49',
    unit: 'for 2 weeks',
    features: ['Unlimited classes for 14 days', 'Reformer + mat', 'New clients only'],
    featured: true,
  },
  {
    name: 'Class pack',
    price: '$210',
    unit: '10 classes',
    features: ['Book any class', 'Valid 90 days', 'Shareable with a friend'],
  },
  {
    name: 'Membership',
    price: '$189',
    unit: 'per month',
    features: ['8 classes / month', 'Priority waitlist', 'Guest passes'],
  },
];

export function PricingPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <Reveal>
        <p className="eyebrow">Pricing</p>
        <h1 className="mt-2 font-display text-4xl font-light tracking-tightpx">
          Simple, no lock-in
        </h1>
        <p className="mt-2 text-sm text-muted">
          Packages are illustrative for now — billing isn't wired up yet.
        </p>
      </Reveal>

      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {PLANS.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.06}>
            <Card
              className={p.featured ? 'border-primary/50 bg-primary/[0.04]' : ''}
            >
              <CardContent className="pt-6">
                {p.featured && (
                  <p className="eyebrow mb-2 text-primary">Most popular</p>
                )}
                <p className="font-display text-xl">{p.name}</p>
                <p className="mt-2 font-display text-4xl font-light tracking-tightpx">
                  {p.price}
                </p>
                <p className="text-sm text-muted">{p.unit}</p>
                <ul className="mt-5 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={p.featured ? 'default' : 'outline'}
                  asChild
                >
                  <Link to="/classes">Get started</Link>
                </Button>
              </CardContent>
            </Card>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
