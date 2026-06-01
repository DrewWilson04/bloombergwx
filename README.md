# StormChaser

A Bloomberg-terminal-style severe-weather and storm-chasing dashboard. Live
NEXRAD radar, NWS warnings, SPC outlooks, and a real severe-weather parameter
engine (CAPE, shear, SRH, STP, SCP, EHI, Bunkers storm motion, and the
Esterheld–Giuliano critical angle) — all from **free, no-API-key data sources**.

Runs in the browser (React + Vite) and ships as a native macOS app (Tauri).

![dark terminal UI, JetBrains Mono, amber accents]

---

## Table of contents

- [Features](#features)
- [Data sources & APIs](#data-sources--apis)
- [How it works (architecture)](#how-it-works-architecture)
- [Project structure](#project-structure)
- [Quick start (local dev)](#quick-start-local-dev)
- [The Skew-T proxy — the one thing that needs setup](#the-skew-t-proxy--the-one-thing-that-needs-setup)
- [Building for the web](#building-for-the-web)
- [Deployment](#deployment)
  - [Netlify](#option-1--netlify-easiest)
  - [Vercel](#option-2--vercel)
  - [GitHub Pages + Cloudflare Worker](#option-3--github-pages--cloudflare-worker)
- [Native desktop app (macOS)](#native-desktop-app-macos)
- [The severe-weather engine](#the-severe-weather-engine)
- [Tech stack](#tech-stack)
- [License](#license)

---

## Features

- **Radar fields (pick one):**
  - **Composite Reflectivity** — animated national loop (RainViewer)
  - **Base Reflectivity** — national mosaic (Iowa Environmental Mesonet, NEXRAD N0Q)
  - **Base Velocity / Storm-Relative Velocity / Echo Tops** — nearest-radar
    single-site products (IEM RIDGE), auto-selected from 160 WSR-88D sites
- **Overlays:** NWS warning polygons, isolated tornado & severe/hail warnings,
  SPC Day 1 categorical outlook, projected Bunkers storm-motion vectors
- **Environmental analysis:** CAPE, CIN, LCL, lifted index, 0–6 km bulk shear,
  0–1 / 0–3 km SRH, STP, SCP, EHI, and the Esterheld–Giuliano critical angle —
  for your location or any point you click on the map
- **HOME / CLICK source toggle:** a sliding switch that points the surface
  readout, meteogram, Skew-T, and parameter panel at either your location or any
  clicked map point
- **Chase Mode:** focused console with nearest radar, storm motion, tornadic
  parameters, nearest active warning, and quick layer toggles
- **Skew-T / sounding** (University of Wyoming RAOB) and a 7-day meteogram

---

## Data sources & APIs

Everything is **free and key-less**. No accounts, no tokens, no billing.

| What | Provider | Endpoint |
|------|----------|----------|
| Surface obs, 7-day forecast, CAPE/CIN/LI, pressure-level winds | [Open-Meteo](https://open-meteo.com) | `https://api.open-meteo.com/v1/forecast` |
| Place search (typeahead) | Open-Meteo Geocoding | `https://geocoding-api.open-meteo.com/v1/search` |
| Reverse geocode (your coords → place name) | [BigDataCloud](https://www.bigdatacloud.com) | `https://api.bigdatacloud.net/data/reverse-geocode-client` |
| Animated composite reflectivity | [RainViewer](https://www.rainviewer.com) | `https://api.rainviewer.com/public/weather-maps.json` |
| National base reflectivity tiles (N0Q) | [Iowa Environmental Mesonet](https://mesonet.agron.iastate.edu) | `https://mesonet.agron.iastate.edu/cache/tile.py/.../nexrad-n0q-900913/{z}/{x}/{y}.png` |
| Single-site velocity / SRV / echo tops | Iowa Environmental Mesonet (RIDGE) | `https://mesonet.agron.iastate.edu/data/gis/images/4326/ridge/{SITE}/{CODE}_0.png` |
| Active warnings (polygons + list) | [NWS API](https://www.weather.gov/documentation/services-web-api) | `https://api.weather.gov/alerts/active?point=` |
| Day 1 convective outlook | [NOAA / SPC](https://www.spc.noaa.gov) | `https://www.spc.noaa.gov/products/outlook/day1otlk_cat.nolyr.geojson` |
| Skew-T soundings (RAOB) | [University of Wyoming](https://weather.uwyo.edu) | `https://weather.uwyo.edu/cgi-bin/sounding` *(needs a proxy — see below)* |

**IEM single-site product codes:** `N0U` = base velocity, `N0S` = storm-relative
velocity, `NET` = echo tops, `N0Q` = base reflectivity. Each is a 1000×1000 px
image covering an 11.115° box centered on the radar.

> **Correlation Coefficient (N0C)** and **Spectrum Width (N0W)** have **no free
> tile/image source** — they require decoding raw NEXRAD Level II data. They
> appear in the UI but are honestly marked unavailable rather than faked.

### Why only the Skew-T needs setup

Every source above is **CORS-enabled** and works directly from the browser —
*except* the University of Wyoming sounding endpoint, which sends no CORS headers.
A browser will refuse to read its response. So that one request is routed through
a proxy (a dev proxy locally, and a rewrite/Worker in production). Everything
else is a plain `fetch()`.

---

## How it works (architecture)

- **Polling:** `usePolling()` re-fetches each source on an interval (5 min for
  weather/radar/SPC, 1 min for warnings) and exposes `{data, error, loading}`.
- **Two tracked points:** `loc` (your HOME/searched location) and `inspect` (the
  last point you clicked on the map). A `follow` flag (`"home"` | `"click"`)
  decides which one feeds the surface bar, meteogram, Skew-T, and parameter panel.
- **Layers:** radar *fields* are mutually exclusive (radio-button behavior);
  *overlays* are independent checkboxes. State lives in `App.jsx` and is rendered
  by `RadarMap.jsx` with raw Leaflet.
- **Nearest radar:** as the map pans, the nearest of 160 WSR-88D sites is
  recomputed so single-site products (velocity / SRV / echo tops) follow the view.
- **Severe engine:** `lib/severe.js` turns Open-Meteo pressure-level winds +
  instability indices into Bunkers storm motion, SRH, shear, STP, SCP, EHI; the
  critical angle is computed in `services/api.js`.

---

## Project structure

```
src/
  App.jsx                  # top-level state: location, layers, follow mode, polling
  components/
    SurfaceBar.jsx         # current conditions + HOME/CLICK source toggle
    RadarMap.jsx           # Leaflet map: radar fields, overlays, motion vector
    Meteogram.jsx          # 7-day forecast chart (Recharts)
    SoundingPanel.jsx      # Skew-T renderer
    AlertTicker.jsx        # scrolling NWS warning ticker
    chrome/                # TopBar, LayerRail, Widget shell
    widgets/               # ChaseWidget, EnvAnalysisWidget
  lib/
    severe.js              # CAPE/shear/SRH/STP/SCP/EHI/Bunkers engine
    products.js            # radar field + overlay catalog
    params.js              # parameter display catalog (labels, color bands)
    radars.js              # 160 NEXRAD sites + nearestRadar()
    geo.js                 # haversine, bearing, destination point
    wind.js                # u/v vector helpers
    format.js              # color/format helpers
  services/
    api.js                 # all data fetchers + critical angle
    geocode.js             # place search + reverse geocode
    stations.js            # 66 RAOB sounding stations + nearestStation()
  hooks/usePolling.js      # interval-based fetch hook
worker/
  uwyo-proxy.js            # Cloudflare Worker that proxies the Wyoming sounding
src-tauri/                 # native macOS app shell (Tauri 2)
```

---

## Quick start (local dev)

Requires **Node 18+**.

```bash
npm install
npm run dev          # http://localhost:5173
```

In dev, the Skew-T just works — Vite's dev server proxies `/uwyo` to the
University of Wyoming for you (see `vite.config.js`). No extra setup.

---

## The Skew-T proxy — the one thing that needs setup

The University of Wyoming sounding endpoint has **no CORS headers**, so the
browser can't fetch it directly. The app therefore requests it from a relative
path, `/uwyo/cgi-bin/sounding?...`, and something forwards that to Wyoming:

- **Local dev:** Vite's dev-server proxy (`vite.config.js`) — automatic.
- **Production:** you provide the equivalent. The app reads an env var,
  `VITE_UWYO_PROXY`, at **build time**:
  - If **unset**, it falls back to `/uwyo` (works on hosts that support rewrites,
    e.g. Netlify/Vercel with the configs below).
  - If **set** to a full URL (e.g. a Cloudflare Worker), all sounding requests go
    there instead — this is what you need on static hosts like GitHub Pages.

Copy `.env.example` → `.env.production` and set the value before building if you
go the Worker route.

---

## Building for the web

```bash
npm run build        # static SPA -> dist/
npm run preview      # serve the production build locally
```

Deploy the `dist/` folder to any static host. Asset paths are **relative**
(`base: './'` in `vite.config.js`), so it works from a domain root *or* a
subpath (e.g. a GitHub Pages project site).

---

## Deployment

Pick one. All three serve the static build; they differ only in how they handle
the Skew-T proxy.

### Option 1 — Netlify (easiest)

`netlify.toml` (included) declares both the build and the proxy rewrite:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/uwyo/*"
  to = "https://weather.uwyo.edu/:splat"
  status = 200
  force = true
```

Import the repo at netlify.com → it auto-detects everything → deploy. Skew-T
works with **no env var** (the `/uwyo` fallback hits the rewrite).

### Option 2 — Vercel

`vercel.json` (included):

```json
{ "rewrites": [{ "source": "/uwyo/:path*", "destination": "https://weather.uwyo.edu/:path*" }] }
```

Import the repo at vercel.com → deploy. Skew-T works with no env var.

### Option 3 — GitHub Pages + Cloudflare Worker

GitHub Pages is purely static — it can't proxy — so the Skew-T needs an external
relay. A tiny Cloudflare Worker (free) does the job.

**A. Deploy the Worker** (`worker/uwyo-proxy.js`):

1. dash.cloudflare.com → **Workers & Pages → Create → Workers → "Hello World" → Deploy.**
   *(Do **not** connect a Git repo — this is a single file with no build step.)*
2. **Edit code**, replace everything with the contents of `worker/uwyo-proxy.js`,
   click **Deploy**.
3. Copy the Worker URL, e.g. `https://yourworker.you.workers.dev`.
4. Test it: open
   `https://yourworker.you.workers.dev/cgi-bin/sounding?region=naconf&TYPE=TEXT%3ALIST&YEAR=2026&MONTH=06&FROM=0100&TO=0100&STNM=72357`
   — you should see a plain-text sounding table.

**B. Build with the Worker URL baked in:**

```bash
VITE_UWYO_PROXY=https://yourworker.you.workers.dev npm run build
```

…or, if you use the included GitHub Actions workflow
(`.github/workflows/deploy.yml`), set a repo **Variable** named
`VITE_UWYO_PROXY` (Settings → Secrets and variables → Actions → Variables) and
the workflow injects it automatically.

**C. Publish to Pages.** Either:
- **Settings → Pages → Source → "GitHub Actions"** (uses the included workflow), **or**
- build locally and serve `dist/` from a branch (Settings → Pages → Deploy from a
  branch). A `.nojekyll` file in `dist/` keeps Pages from mangling the assets.

> ⚠️ **Common mistake:** GitHub Pages serves files *as-is* — it does **not** build
> your app. If you upload the **source** (whose `index.html` points at
> `/src/main.jsx`), you get a **blank page**, because browsers can't run raw JSX.
> Always publish the **built** `dist/` output, where `index.html` points at the
> compiled `./assets/index-*.js`.

---

## Native desktop app (macOS)

Requires the [Rust toolchain](https://www.rust-lang.org/tools/install).

```bash
npm run tauri:build  # -> src-tauri/target/release/bundle/{macos,dmg}/
```

---

## The severe-weather engine

`lib/severe.js` derives chase-relevant parameters from Open-Meteo's pressure-level
winds and instability indices:

- **Bunkers storm motion** — the right-moving supercell motion estimate, used as
  the reference frame for storm-relative quantities.
- **SRH (0–1 km, 0–3 km)** — storm-relative helicity; low-level streamwise
  vorticity available for rotation.
- **Bulk shear (0–6 km)** — supercell organization potential.
- **STP / SCP** — Significant Tornado Parameter and Supercell Composite Parameter
  (composite indices; ≥1 is notable).
- **EHI (0–1, 0–3 km)** — Energy-Helicity Index.
- **Critical angle** (Esterheld & Giuliano 2008) — angle between the surface
  storm-relative wind and the 0–500 m shear vector; ~90° (perpendicular) maximizes
  near-ground streamwise vorticity and favors tornadic supercells.

**Coverage note for soundings:** RAOB soundings are real twice-daily balloon
launches at fixed sites. The app snaps any clicked point to the nearest of **66
US + Alaska stations** (`services/stations.js`, region `naconf`). Inside the US
that's usually within a couple hundred km; clicking far outside North America will
snap to a distant station and isn't meaningful.

> This tool is for situational awareness and education — **not** a substitute for
> official NWS watches and warnings.

---

## Tech stack

React 19 · Vite · Leaflet · Recharts · Tailwind CSS · Tauri 2 · JetBrains Mono

---

## License

MIT — see [LICENSE](LICENSE).

Weather data belongs to the respective providers listed above; please review
their terms before high-volume or commercial use.
