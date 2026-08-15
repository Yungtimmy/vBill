# VerseBill design system

Paste this into a new chat to reload taste.

VerseBill is editorial, fiduciary, and dark. Invoices that prove payment on-chain. No generic crypto neon. User writes the copy; the model lays it out.

## Tokens

| Slot | Value | Role |
| --- | --- | --- |
| bg | `#0F0F11` | Page |
| surface | `#1A1A1E` | Cards, inputs |
| surface-border | `#2A2A2F` | Dividers |
| text-1 | `#EEEEEF` | Headlines |
| text-2 | `#A0A0AB` | Body |
| text-3 | `#6C6C74` | Eyebrows |
| accent-primary | `#C9A227` | CTA hover, 2–3× max |
| accent-secondary | `#6F8F72` | Verified moment |
| danger | `#C45C5C` | Failures |

Fonts: Syne 800 headlines, Space Grotesk 400 body, JetBrains Mono uppercase eyebrows `tracking-[0.2em]`.

Section: `py-28 px-6 border-t border-[#2A2A2F]` with `max-w-6xl mx-auto`.

## Laws

- Buttons shrink (`hover:scale-95`), never grow. Hover flips to brass.
- No gradient text. No image overlays. No emoji. No exclamation marks.
- No pure black or white.
- No three-column feature grids.
- One idea per section.
- Stroke text: inline `WebkitTextStroke` only.
- Glow hover: `GlowWord` React component, not CSS classes.
- Network mode is always labeled Demo/Testnet or Production/Mainnet.

## Voice

Banned: seamless, robust, empower, unlock, supercharge, next-generation, cutting-edge, effortlessly, reimagine.

Promise: VerseBill does not ask anyone to blindly trust our database.

## Rejection extras

No scale-grow hovers. No hidden payment destinations. No fake explorer links.
