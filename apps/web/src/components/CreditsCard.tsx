import { useState } from 'react';
import { format } from 'date-fns';
import { hooks } from '@/lib/api';
import { errorMessage, toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/label';

const PRESET_AMOUNTS = [1, 3, 5, 10];

const TRANSACTION_LABELS: Record<string, string> = {
  purchase: 'Purchased',
  gift_sent: 'Sent as a gift',
  gift_received: 'Received as a gift',
  redeemed: 'Used for a class',
  refund: 'Refunded',
};

/**
 * Balance + ledger + buy/gift, all on the account page. Purchase is the
 * same "preview checkout" pattern as the pricing page — no real payment
 * taken yet. Redeeming credits toward a booking isn't wired into checkout
 * yet; this is purchase + gifting + the ledger only.
 */
export function CreditsCard() {
  const { data, isLoading } = hooks.useMyCredits();
  const purchase = hooks.usePurchaseCreditsMutation();
  const gift = hooks.useGiftCreditsMutation();

  const [buying, setBuying] = useState(false);
  const [gifting, setGifting] = useState(false);
  const [amount, setAmount] = useState(3);
  const [giftEmail, setGiftEmail] = useState('');
  const [giftAmount, setGiftAmount] = useState(1);
  const [giftMessage, setGiftMessage] = useState('');

  const buy = (e: React.FormEvent) => {
    e.preventDefault();
    purchase.mutate(amount, {
      onSuccess: () => {
        toast.success(`Added ${amount} credit${amount === 1 ? '' : 's'}`);
        setBuying(false);
      },
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  const send = (e: React.FormEvent) => {
    e.preventDefault();
    gift.mutate(
      { recipientEmail: giftEmail, amount: giftAmount, message: giftMessage || undefined },
      {
        onSuccess: () => {
          toast.success(`Sent ${giftAmount} credit${giftAmount === 1 ? '' : 's'} to ${giftEmail}`);
          setGifting(false);
          setGiftEmail('');
          setGiftMessage('');
        },
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  return (
    <Card className="mt-4">
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <p className="eyebrow">MILE Credits</p>
          <p className="font-display text-2xl">
            {isLoading ? '…' : (data?.balance ?? 0)}
          </p>
        </div>

        {!buying && !gifting && (
          <div className="mt-4 flex gap-2">
            <Button size="sm" onClick={() => setBuying(true)}>
              Buy credits
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setGifting(true)}
              disabled={!data?.balance}
            >
              Gift credits
            </Button>
          </div>
        )}

        {buying && (
          <form onSubmit={buy} className="mt-4 space-y-3">
            <Field label="How many credits?" htmlFor="c-amount">
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setAmount(n)}
                    className={`rounded-md border px-3 py-1.5 text-sm ${
                      amount === n
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-line text-muted hover:border-primary/40'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </Field>
            <p className="text-xs text-muted">
              Preview checkout — no payment is taken yet.
            </p>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={purchase.isPending}>
                {purchase.isPending ? 'Adding…' : `Add ${amount} credit${amount === 1 ? '' : 's'}`}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setBuying(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {gifting && (
          <form onSubmit={send} className="mt-4 space-y-3">
            <Field label="Friend's email" htmlFor="g-email">
              <Input
                id="g-email"
                type="email"
                value={giftEmail}
                onChange={(e) => setGiftEmail(e.target.value)}
                placeholder="friend@example.com"
                required
              />
            </Field>
            <Field label="Credits to send" htmlFor="g-amount">
              <Input
                id="g-amount"
                type="number"
                min={1}
                max={data?.balance ?? 1}
                value={giftAmount}
                onChange={(e) => setGiftAmount(Number(e.target.value))}
                required
              />
            </Field>
            <Field label="Message (optional)" htmlFor="g-message">
              <Input
                id="g-message"
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Come try a class with me!"
              />
            </Field>
            <p className="text-xs text-muted">
              If they're not a MILE member yet, we'll email them a link to
              claim it.
            </p>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={gift.isPending}>
                {gift.isPending ? 'Sending…' : 'Send gift'}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setGifting(false)}>
                Cancel
              </Button>
            </div>
          </form>
        )}

        {!!data?.transactions.length && (
          <div className="mt-5 border-t border-line pt-4">
            <p className="mb-2 text-xs uppercase tracking-eyebrow text-muted">
              Recent activity
            </p>
            <div className="space-y-2 text-sm">
              {data.transactions.slice(0, 8).map((t) => {
                const credit = t.type === 'gift_sent' || t.type === 'redeemed';
                return (
                  <div key={t.id} className="flex items-center justify-between">
                    <span className="text-muted">
                      {TRANSACTION_LABELS[t.type] ?? t.type} ·{' '}
                      {format(new Date(t.createdAt), 'd MMM')}
                    </span>
                    <span className={credit ? 'text-danger' : 'text-accent'}>
                      {credit ? '−' : '+'}
                      {t.amount}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
