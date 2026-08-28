import type { StudioPackage } from '@pilates/api-client';

/** Short line under the price on a pricing card. */
export function packageUnit(pkg: StudioPackage): string {
  switch (pkg.kind) {
    case 'membership':
      return 'per month';
    case 'single':
      return 'single class';
    case 'workshop':
      return 'one event';
    case 'intro':
      return pkg.credits ? `${pkg.credits} classes` : 'intro offer';
    case 'pack':
      return pkg.credits ? `${pkg.credits} classes` : 'class pack';
    default:
      return '';
  }
}

export function packageValidity(pkg: StudioPackage): string | null {
  if (!pkg.validityDays) return null;
  if (pkg.validityDays % 30 === 0) {
    const months = pkg.validityDays / 30;
    return `Valid ${months} month${months === 1 ? '' : 's'}`;
  }
  return `Valid ${pkg.validityDays} days`;
}
