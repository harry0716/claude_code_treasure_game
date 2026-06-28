# Claude Code 自訂指令說明

此資料夾存放專案的 Claude Code 自訂指令（Custom Commands）。  
在 Claude Code 對話框中輸入 `/指令名稱` 即可呼叫對應功能。

---

## 指令總覽

| 指令 | 檔案 | 用途 | 需要後端？ |
|------|------|------|-----------|
| `/deploy_vercel` | `deploy_vercel.md` | 部署到 Vercel（完整全端） | ✅ 是（Serverless） |
| `/deploy_github` | `deploy_github.md` | 初始化 Git 並推送到 GitHub | — 程式碼儲存 |
| `/deploy_github_page` | `deploy_github_page.md` | 部署到 GitHub Pages（純前端） | ❌ 否（localStorage） |

---

## 詳細說明

### `/deploy_vercel`

**用途：** 將完整的全端應用部署到 Vercel，前後端同一網域。

**觸發時機：**
- 第一次部署到 Vercel
- 程式碼有修改，需要更新線上版本
- 想讓使用者能在線上玩完整版（含帳號、歷史記錄）

**運作方式：**
```
前端 React  ──┐
              ├─▶ Vercel（同一網域）
後端 Express ──┘     /api/* → api/index.js（Serverless Function）
```

**資料儲存：** SQLite 寫入 `/tmp/game.db`（Vercel 短暫儲存，重啟後清除）

**相關檔案：**
- `api/index.js` — Express app 的 Serverless 入口
- `vercel.json` — 建置設定與 API 路由重寫規則
- `server/db.js` — 偵測 `VERCEL` 環境變數，自動切換 DB 路徑

**線上網址：** `https://claudecodetreasuregame-initial-sepia.vercel.app`

---

### `/deploy_github`

**用途：** 初始化 Git repository 並推送程式碼到 GitHub，作為程式碼版本控制。

**觸發時機：**
- 首次建立 GitHub repository
- 需要備份程式碼或與他人協作
- 搭配 Vercel 實現自動部署（push → Vercel 重新部署）

**運作方式：**
```
本機程式碼 ──git push──▶ GitHub repository
                              ↓（連結後自動觸發）
                           Vercel 重新部署
```

**注意事項：**
- GitHub 本身**無法執行**這個全端應用
- `.gitignore` 已排除 `node_modules/`、`build/`、`server/game.db`
- 需要 GitHub Personal Access Token（PAT）或 GitHub CLI 登入

**GitHub Repository：** `https://github.com/harry0716/claude_code_treasure_game`

---

### `/deploy_github_page`

**用途：** 將純前端版本部署到 GitHub Pages，完全不依賴任何後端或雲端服務。

**觸發時機：**
- 想要一個永久免費、無需後端的遊玩網址
- 實驗或展示用途
- 想讓別人玩但不想維護伺服器

**運作方式：**
```
App.tsx (VITE_GH_PAGES=true)
    ↓ 偵測環境變數
localStorage ←→ 帳號、密碼、遊戲記錄（全在瀏覽器）
    ↓
npm run build:gh  (vite build --mode gh-pages)
    ↓
npx gh-pages -d build  →  gh-pages 分支
    ↓
https://harry0716.github.io/claude_code_treasure_game/
```

**資料儲存：** 瀏覽器 `localStorage`（清除瀏覽器資料即消失，不同裝置無法共享）

**相關檔案：**
- `src/storage.ts` — localStorage 版的帳號/遊戲 CRUD 操作
- `.env.gh-pages` — 設定 `VITE_GH_PAGES=true`
- `vite.config.ts` — `gh-pages` mode 時 base 路徑設為 `/claude_code_treasure_game/`
- `package.json` — `build:gh` 和 `deploy:gh` script

**GitHub Pages 網址：** `https://harry0716.github.io/claude_code_treasure_game/`

---

## 三種部署方式比較

| 比較項目 | Vercel | GitHub Pages |
|---------|--------|--------------|
| 網址 | `*.vercel.app` | `harry0716.github.io/...` |
| 後端 | Express（Serverless） | 無（localStorage） |
| 帳號跨裝置 | ✅ | ❌ |
| 遊戲記錄永久保存 | ⚠️ 重啟清除 | ❌ 關分頁消失 |
| 費用 | 免費方案 | 完全免費 |
| 更新方式 | `vercel --prod` | `npm run deploy:gh` |

---

## 如何新增自訂指令

1. 在此資料夾（`.claude/commands/`）建立 `指令名稱.md`
2. 檔案第一行為指令說明（會顯示在 Claude Code 的指令選單）
3. 重新開啟 Claude Code 工作階段後即可使用 `/指令名稱`
