Deploy this project to Vercel. Follow each step in order and report the final deployment URL when done.

## Context

This is a full-stack project:
- **Frontend:** React + Vite, builds to `./build/`
- **Backend:** Express.js server in `server/`, uses Node.js built-in SQLite (`node:sqlite`)

**SQLite limitation on Vercel:** Vercel Serverless Functions run in an ephemeral environment — the `server/game.db` file does NOT persist between requests. Login and game history will work within a single cold-start but data will reset. If the user needs persistent data, recommend migrating to Vercel Postgres or Turso. For now, proceed with the current SQLite setup.

## Step 1 — Check / Install Vercel CLI

```bash
vercel --version
```

If the command fails, install it:

```bash
npm install -g vercel
```

## Step 2 — Create `api/index.js` (Express adapter for Vercel)

Create `api/index.js` that exports the Express app as a Vercel Serverless Function:

```js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('../server/routes/auth'));
app.use('/api/games', require('../server/routes/games'));

module.exports = app;
```

Also update `server/db.js` so the database path works in both local and serverless environments — use `path.join(process.cwd(), 'server', 'game.db')` if `__dirname` is unavailable.

## Step 3 — Create `vercel.json`

Create `vercel.json` in the project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/index.js" }
  ]
}
```

## Step 4 — Ensure `api/` dependencies are available

Vercel installs root `package.json` dependencies automatically. The server deps (`express`, `bcryptjs`, `jsonwebtoken`, `cors`) must be in the **root** `package.json` (not only in `server/package.json`). Check and add any missing ones:

```bash
npm install express cors bcryptjs jsonwebtoken
```

## Step 5 — Login to Vercel

```bash
vercel login
```

Follow the interactive prompt to authenticate.

## Step 6 — Deploy

From the project root, run:

```bash
vercel --prod
```

Answer the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Select your account
- **Link to existing project?** → No (first time)
- **Project name?** → Accept default or type a name
- **In which directory is your code located?** → `./` (current directory)
- Override build/output settings? → No (vercel.json handles it)

## Step 7 — Report the URL

After deployment completes, Vercel will print a production URL like:
`https://your-project-name.vercel.app`

Copy and report this URL to the user.
