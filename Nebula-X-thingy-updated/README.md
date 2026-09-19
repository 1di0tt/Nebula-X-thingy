# 🌌 Nebula Transit (Standalone / Live Server Edition)

An interactive, server-free Singapore public transit navigation and journey planning web application built with **React** and **Leaflet**.

Designed as a mobile-first transit companion, Nebula Transit features multi-modal route calculations (MRT, Bus, and Walking), an interactive MRT system map, geocoding search, and a device simulator UI.

---

## 🚀 Overview

Nebula Transit Live Server Edition is a pre-bundled, standalone distribution designed to run immediately in any static web server (such as VS Code Live Server, Python HTTP server, or GitHub Pages) without needing `npm install`, build tools, backend servers, or API keys.

All navigation logic, transit calculations, and Singapore MRT/bus station datasets execute client-side via a built-in mock request engine, allowing fast offline-capable transit estimation.

---

## ✨ Features

- **🗺️ Interactive Singapore Map:**
  - Powered by Leaflet and OpenStreetMap tiles.
  - Interactive pin dropping, coordinate display, and camera-follow modes.
  - Dark mode aesthetic optimized for mobile screens.

- **🚇 MRT Network & Routing:**
  - Bundled network covering Singapore's 6 main lines:
    - **NSL** (North South Line)
    - **EWL** (East West Line)
    - **NEL** (North East Line)
    - **CCL** (Circle Line)
    - **DTL** (Downtown Line)
    - **TEL** (Thomson-East Coast Line) & Changi Airport branch.
  - Station transfer calculations, line diagrams, and station status overviews.

- **🚌 Multi-Modal & Bus Route Planning:**
  - Route options: **Fastest Estimate**, **Less Walking**, or **Fewer Transfers**.
  - Turn-by-turn journey breakdown with estimated travel times, boarding stations, and walking transfers.
  - Bus stop lookups and cached schedule queries.

- **📍 Flexible Location Selection:**
  - **GPS Geolocation:** One-tap HTML5 device location pinpointing.
  - **Map Pin Selection:** Tap anywhere on the map to set origin or destination coordinates.
  - **Place Autocomplete & Search:** Local landmark suggestions with OpenStreetMap (Nominatim) fallback.
  - **Quick Chips:** Instant access to popular Singapore transit hubs and landmarks.

- **📱 Mobile Frame Simulator & Responsive UI:**
  - Mobile container frame preview with collapsible bottom sheet.
  - Minimize/maximize journey card to view the map without clutter.
  - "Hide GUI" toggle for distraction-free full-map navigation.

- **🧰 Transport Tools Modal:**
  - **Saved Journeys:** Quickly bookmark and re-route frequent trips.
  - **MRT Network Map:** Visual network overview.
  - **Transport Alerts & Disruptions:** Simulated disruption notices and alternate bridging bus advice.
  - **Accessibility & Settings:** Custom settings stored locally in `localStorage` (`nebula-settings`).

---

## 📂 Project Structure

```text
Nebula-X-thingy/
├── index.html                  # HTML entry point
├── main.ea36e950.js            # Bundled React application & transit logic
├── main.1a38d3ab.css           # Compiled styling & dark theme simulator layout
├── asset-manifest.json         # Build asset manifest
├── main.ea36e950.js.LICENSE.txt# 3rd-party license notices (React, Leaflet, etc.)
├── START-HERE.txt              # Quick instructions from distribution build
└── README.md                   # Project documentation
```

> [!TIP]
> **Ready to Run Out-of-the-Box:**  
> The asset paths in [index.html](file:///C:/Users/fangm/.gemini/antigravity/scratch/nebula-x-thingy/Nebula-X-thingy/index.html) and `asset-manifest.json` are configured to load `./main.ea36e950.js` and `./main.1a38d3ab.css` directly from the project root. No directory moving or file renaming is required.

---

## ⚡ Quick Start

No Node.js or build steps required. Serve the folder using any HTTP server:

### Option 1: VS Code Live Server (Recommended)
1. Open the project folder in **Visual Studio Code**.
2. Install the **Live Server** extension (by Ritwick Dey).
3. Right-click [`index.html`](file:///C:/Users/fangm/.gemini/antigravity/scratch/nebula-x-thingy/Nebula-X-thingy/index.html) and select **Open with Live Server**.

### Option 2: Python 3
Run the following in PowerShell / terminal inside the project directory:
```powershell
python -m http.server 3000
```
Open your browser at `http://localhost:3000`.

### Option 3: Node.js `npx serve`
```bash
npx serve .
```

---

## ⚙️ Technical Architecture

- **Frontend Core:** React 18 (Production bundle)
- **Mapping:** Leaflet (`1.9.3`) + OpenStreetMap tile layers
- **Styling:** Custom CSS with Inter font, glassmorphic dark-slate theme (`#090d16`), device frame simulator
- **Client-Side Interceptor (`localRequest`):**  
  Intercepts standard REST endpoints client-side without needing an Express server:
  - `/api/places` — Autocompletes Singapore locations
  - `/api/geocode` — Resolves addresses via Nominatim
  - `/api/mrt-network` — Provides MRT station topology and line colors
  - `/api/mrt-route` — Calculates rail connections and transfers
  - `/api/transit-route` — Multi-modal transit pathfinder
  - `/api/bus-route` & `/api/bus-arrival` — Bundled bus timetable and stop estimates
  - `/api/health` — Returns status OK
- **Persistence:** Browser `localStorage` (`nebula-journeys`, `nebula-settings`)

---

## 🔒 Limitations & Notes

- **Live Data Feeds:** Real-time LTA DataMall arrivals, live traffic cameras, taxi availability, and dynamic disruptions require authenticated API keys and an external backend proxy. This standalone build uses bundled static/cached schedules.
- **GPS Permissions:** Browsers restrict HTML5 Geolocation to **secure origins** (`https://`) or `localhost`. When testing over a local network (LAN IP) on a mobile device, GPS may be restricted by the browser; use the map pin or text search instead.
- **Internet Requirement:** Active internet connection is required to load map tiles and external address searches via Nominatim OpenStreetMap.

---

## 📄 License

This distribution contains third-party open source libraries (React, Leaflet, regenerator-runtime). Refer to [`main.ea36e950.js.LICENSE.txt`](file:///C:/Users/fangm/.gemini/antigravity/scratch/nebula-x-thingy/Nebula-X-thingy/main.ea36e950.js.LICENSE.txt) for license terms.