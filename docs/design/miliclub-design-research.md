# MiliClub — Visual Design Language Research

Purpose: extract **transferable** aesthetic / UX direction for our class-reservation
platform. This is reference only — we are not cloning the brand, wordmark, copy, or
photography.

Context: "MILI" (miliclubofficial.com) is a Shopify store for an activewear/apparel
line founded by Mikha Lim. Store is password-gated; the public "coming soon" page is a
long scroll-driven brand intro. Brand shorthand: *MOVE. INTEND. LIFESTYLE. INSPIRE.*
Self-described mood: **"Calm. Earthy. Minimal."**

## What was inspected

- `https://miliclubofficial.com/password` — full raw HTML + inline CSS captured (169 KB). Primary source; contains a complete CSS custom-property theme.
- `https://miliclubofficial.com/` — redirects to the same password page (168 KB), same tokens; `--font-stack-*` resolved here to real families.
- `robots.txt` → "Unauthorized"; `sitemap.xml` → empty. No other pages reachable.
- Instagram `@miliclubofficial` — login-walled; only a thin, partly unreliable description obtained (see Confidence).

## Findings

### Color — warm, earthy, low-contrast "luxe minimal"
Palette is built on warm browns, creams, and muted olives rather than neutral grey.
Two modes coexist: light cream sections and a deep espresso-brown "intro" section.

| Role | Hex | Notes |
|---|---|---|
| Page background (light) | `#ffffff` / `#e9ddcd` | white base; warm sand for narrative sections |
| Secondary warm bg | `#eaded0`, `#f1e7d8` | cream panels / text on dark |
| Deep feature bg | `#513823`, `#4c3726` | espresso brown (intro + newsletter panel) |
| Text (primary) | `#1b1b1b`, `#181817` | near-black, never pure `#000` for body |
| Text (muted) | `#777068`, `#827368` | warm taupe-grey |
| Hairline / rule | `#cec1b1`, `#d7c9b8` | low-contrast warm borders |
| Accent — moss/olive | `#66715B`, `#485b28` | "meaning" accent, sparingly |
| Accent — warm brown | `#5C4435` | "belief" accent |
| Button bg (dark) | `#000000` / `#212121` | high-contrast CTA on light |
| Alerts | success `#d4edda`/`#155724`, error `#FFE3E3`/`#FF0000` | conventional |

Mood: warm, quiet, tactile, "spa / studio" — closer to natural-linen than gym-neon.

### Typography
- **Body & headings:** `"DM Sans", sans-serif`. Headings run **very light** (`font-weight: 200`), body `400`, semibold `600` for emphasis.
- **Accent/quote face:** `Fraunces, serif`, **italic**, weight `300` — used for editorial pull-lines only.
- **Display headings:** large and airy — hero/newsletter heading ~`88px` desktop / `58px` mobile; section accents `82–86px`. Tight tracking: `letter-spacing: -0.03em` to `-0.045em`.
- **Small labels / eyebrows / buttons:** UPPERCASE with **wide positive tracking** `0.12em`–`0.22em`; buttons `text-transform: uppercase`.
- Body copy sizes `17px` (lead `21px`), generous line length caps (~`900px` content width, `520px` form width).
- Personality: understated, editorial, magazine-like; light-weight big type contrasted with tiny wide-spaced caps.

### Layout & spacing
- Single-column, centered, vertical-scroll narrative. Heavy whitespace; one idea per viewport.
- **Scroll-pinned / scroll-driven sections** — section wrappers are `420vh`–`520vh` tall, content stays pinned while text cross-fades and translates.
- Content max-widths ~`900px`; side padding `60px` desktop / `20px` mobile.
- Border-radius scale: buttons `10px`, inputs/cards `5–8px`, images `12px`, badges/chips `20px`, large feature panels `28–30px`, pills/swatches `100–120px`.
- Shadows: essentially none (`box-shadow: none`); depth comes from color blocks and blur, not elevation.
- Cards = flat warm-tone blocks separated by hairline rules, not drop-shadowed containers.

### Imagery / photography
- Founder shot styled as a **polaroid** (white border, slight rotation) — casual, personal.
- Full-bleed background image behind the newsletter panel, **blurred `9px` and darkened ~15%** so text sits on a soft wash.
- Intro section is a **video** with a near-transparent dark overlay (`opacity 0.1`).
- Instagram (low confidence): high-contrast **black-and-white** lifestyle + product shots, motion-oriented, text-poster graphics.
- Net direction: natural light, warm/neutral grade, real bodies mid-movement, framing that de-emphasizes face and emphasizes gesture; images treated softly (blur/darken) when used as backdrops.

### Motion
- Signature easing `cubic-bezier(0.22, 0.61, 0.36, 1)` (fast-out, long settle); durations **700–1800ms** — slow and deliberate.
- Reveal pattern: `opacity 0→1` + `translate3d(0, 12–38px, 0)`, sometimes with `scale(1.02–1.08)` and ±1–2° rotate for the polaroid.
- **Staggered** children via `transition-delay` in ~90ms steps (0 / 180 / 270 / 360 / 450ms).
- Hover: gentle `scale(1.015–1.02)` on interactive imagery.
- `prefers-reduced-motion` respected (`transform: none !important`, `filter: none !important` overrides present).
- Scroll cues: tiny uppercase "scroll slowly ↓" hints at ~`0.45` opacity.

### Tone / voice (for reference, do not copy)
Second-person, calm, encouraging, non-hype: "for the days you almost stayed home."
Frames product as support for a routine, not a performance. Lowercase used deliberately
for soft asides ("almost there. check your email…").

## Proposed design tokens (adoptable values)

```css
:root {
  /* color — warm minimal */
  --bg:            #ffffff;
  --bg-warm:       #e9ddcd;   /* narrative / alt sections */
  --bg-cream:      #f1e7d8;   /* panels, text on dark */
  --surface-dark:  #513823;   /* espresso feature band */
  --text:          #1b1b1b;
  --text-muted:    #777068;
  --hairline:      #cec1b1;
  --accent-moss:   #66715B;   /* primary accent, sparing */
  --accent-brown:  #5C4435;
  --cta-bg:        #141414;
  --cta-text:      #ffffff;
  --ok-bg:#d4edda; --ok-text:#155724;
  --err-bg:#FFE3E3; --err-text:#c0140f;

  /* type */
  --font-sans: "DM Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-serif: "Fraunces", Georgia, "Times New Roman", serif; /* italic accent only */
  --fw-heading: 300;      /* MILI uses 200; 300 is safer for small UI */
  --fw-body: 400;
  --fw-bold: 600;
  --tracking-display: -0.03em;
  --tracking-eyebrow: 0.16em;   /* uppercase labels */
  --step-xs: 0.8125rem;  /* 13px eyebrow */
  --step-sm: 0.9375rem;
  --step-md: 1.0625rem;  /* 17px body */
  --step-lg: 1.3125rem;  /* 21px lead */
  --step-display: clamp(2.5rem, 6vw, 5rem);

  /* space & shape */
  --content-max: 900px;
  --form-max: 520px;
  --pad-inline: clamp(20px, 5vw, 60px);
  --radius-input: 6px;
  --radius-card: 12px;
  --radius-pill: 999px;
  --radius-panel: 28px;
  --shadow: none;               /* use color blocks + hairlines instead */
  --border: 1px solid var(--hairline);

  /* motion */
  --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
  --dur-fast: 180ms;
  --dur-ui: 320ms;
  --dur-reveal: 700ms;
  --stagger: 90ms;
  --reveal-shift: 20px;
}
@media (prefers-reduced-motion: reduce) {
  :root { --dur-reveal: 0ms; --reveal-shift: 0px; }
}
```

Pattern guidance:
- Reserve the espresso band (`--surface-dark`) for one or two high-emphasis moments (hero, confirmation), not general chrome.
- Buttons: solid dark, uppercase, wide tracking, `10px` radius, no shadow; hover = `scale(1.015)` + slight bg lift.
- Eyebrows/labels: uppercase, `0.16em` tracking, muted color, ~13px.
- Editorial headings: large, weight 300, tight tracking; use Fraunces italic only for a single quote/tagline per view.
- Cards/list rows for classes: flat, warm surface, hairline dividers, `12px` radius, generous padding.
- Section entrance: fade + 20px rise, 700ms, `--ease`, children staggered 90ms.
- Background photos: always blur ~8px + 15% dark scrim when text overlaps.

## Confidence / gaps

- **High confidence:** color tokens, type families/weights/tracking, radius scale, motion easing/durations, spacing maxima — all read directly from the live inline CSS custom properties on the password page.
- **Medium:** exact heading pixel sizes (values are the brand's own extreme scale; adjust for a functional app). Whether the store interior (post-login) uses the same theme — could not access.
- **Low / unverified:** Instagram aesthetic (login-walled; description is partly inferred, treat B&W claim cautiously). No press coverage of the design exists yet. Could not retrieve `/pages/about`, product pages, or any real photography to judge grade first-hand.
- **Not captured:** actual font files / @font-face specifics beyond family names; icon style; any dark-mode UI (brand mixes light + dark sections but has no true toggle).
