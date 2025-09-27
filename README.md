## JoesBakery Frontend (React)

This repository now contains ONLY the React frontend. The backend / API (Express + Postgres + Supabase storage + mailing) has been migrated to a separate repository.

### Tech Stack
React (Create React App)
React Router
LocalForage (client-side persistence for "extra" products)
Framer Motion (animations)
Slugify (friendly product URLs)

---

## Quick Start

1. Install dependencies:
	npm install

2. (Optional) Create a `.env` file (see `.env.example`) if you need to point to a remote API:
	REACT_APP_API_BASE=https://your-backend-domain

3. Run the dev server:
	npm start

	This starts the CRA dev server at http://localhost:3000

4. Build for production:
	npm run build

5. Run tests:
	npm test

---

## Environment Variables

Set `REACT_APP_API_BASE` to the root URL of the backend API (no trailing slash). If omitted, the app will use relative paths (useful when the frontend and backend are deployed under the same origin or when mocking data).

Example `.env`:
REACT_APP_API_BASE=https://api.joesbakery.com

See `.env.example` for a template.

---

## API Calls
Centralized in `src/config.js`:
export const API_BASE = (process.env.REACT_APP_API_BASE || "").replace(/\/$/, "");

Components build URLs like:
fetch(`${API_BASE}/api/products`)

If `API_BASE` is blank, this becomes `/api/products` (relative).

---

## Product Data Sources
1. Static seed data (see `src/data/productData.js`).
2. Remote backend products (if API reachable).
3. Local "extras" stored in IndexedDB via LocalForage (browser-only, per device).

The Admin page merges these sources for display.

---

## Removing Backend-Specific Code
All server-side code (`server.js`, Express, Postgres, Multer, Nodemailer, Supabase service role) has been removed from this repo. Related dependencies were stripped from `package.json`.

If you accidentally reintroduce server-only libraries, remember they will inflate the client bundle or break builds.

---

## Deployment
Any static hosting provider (Vercel, Netlify, Render static, GitHub Pages) can serve the build output. Ensure your backend origin is set in `REACT_APP_API_BASE` (build-time) or hosted under the same domain with a reverse proxy mapping `/api/*`.

---

## Contributing / Next Steps
Potential improvements:
* Add skeleton loaders for product lists.
* Add error boundary / offline fallback.
* Integrate service worker for asset caching.
* Add end-to-end tests (e.g., Playwright) against deployed backend.

---

## Scripts (Summary)
start  – CRA dev server
build  – Production build to /build
test   – Jest / React Testing Library
eject  – Expose CRA config (irreversible)

---

## License
Internal / Proprietary (update this section as needed).
