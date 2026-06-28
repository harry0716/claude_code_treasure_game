將遊戲部署到 GitHub Pages（純前端、localStorage 版本，完全不依賴 Vercel 或任何後端）。依序執行每個步驟，完成後回報網址。

## 架構說明

GitHub Pages 為靜態主機，無法執行 Node.js/Express。此版本使用 `localStorage` 取代後端：
- **帳號/密碼** → 存在 `localStorage`（`ghp_users`）
- **遊戲記錄** → 存在 `localStorage`（`ghp_sessions`）
- **無需伺服器**，完全在瀏覽器端運作

切換邏輯由 `VITE_GH_PAGES=true` 環境變數控制（定義在 `.env.gh-pages`），
`src/storage.ts` 實作所有 localStorage 操作。

**最終網址格式：**
`https://harry0716.github.io/claude_code_treasure_game/`

---

## Step 1 — 確認 Git 狀態

```bash
git status
git log --oneline -3
```

確保所有程式碼已 commit（特別是 `src/storage.ts`、修改後的 `App.tsx`、`vite.config.ts`）。

---

## Step 2 — 建置 GitHub Pages 版本

```bash
npm run build:gh
```

此指令執行 `vite build --mode gh-pages`，會：
- 讀取 `.env.gh-pages`（`VITE_GH_PAGES=true`）
- 將 `base` 設為 `/claude_code_treasure_game/`
- 輸出到 `./build/`

確認輸出無錯誤。

---

## Step 3 — 推送靜態檔案到 gh-pages 分支

```bash
npx gh-pages -d build --dotfiles
```

此指令自動將 `build/` 資料夾推送到 GitHub 的 `gh-pages` 分支。

---

## Step 4 — 啟用 GitHub Pages（首次部署時需手動設定）

1. 前往 `https://github.com/harry0716/claude_code_treasure_game/settings/pages`
2. **Source** 選擇 `Deploy from a branch`
3. **Branch** 選擇 `gh-pages`，資料夾選 `/ (root)`
4. 點擊 **Save**

---

## Step 5 — 更新主分支的程式碼變更

每次修改程式碼後，需同步更新 GitHub 主分支：

```bash
git add .
git commit -m "描述修改內容"
git push origin main
```

然後重新部署到 GitHub Pages：

```bash
npm run deploy:gh
```

（`deploy:gh` = `build:gh` + `gh-pages -d build`）

---

## Step 6 — 回報網址

部署完成後，網址為：
`https://harry0716.github.io/claude_code_treasure_game/`

GitHub Pages 首次啟用後約需 1-2 分鐘才能生效。

---

## 注意事項

- **資料僅存在瀏覽器**：清除瀏覽器資料會遺失帳號與記錄，這是 localStorage 的固有限制
- **不同裝置無法共享帳號**：每台電腦的 localStorage 是獨立的
- **Vercel 版本不受影響**：兩個版本獨立運作，`npm run build` 仍是 Vercel 版本
