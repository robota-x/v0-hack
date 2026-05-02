# Dynamic Pulse — design spec

**Canonical source:** [`code.html`](./code.html). This file summarizes it for implementation. If anything here disagrees with the HTML, **the HTML wins**.

**Rule:** Prefer **hex (or explicit `rgba`)** in tokens and in conversation. Color names below are labels only; the hex column is authoritative.

---

## Page canvas

| Role | Value | Where in `code.html` |
|------|--------|----------------------|
| Main background | `#38bdf8` | `.bg-vibrant-blue`, `body` |
| Body text (default) | `#1d1b20` | `text-on-surface` → token `on-surface` |
| Text selection fill | `#a3e635` (Tailwind `lime-400`) | `selection:bg-lime-400` |
| Text selection color | `#1e1b4b` (Tailwind `indigo-950`) | `selection:text-indigo-950` |

The canvas is **saturated sky blue** (`#38bdf8`), not the token `background` (`#fdf7ff`). The lavender tokens are for **surfaces and typography on components**, not the full-page fill.

---

## Neo-brutal glass (primary surfaces)

Defined in `<style>` as `.neo-brutal-glass`:

| Property | Value |
|----------|--------|
| Background | `rgba(255, 255, 255, 0.9)` |
| Backdrop | `blur(12px)` |
| Border | `2px solid #1e1b4b` |
| Corner radius | `24px` |

Hard elevation (`.neo-brutal-shadow`, `.hover-neo-brutal-shadow:hover`):

| Property | Value |
|----------|--------|
| Shadow | `4px 4px 0 0 #1e1b4b` (same RGB as `rgba(30, 27, 75, 1)`) |
| Hover | Same shadow + `translate(-2px, -2px)` + `transition: 0.2s ease` |

---

## Accent & UI hex (from markup, not the named token set)

| Use | Hex | Notes |
|-----|-----|--------|
| Highlight / “Daily Spark” chip | `#fef08a` | `bg-[#fef08a]`, text `#1e1b4b` |
| Coral / energy (icon, pill, hover cue) | `#f43f5e` | e.g. fire icon; audio pill `bg-[#f43f5e]` with `text-white` |
| Lime / primary CTA | `#a3e635` | hero button `bg-[#a3e635]`; caption pill; matches `lime-400` |
| Wordmark | `#4338ca` | Tailwind `text-indigo-700` (light) |
| Inactive nav label | `#4b5563` | Tailwind `text-gray-600` |
| Inactive nav (dark class) | `#9ca3af` | Tailwind `text-gray-400` |
| Nav hover accent | `#f97316` | Tailwind `hover:text-coral-500` |
| Top bar / bottom bar surface | `rgba(255,255,255,0.8)` or `0.9` | `bg-white/80`, `bg-white/90` |
| Bottom nav active fill | `#a3e635` / `#84cc16` | `bg-lime-400` / `dark:bg-lime-500` |
| Bottom nav active border | `#000000` | `border-black` |
| Card media overlay | `#1e1b4b` at 80% opacity | `from-indigo-950/80` |
| Quote block surface | `#eef2ff` | Tailwind `bg-indigo-50` |
| Quote text | `#312e81` | Tailwind `text-indigo-900` |

---

## Token palette (`tailwind.config` in `code.html`)

These keys are **semantic** (M3-style names). Values are hex; use them where the markup uses `text-on-surface-variant`, `primary`, etc.

`background` / `surface` → `#fdf7ff` — used as **token** for themed text utilities, **not** as the page background in the reference.

Full list is identical to the `theme.extend.colors` object in `code.html` (e.g. `on-surface` `#1d1b20`, `on-surface-variant` `#494551`, `primary` `#4f378a`, `error` `#ba1a1a`, …). Do not duplicate the entire map here; **copy from the script block** when syncing to app theme.

---

## Typography

| Role | Font | Size | Weight | Line height | Extra |
|------|------|------|--------|-------------|--------|
| display | Plus Jakarta Sans | `48px` | `800` | `1.1` | `letter-spacing: -0.02em` |
| h1 | Plus Jakarta Sans | `32px` | `800` | `1.2` | — |
| h2 | Plus Jakarta Sans | `24px` | `700` | `1.3` | — |
| body-lg | Plus Jakarta Sans | `18px` | `500` | `1.6` | — |
| body-md | Plus Jakarta Sans | `16px` | `500` | `1.6` | — |
| label-bold | Plus Jakarta Sans | `14px` | `700` | `1` | often `uppercase` + `tracking-wider` / `tracking-widest` |
| Wordmark | Plus Jakarta Sans | `24px` (`text-2xl`) | `900` (`font-black`) | — | `italic`, `tracking-tighter` |
| Nav tab label | Plus Jakarta Sans | `10px` | `800` (`extrabold`) | — | `uppercase`, `tracking-widest` |

**Icons:** Material Symbols Outlined (see `<link>` in `code.html`); filled variants via `font-variation-settings: 'FILL' 1`.

---

## Radius (Tailwind `theme.extend.borderRadius` in `code.html`)

| Token in config | Value |
|-----------------|--------|
| `DEFAULT` | `0.25rem` (`4px`) |
| `lg` | `0.5rem` (`8px`) |
| `xl` | `0.75rem` (`12px`) |
| `full` | `9999px` |

**Override:** `.neo-brutal-glass` uses **`24px`** corners regardless of the `xl` token. Inner blocks use `rounded-xl` → **`12px`** per this config.

**Shell:** Header notification control is `rounded-full`. Bottom nav bar is `rounded-t-3xl` (Tailwind `1.5rem` / `24px` top corners only).

---

## Spacing (`theme.extend.spacing` in `code.html`)

| Token | Value |
|-------|--------|
| `unit` | `8px` |
| `stack-gap` | `16px` |
| `grid-gutter` | `20px` |
| `container-padding` | `24px` |
| `section-margin` | `40px` |

Reference layout: `main` uses `max-w-4xl`, horizontal `px-6` (`24px`), vertical `space-y-10` between major sections; glass hero uses `p-8` (`32px`).

---

## Shell components (behavior + hex)

**Top app bar:** Fixed, `z-50`, `px-6` `py-4`, `bg-white/80`, `backdrop-blur-md`, bottom border `2px` `indigo-950` (`#1e1b4b`), hard shadow `4px 4px 0 #000000` (light mode). Avatar `40px`, `rounded-full`, border `2px` `#1e1b4b`.

**Bottom nav:** Fixed bottom, `md:hidden`, `bg-white/90`, `backdrop-blur-lg`, top border `2px` `#1e1b4b`, `rounded-t-3xl`. Active tab: `#a3e635` fill, `#1e1b4b` text, `2px` `#000000` border, hard shadow `2px 2px 0 #000000`, `rounded-xl` (`12px`). Inactive: gray text; hover `#f97316`.

---

## Brand voice (non-token)

Neo-brutal structure (2px strokes, hard offsets, no soft ambient shadows on hero cards) plus glass (frosted white panels, `12px` blur). High contrast accents on a **#38bdf8** field: **#fef08a**, **#f43f5e**, **#a3e635**, borders anchored on **#1e1b4b** / **#000000** as in the reference file.

---

## Reference IA labels (mock only)

Bottom nav copy in `code.html`: **Pulse**, **Cues**, **Trends**, **Profile**. Product routes may differ; visual system still applies.
