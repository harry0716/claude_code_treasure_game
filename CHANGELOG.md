# Changelog

## [0.3.0] - 2026-06-28

### Added
- **GitHub Pages 部署模式**（純前端，不依賴後端）
  - `src/storage.ts`：localStorage 版帳號與遊戲記錄 CRUD
  - `.env.gh-pages`：`VITE_GH_PAGES=true` 環境設定
  - `package.json`：新增 `build:gh`、`deploy:gh` 指令
  - `.claude/commands/deploy_github_page.md`：GH Pages 部署自訂指令
- **文件補強**
  - `.claude/commands/README.md`：三個自訂指令的完整說明與比較表
  - `CLAUDE.md`：新增 Custom Commands、Deployment Modes 章節
  - `CHANGELOG.md`：本檔案，追蹤版本歷史

### Changed
- `src/App.tsx`：加入 `IS_GH_PAGES` 旗標，在 API 呼叫與 localStorage 之間切換
- `vite.config.ts`：`gh-pages` mode 時自動設定 `base: '/claude_code_treasure_game/'`

### Deployed
- GitHub Pages：`https://harry0716.github.io/claude_code_treasure_game/`

---

## [0.2.0] - 2026-06-28

### Added
- **Vercel 部署支援**
  - `api/index.js`：Express app 的 Vercel Serverless Function 入口
  - `vercel.json`：建置設定（`outputDirectory: build`）與 API 路由重寫
  - `server/db.js`：自動偵測 `VERCEL` 環境，切換 DB 路徑至 `/tmp/game.db`
  - `package.json`（根目錄）：加入 `express`、`cors`、`bcryptjs`、`jsonwebtoken` 依賴
  - `engines: { node: "22.x" }`：確保 Vercel 使用 Node.js 22（支援 `node:sqlite`）
- **GitHub 版本控制**
  - `.gitignore`：排除 `node_modules/`、`build/`、`server/game.db`、`*.db`
  - 建立 Git repository，推送到 GitHub
  - `.claude/commands/deploy_github.md`：GitHub 推送自訂指令
  - `.claude/commands/deploy_vercel.md`：Vercel 部署自訂指令

### Deployed
- Vercel：`https://claudecodetreasuregame-initial-sepia.vercel.app`
- GitHub：`https://github.com/harry0716/claude_code_treasure_game`

---

## [0.1.0] - 初始版本

### Added
- **前端**（`src/`）
  - React + TypeScript SPA，Vite 打包
  - 三個寶藏箱遊戲（點擊開箱，+$100 或 -$50）
  - 動畫效果（`motion/react`）、音效（開箱聲、邪惡笑聲）
  - 鑰匙游標（hover 寶箱時顯示 `key.png`）
  - Auth 頁（登入/註冊）、Game 頁、History 頁
  - shadcn/ui 元件庫（Radix UI + Tailwind CSS）、amber 主題

- **後端**（`server/`）
  - Node.js + Express，port 3001
  - Node.js 內建 SQLite（`node:sqlite`）
  - JWT 身份驗證（`jsonwebtoken` + `bcryptjs`）
  - API 路由：
    - `POST /api/auth/register` — 註冊
    - `POST /api/auth/login` — 登入
    - `POST /api/games` — 建立遊戲 session
    - `PUT /api/games/:id` — 結束 session（寫入分數與結果）
    - `POST /api/games/:id/logs` — 記錄每次點擊
    - `GET /api/games` — 取得歷史紀錄（最近 20 筆）
  - 資料庫 schema：`users`、`game_sessions`、`click_logs`
