# 遠端 Workspace 開發可行性評估（LineBotGas）

更新日期：2026-11-14

## 一、結論

本專案適合採用「遠端 Workspace 開發 + 受控部署」模式。

- 遠端 Workspace 進行日常開發、測試、打包：**可行性高**。
- 直接在遠端 Workspace 做 GAS 發布：**可行**，但需先完成 `clasp` 授權與憑證管理。
- 完全不依賴本機：**部分受限**，Chrome 擴充功能實測與部分後台操作仍偏向本機執行。

可行性評分（主觀評估）：

1. 遠端開發與測試：9/10
2. 遠端自動部署：8/10（取決於 CI Secrets 設定完整度）
3. 完全零本機依賴：6/10

## 二、判斷依據

### 1) 為何適合遠端開發

- 專案核心工作流是 Node.js 指令（`npm test`、`npm run bundle`），沒有本機 GUI 強耦合。
- 測試檔可在 Node 環境執行，且已有 mock 設計，不依賴即時 LINE/GAS 網路事件。
- 打包流程是純檔案合併產生 `dist/Code.gs`，可穩定在遠端環境執行。

### 2) 主要限制

- 部署流程依賴 `clasp`（`npx @google/clasp push/deploy`），首次需授權登入。
- `.clasp.json` 被忽略，不會跟著 repo 走；換遠端環境時要重新配置。
- LINE Webhook 與 Apps Script Script Properties 仍有手動後台設定步驟。
- Chrome 擴充功能屬瀏覽器情境測試，純遠端 headless 環境不一定能完整驗證。

## 三、建議的遠端開發架構

建議採三層：

1. **開發層（Remote Workspace）**
   - 程式修改（`src/`）
   - 自動化測試（`npm test`）
   - 打包（`npm run bundle`）

2. **部署層（CI/CD）**
   - 由 CI 執行 `clasp push` + `clasp deploy`
   - 將 `CLASP` 相關憑證、Deployment ID 置於 CI Secrets

3. **平台設定層（手動）**
   - LINE Developers：Webhook URL、Use webhook
   - GAS Script Properties：`CHANNEL_ACCESS_TOKEN`、`CHANNEL_SECRET`

## 四、落地實施步驟（建議）

1. 固化遠端開發環境
   - 安裝 Node 版本（建議加上 `.nvmrc` 或文件固定版本）
   - 驗證 `npm test`、`npm run bundle` 可在遠端穩定運行

2. 導入 CI 部署
   - 新增部署 workflow（例如 GitHub Actions）
   - 將 `CLASP` 授權資料、`CLASP_DEPLOYMENT_ID` 放入 Secrets
   - 部署前先跑測試與打包

3. 明確分工手動步驟
   - 僅保留不可自動化項目（LINE/GAS 後台設定）
   - 將操作步驟寫入 `docs/deployment_guide.md` 補充章節

4. 補齊風險控管
   - 嚴禁把 Token 寫進 repo
   - 加上部署前檢查（測試失敗禁止部署）
   - 建立回滾流程（保留前一版 deployment）

## 五、風險與對策

1. `clasp` 授權失效
   - 對策：使用 CI 專用服務帳號或固定授權流程，並定期驗證。

2. 憑證洩漏風險
   - 對策：僅使用 Secret Manager/CI Secrets，避免出現在 commit 與日誌。

3. 雲端部署後行為差異
   - 對策：保留 smoke test（Webhook verify、基本指令回覆）作為部署後檢查。

4. 擴充功能流程難以遠端化
   - 對策：將 Chrome 擴充功能測試定義為「本機驗收項」，與主線部署流程分離。

## 六、推薦決策

可立即導入遠端 workspace 開發；部署建議同步 CI 化。短期可採「遠端開發 + 手動部署」，中期升級為「遠端開發 + CI 自動部署 + 最小手動後台設定」。

## 七、手機操作遠端開發與部署可行性

### 1) 可行性結論

- 手機可參與遠端開發與部署流程，但建議定位為「輕量操作」而非完整主力開發。
- 最佳做法是：手機負責審核、觸發、監看與回滾；複雜開發與驗證由桌機執行。

### 2) 建議手機負責的任務

1. 查看 CI 測試與部署結果（Pass/Fail、錯誤摘要）。
2. 進行小幅文字修正（文件、註解、設定說明）。
3. 透過 PR merge 或手動 dispatch 觸發部署。
4. 於緊急情況執行既有版本回滾。

### 3) 不建議手機負責的任務

1. 大量程式重構或跨檔案複雜修改。
2. 需要長時間終端互動的除錯流程。
3. Chrome 擴充功能的完整互動驗證。
4. 首次 `clasp` 授權與環境初始化（容易受瀏覽器與登入流程限制）。

### 4) 手機操作前置條件

1. CI 已完成部署自動化（測試 -> 打包 -> push/deploy）。
2. `CLASP` 相關授權、部署 ID 與 Token 已放入 CI Secrets。
3. 專案已定義回滾流程（可重新部署上一版）。
4. 已有簡短的部署後 smoke test 清單（至少含 Webhook 可用性與基本指令回覆）。

### 5) 推薦手機作業流程

1. 開啟 PR 檢查變更與 CI 狀態。
2. 確認測試全綠後合併 PR（或手動觸發部署 workflow）。
3. 監看部署 Job 完成狀態。
4. 執行 smoke test（例如：`幫助`、`菜單`、`我的訂單`）。
5. 若異常，執行回滾到上一個穩定版本。

### 6) 風險控管補充（手機情境）

1. 權限最小化：手機帳號只保留必要 repo/CI 權限。
2. 強制多因素驗證（MFA）與裝置鎖定。
3. 避免在手機本機保存任何明文密鑰。
4. 優先透過 CI 平台操作，不直接在手機終端輸入高風險部署指令。

### 7) 手機場景評分（本專案）

1. 手機觸發部署與監控：9/10
2. 手機進行小改並送 PR：7/10
3. 手機執行完整開發與除錯：4/10

補充：可直接參照手機值班流程文件 [docs/mobile_remote_ops_sop.md](docs/mobile_remote_ops_sop.md)。
