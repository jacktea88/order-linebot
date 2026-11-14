# Codespaces 手機/瀏覽器快速啟動（5 分鐘版）

更新日期：2026-11-14

目標：用手機或瀏覽器啟動遠端開發，並可完成本專案短期流程（測試、打包、手動部署）。

## 一、前置條件

1. 你有 GitHub 帳號，且此 repo 已在 GitHub。
2. 你可存取 GitHub Codespaces（Free/Pro/Team 皆可）。
3. 手機瀏覽器可切換桌面版網站。

## 二、瀏覽器啟動流程（桌機/平板）

1. 開啟 GitHub repo 頁面。
2. 點選 Code -> Codespaces -> Create codespace on main。
3. 等待環境建立完成，進入 VS Code Web。
4. 開啟終端機（Terminal -> New Terminal）。
5. 執行以下指令：

```bash
npm ci
npm test
npm run bundle
```

6. 確認 `npm run bundle` 成功，會更新 `dist/Code.gs`。
7. 開啟 `dist/Code.gs`，全選複製後貼到 GAS 編輯器進行手動部署。

## 三、手機啟動流程（iOS/Android）

1. 用手機瀏覽器開 GitHub repo。
2. 進入 Codespaces 頁籤，啟動既有 codespace 或新建。
3. 切換「桌面版網站」（重要，避免 UI 功能缺失）。
4. 進入 VS Code Web 後，先開終端機。
5. 執行：

```bash
npm ci
npm test
npm run bundle
```

6. 若只做值班/發版，完成到這裡即可；部署改走手動貼上 GAS。

## 四、首次常用設定（建議一次完成）

1. VS Code 佈景與字體調大（手機更易讀）。
2. 啟用自動儲存（Auto Save）。
3. Terminal 字體放大、行距拉開。
4. 在 repo 根目錄確認有 `package-lock.json`（便於 `npm ci`）。

## 五、故障排查（最常見）

1. `npm ci` 失敗且提示 lockfile
- 原因：沒有 `package-lock.json`。
- 解法：先跑 `npm install` 產生 lockfile，再改回 `npm ci`。

2. `npm` 指令找不到
- 解法：重開 terminal session；在 Codespaces 通常會自帶 Node/npm。

3. 手機畫面操作卡住
- 解法：切換桌面版、橫向模式、關閉瀏覽器省電模式。

4. 測試過但部署後無回應
- 解法：先回滾上一版，再檢查 LINE Webhook 與 GAS Script Properties。

## 六、推薦手機操作邊界

適合：

1. 看 CI/測試結果。
2. 小幅文件與設定調整。
3. 觸發部署與回滾。

不適合：

1. 大量重構。
2. 跨多檔複雜除錯。
3. Chrome 擴充功能互動測試。

## 七、你這個專案的最短操作順序

1. 開 Codespace。
2. `npm ci`。
3. `npm test`。
4. `npm run bundle`。
5. 複製 `dist/Code.gs` 到 GAS。
6. 更新既有 Web App 部署。
7. LINE smoke test：幫助、菜單、我的訂單。

## 八、搭配文件

1. 手機值班 SOP：docs/mobile_remote_ops_sop.md
2. 短期手動部署清單：docs/short_term_manual_deploy_checklist.md
3. 遠端可行性評估：docs/remote_workspace_assessment.md
4. CI 範本：docs/ci_workflow_template.md
