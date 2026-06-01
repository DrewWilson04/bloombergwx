# StormChaser

A Bloomberg-terminal-style severe-weather and storm-chasing dashboard. Live
NEXRAD radar, NWS warnings, SPC outlooks, and a real severe-weather parameter
engine (CAPE, shear, SRH, STP, SCP, EHI, Bunkers storm motion, and the
Esterheld–Giuliano critical angle) — all from free, no-key data sources.

Runs in the browser (React + Vite) and ships as a native macOS app (Tauri).

## Features

- **Radar fields (pick one):**
  - Composite Reflectivity — animated loop (RainViewer)
  - Base Reflectivity — national mosaic (Iowa Environmental Mesonet, NEXRAD N0Q)
  - Base Velocity / Storm-Relative Velocity / Echo Tops — nearest-radar
    single-site products (IEM RIDGE), auto-selected from 160 WSR-88D sites
- **Overlays:** NWS warning polygons, isolated tornado & severe/hail warnings,
  SPC Day 1 categorical outlook, projected Bunkers storm-motion vectors
- **Environmental analysis:** CAPE, CIN, LCL, 0–6 km bulk shear, 0–1/0–3 km SRH,
  STP, SCP, EHI, and the critical angle — for your location or any point you
  click on the map
- **HOME / CLICK source toggle:** point the surface readout, meteogram, Skew-T,
  and parameter panel at your location or at any clicked map point
- **Chase Mode:** focused console with nearest radar, storm motion, tornadic
  parameters, nearest active warning, and quick layer toggles
- **Skew-T / sounding** (University of Wyoming) and a 7-day meteogram

## Data sources (all free, no API key)

| Data | Provider |
|------|----------|
| Surface + forecast + instability indices + pressure-level winds | [Open-Meteo](https://open-meteo.com) |
| Animated composite reflectivity | [RainViewer](https://www.rainviewer.com) |
| Base reflectivity / velocity / echo tops | [Iowa Environmental Mesonet](https://mesonet.agron.iastate.edu) |
| Active warnings | [NWS API](https://www.weather.gov/documentation/services-web-api) |
| Day 1 convective outlook | [NOAA/SPC](https://www.spc.noaa.gov) |
| Skew-T soundings | [University of Wyoming](https://weather.uwyo.edu) |

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

## Build for the web

```bash
npm run build        # static SPA -> dist/
npm run preview      # serve the production build locally
```

Deploy the `dist/` folder to any static host (Netlify, Vercel, Cloudflare
Pages, GitHub Pages, S3, etc.).

> **One caveat — the Skew-T proxy.** The University of Wyoming sounding endpoint
> has no CORS headers, so it is fetched through a dev proxy (`/uwyo`, see
> `vite.config.js`). That proxy only exists in `npm run dev`. In production you
> need an equivalent rewrite. Examples:
>
> **Netlify** — add `netlify.toml`:
> ```toml
> [[redirects]]
>   from = "/uwyo/*"
>   to = "https://weather.uwyo.edu/:splat"
>   status = 200
>   force = true
> ```
> **Vercel** — add `vercel.json`:
> ```json
> { "rewrites": [{ "source": "/uwyo/:path*", "destination": "https://weather.uwyo.edu/:path*" }] }
> ```
> Every other data source is CORS-enabled and works directly from the browser.

## Build the native desktop app (macOS)

Requires the [Rust toolchain](https://www.rust-lang.org/tools/install).

```bash
npm run tauri:build  # -> src-tauri/target/release/bundle/{macos,dmg}/
```

## Tech

React 19 · Vite · Leaflet · Recharts · Tailwind CSS · Tauri 2

## License

MIT — see [LICENSE](LICENSE).

Weather data belongs to the respective providers above; please review their
terms before high-volume or commercial use. This tool is for situational
awareness, not a substitute for official NWS warnings.
