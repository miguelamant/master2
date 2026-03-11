# CLAUDE.md

## Commands

- `npm run dev` — start frontend (port 3000) + backend (port 3007) concurrently
- `npm run client` — frontend only
- `npm run server` — backend only
- `npm run build` — production React build
- `npm test` — run tests

## Architecture

- **Frontend:** React 18 (Create React App), port 3000 in dev
- **Backend:** Node.js/Express, port 3007 in dev
- **Database:** Supabase (PostgreSQL) via `supabase-js` — no ORM
- **Auth:** `express-session` with secure cookies (not JWT)
- **State:** React Context (`OnboardingContext`) + local `useState` — no Redux
- **API:** Axios with `withCredentials`, base URL `http://localhost:3007` in dev, same-origin in prod
- **Production:** Express serves the React build statically

## Key Files

| File | Purpose |
|------|---------|
| `src/App.js` | All client-side routes |
| `src/apiService.js` | Axios client + menu helper functions |
| `src/Dashboard/Menu.js` | Main menu UI |
| `server/app.js` | Express app setup and middleware |
| `server/services/engine.js` | `FILTERS` definition + `applyFilters()` — custom filter/predicate engine |
| `server/routes/menu.routes.js` | Primary data API endpoints |
