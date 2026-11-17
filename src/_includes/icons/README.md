# Icons

Inlined at build time by the `icon` shortcode in `.eleventy.js`
(`{% icon "github" %}` or `{% icon "github", "GitHub" %}` for a labelled icon).
No icon font or runtime requests.

Sources (pinned to the versions used in `design/prototype`):

- Lucide `lucide-static@0.460.0` — ISC license — everything except `x.svg`.
  Lucide's own `x` icon is saved as `close.svg` so it doesn't clash with the X logo.
  (Lucide 1.x dropped brand icons, hence the pin.)
- Simple Icons `simple-icons@13.21.0` — CC0 — `x.svg`.

To add one, drop the SVG in this folder; the file name is the icon name.
