# Custom HUD Font

The HUD uses one font family for the whole UI, resolved from `--hud-font` in
`web/src/fonts.css`.

## Using Anthropic Sans

Anthropic Sans is Anthropic's proprietary brand typeface. It is **not**
redistributable, so it is not shipped with this resource. If you hold a licence
for it, place the files in **this folder** with exactly these names:

```
fonts/AnthropicSans-Regular.woff2     (weight 400)
fonts/AnthropicSans-Medium.woff2      (weight 500)
fonts/AnthropicSans-SemiBold.woff2    (weight 600)
fonts/AnthropicSans-Bold.woff2        (weight 700)
```

Restart the resource. Nothing else to change - `Anthropic Sans` is already first
in the font stack, so it takes over the entire UI automatically. Any weight you
do not provide falls back to the next family.

If you only have `.ttf` / `.otf`, convert to `.woff2` first (much smaller and
faster to load in NUI).

## Current fallback

**Inter Variable** — SIL Open Font License 1.1, bundled locally via
`@fontsource-variable/inter`. No Google Fonts, no network requests: NUI has no
reliable internet access, which is why the previous `@import` of Orbitron and
Rajdhani never actually loaded and silently fell back to the default monospace.

## Using a different font entirely

Edit the one variable in `web/src/fonts.css`:

```css
:root {
  --hud-font: 'Your Font', 'Inter Variable', 'Segoe UI', system-ui, sans-serif;
}
```

then rebuild the UI:

```
cd web
npm install
npm run build
```

Other variables in the same file:

- `--hud-font-display` — speedometers / gauges (defaults to `--hud-font`)
- `--hud-font-mono` — JSON import box, hex colour input, coordinate readouts
  (kept monospace on purpose; those are unreadable in a proportional face)
