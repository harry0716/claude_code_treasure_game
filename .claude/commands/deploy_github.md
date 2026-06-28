將專案部署到 GitHub。依序執行每個步驟，完成後回報 Repository URL。

## 專案背景

這是一個 React + Vite 前端、Node.js/Express 後端的全端寶藏遊戲應用：
- **前端：** `src/` — React + TypeScript，Vite 打包輸出至 `./build/`
- **後端：** `server/` — Express + SQLite，運行於 port 3001
- **Vercel 部署適配：** `api/index.js`、`vercel.json`

需排除的目錄與檔案：`node_modules/`、`build/`、`server/game.db`

---

## Step 1 — 確認 / 安裝 GitHub CLI

```bash
gh --version
```

若指令不存在，安裝 GitHub CLI：
- **Windows：** `winget install GitHub.cli`
- 或至 https://cli.github.com 下載安裝

安裝後重新確認：
```bash
gh --version
```

---

## Step 2 — 建立 `.gitignore`

在專案根目錄建立 `.gitignore`，排除不應進版控的檔案：

```
node_modules/
build/
server/node_modules/
server/game.db
*.db
.env
.env.local
.DS_Store
Thumbs.db
```

---

## Step 3 — 初始化 Git Repository

```bash
git init
git add .
git status
```

確認暫存區內容正確（不應包含 `node_modules/`、`build/`、`*.db`）。

---

## Step 4 — 建立首次 Commit

```bash
git commit -m "Initial commit: Interactive Treasure Box Game"
```

---

## Step 5 — 登入 GitHub

確認登入狀態：
```bash
gh auth status
```

若未登入：
```bash
gh auth login
```
選擇 `GitHub.com` → `HTTPS` → 瀏覽器登入。

---

## Step 6 — 在 GitHub 建立 Repository 並推送

使用 GitHub CLI 一鍵建立 repo 並推送：

```bash
gh repo create claude_code_treasure_game --public --source=. --remote=origin --push
```

參數說明：
- `--public` — 公開 repo（改 `--private` 可設為私有）
- `--source=.` — 使用當前目錄
- `--remote=origin` — 設定遠端名稱為 origin
- `--push` — 建立後立即推送

---

## Step 7 — 確認並回報 URL

部署完成後執行以下指令取得 repo URL：

```bash
gh repo view --json url -q .url
```

將 URL 回報給使用者，格式如：
`https://github.com/<username>/claude_code_treasure_game`

---

## 後續更新推送

日後修改程式碼後，使用以下指令更新 GitHub：

```bash
git add .
git commit -m "描述本次修改"
git push
```
