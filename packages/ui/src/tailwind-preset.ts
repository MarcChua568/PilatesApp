import type { Config } from 'tailwindcss';

/**
 * Shared design tokens for the Pilates studio apps. Derived from the MiliClub
 * visual research (docs/design/miliclub-design-research.md): calm, earthy,
 * minimal — warm creams, espresso brown, moss accent, hairline borders, no
 * shadows.
 */
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        bg: '#f1e7d8',
        surface: '#faf5ec',
        ink: '#1b1b1b',
        muted: '#777068',
        primary: { DEFAULT: '#513823', fg: '#f8f3ea' },
        accent: '#66715b',
        line: '#e0d5c3',
        danger: '#8c4a3b',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: { sm: '6px', md: '12px', lg: '28px' },
      letterSpacing: { tightpx: '-0.02em', eyebrow: '0.14em' },
      maxWidth: { prose: '72ch' },
      boxShadow: { none: 'none' },
    },
  },
};

export default preset;
