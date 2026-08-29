import { Injectable, Logger } from '@nestjs/common';

/**
 * Transactional email — currently a stub that logs instead of sending, so
 * the gifting flow is fully testable end-to-end before a real provider is
 * wired up. To go live: add a provider (Resend is the simplest — one API
 * call, no SMTP) behind this same interface, gated on a RESEND_API_KEY env
 * var so local/dev keeps logging instead of sending. Nothing calling this
 * service needs to change.
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async send(input: { to: string; subject: string; text: string }): Promise<void> {
    if (!process.env.RESEND_API_KEY) {
      this.logger.log(
        `[email stub — no RESEND_API_KEY set] to=${input.to} subject="${input.subject}"\n${input.text}`,
      );
      return;
    }
    // TODO: call the real provider here once RESEND_API_KEY is set.
    this.logger.warn(
      'RESEND_API_KEY is set but no provider call is wired up yet — still stubbing.',
    );
    this.logger.log(`[email stub] to=${input.to} subject="${input.subject}"`);
  }

  giftInvite(
    to: string,
    senderName: string,
    amount: number,
    claimUrl: string,
  ): Promise<void> {
    const plural = amount === 1 ? '' : 's';
    return this.send({
      to,
      subject: `${senderName} sent you ${amount} MILE credit${plural}`,
      text:
        `Your friend ${senderName} has sent you ${amount} credit${plural} to try a class at MILE!\n\n` +
        `Claim them here: ${claimUrl}\n\n` +
        `(This link works whether or not you already have a MILE account.)`,
    });
  }

  giftReceived(to: string, senderName: string, amount: number): Promise<void> {
    const plural = amount === 1 ? '' : 's';
    return this.send({
      to,
      subject: `${senderName} sent you ${amount} MILE credit${plural}`,
      text: `Your friend ${senderName} just sent you ${amount} credit${plural} — they're already in your MILE account.`,
    });
  }
}
