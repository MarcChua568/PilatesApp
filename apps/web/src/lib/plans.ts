export interface Plan {
  slug: string;
  name: string;
  price: string;
  priceValue: number; // PHP, for the summary math
  unit: string;
  blurb: string;
  features: string[];
  featured?: boolean;
}

export const PLANS: Plan[] = [
  {
    slug: 'intro',
    name: 'Intro offer',
    price: '₱1,800',
    priceValue: 1800,
    unit: 'for 2 weeks',
    blurb: 'Unlimited reformer + mat for 14 days. New clients only.',
    features: [
      'Unlimited classes for 14 days',
      'Reformer + mat',
      'New clients only',
    ],
    featured: true,
  },
  {
    slug: 'pack-10',
    name: 'Class pack',
    price: '₱7,500',
    priceValue: 7500,
    unit: '10 classes',
    blurb: '10 credits, use them on any class.',
    features: ['Book any class', 'Valid 90 days', 'Shareable with a friend'],
  },
  {
    slug: 'membership',
    name: 'Membership',
    price: '₱6,500',
    priceValue: 6500,
    unit: 'per month',
    blurb: '8 classes a month with priority waitlist.',
    features: ['8 classes / month', 'Priority waitlist', 'Guest passes'],
  },
];

export const getPlan = (slug: string | undefined) =>
  PLANS.find((p) => p.slug === slug);

export const peso = (n: number) => `₱${n.toLocaleString('en-PH')}`;
