# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Frontend
npm install          # Install frontend dependencies
npm run dev          # Start Vite dev server at http://localhost:3000

# Backend (run in a separate terminal)
cd server && npm install   # Install backend dependencies
npm run dev:server         # Start Express API server at http://localhost:3001

# Build
npm run build        # Build frontend to ./build/
```

No test runner is configured in this project.

## Architecture

Full-stack app: a React + TypeScript SPA (Vite) on the frontend, and a Node.js/Express API server on the backend.

**Frontend** (`src/App.tsx`) — all game logic and UI in a single component, no routing library. Three views are rendered conditionally via a `view` state variable:
- `auth` — login/register form (JWT stored in `localStorage`)
- `game` — main gameplay (3 treasure chests, click to reveal)
- `history` — past game sessions table

**Key state in `App.tsx`:**
- `boxes: Box[]` — `{ id, isOpen, hasTreasure }`; treasure position randomized client-side on each `initializeGame()`
- `score: number` — updated on each click (+100 for treasure, -50 for skeleton)
- `gameEnded: boolean` — set when treasure is found or all boxes opened
- `sessionId: number | null` — backend session ID; API calls fire-and-forget (errors silently swallowed)
- `token: string | null` — JWT from `localStorage`; included as `Authorization: Bearer` header on all game API calls

**Backend** (`server/`) — Express app on port 3001, CommonJS modules:
- `server/index.js` — entry point, mounts routes under `/api/auth` and `/api/games`
- `server/db.js` — initializes SQLite (Node.js built-in `node:sqlite`) at `server/game.db`
- `server/middleware/auth.js` — `requireAuth` middleware (JWT verify); exports `JWT_SECRET`
- `server/routes/auth.js` — `POST /api/auth/register`, `POST /api/auth/login` (bcryptjs + jsonwebtoken)
- `server/routes/games.js` — all routes require auth: `POST /api/games` (create session), `PUT /api/games/:id` (end session with score/result), `POST /api/games/:id/logs` (log each click), `GET /api/games` (history, last 20)

**Database schema (SQLite):**
- `users` — `id, username (UNIQUE), password_hash, created_at`
- `game_sessions` — `id, user_id, started_at, ended_at, final_score, result`
- `click_logs` — `id, session_id, clicked_at, box_id, has_treasure, score_change, score_after`

**Vite dev proxy:** all `/api/*` requests from the frontend are proxied to `http://localhost:3001` (configured in `vite.config.ts`). Both servers must run simultaneously in development.

**Component layout:**
- `src/App.tsx` — entire game UI and logic
- `src/components/ui/` — shadcn/ui component library (Radix UI + Tailwind). Do not modify these unless changing the design system.
- `src/components/figma/ImageWithFallback.tsx` — image with error fallback
- `src/assets/` — treasure chest PNGs (`treasure_closed.png`, `treasure_opened.png`, `treasure_opened_skeleton.png`, `key.png`)
- `src/audios/` — sound effect MP3s (`chest_open.mp3`, `chest_open_with_evil_laugh.mp3`)

**Path alias:** `@` resolves to `./src` (configured in `vite.config.ts`).

**Styling:** Tailwind CSS with amber-themed palette. Animations use `motion/react` (successor to Framer Motion).

**Build output:** `./build/` (not the default `dist/`).

## Adding Features

When adding sound effects, import the MP3 as a module and use `new Audio(src).play()`. When adding new UI components, prefer the existing shadcn/ui components in `src/components/ui/` before creating custom ones. When adding new API endpoints, add them to the appropriate route file in `server/routes/` and mount them in `server/index.js`.
