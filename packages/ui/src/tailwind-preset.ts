import type { Config } from 'tailwindcss';

/**
 * Shared design tokens for the Pilates studio apps — a warm editorial system:
 * oat and cream grounds, terracotta as the single working accent, espresso
 * "deep" bands for imagery/footers, moss for positive states, hairline borders,
 * no shadows. Display type is Fraunces (editorial serif); UI/body is DM Sans.
 */
const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        bg: '#f4ece0',
        surface: '#fbf6ee',
        ink: '#2a211b',
        muted: '#7c7367',
        primary: { DEFAULT: '#b5623c', fg: '#fbf6ee' },
        deep: { DEFAULT: '#3a2b22', fg: '#f0e6d8' },
        accent: '#6f7a5c',
        line: '#e4d8c6',
        danger: '#a24b39',
      },
      fontFamily: {
        sans: ['"DM Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Fraunces"', 'ui-serif', 'Georgia', 'serif'],
      },
      borderRadius: { sm: '6px', md: '12px', lg: '28px' },
      letterSpacing: { tightpx: '-0.01em', eyebrow: '0.16em' },
      maxWidth: { prose: '68ch' },
      boxShadow: { none: 'none' },
      transitionTimingFunction: {
        editorial: 'cubic-bezier(0.22, 0.61, 0.36, 1)',
      },
    },
  },
};

export default preset;
