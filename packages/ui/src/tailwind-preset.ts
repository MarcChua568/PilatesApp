import type { Config } from 'tailwindcss';

/**
 * MILE Wellness design tokens — warm, editorial, premium. Cream/beige grounds,
 * warm-brown "deep" bands for imagery/footers, deep burgundy as the single
 * working accent, linen/camel for quiet positives, hairline borders, no shadows.
 * Display type is Fraunces (editorial serif); UI/body is DM Sans.
 */
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        bg: '#f2ebdf',
        surface: '#faf4ea',
        ink: '#2a211b',
        muted: '#7c7367',
        primary: { DEFAULT: '#6d2f3a', fg: '#f7efe3' },
        deep: { DEFAULT: '#372a20', fg: '#efe4d4' },
        accent: '#8a7857',
        line: '#e4d8c5',
        danger: '#9c4b3b',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: { sm: '6px', md: '12px', lg: '28px' },
      letterSpacing: { eyebrow: '0.16em' },
      maxWidth: { prose: '68ch' },
      boxShadow: { none: 'none' },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
};

export default preset;
