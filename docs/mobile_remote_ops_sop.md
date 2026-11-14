# 手機遠端開發與部署一頁式 SOP（LineBotGas）

更新日期：2026-11-14

適用情境：值班、通勤、臨時事故處理。
目標：在手機上安全完成「查看 -> 觸發 -> 驗證 -> 回滾」全流程。

## 0. 先決條件（未完成請勿用手機執行部署）

1. CI 已建好部署流程（測試 -> 打包 -> 部署）。
2. CI Secrets 已設定完成（含 CLASP 與部署相關憑證）。
3. 已有回滾機制（可重新部署上一個穩定版本）。
4. 帳號啟用 MFA，手機有螢幕鎖與生物辨識。

## 1. 手機可做與不可做

可做：

1. 看 PR 與 CI 結果。
2. 觸發部署（merge PR 或手動 dispatch workflow）。
3. 監看部署執行狀態與錯誤摘要。
4. 執行部署後 smoke test。
5. 必要時回滾。

不建議：

1. 大型重構或跨檔案複雜修正。
2. 首次 clasp 授權初始化。
3. Chrome 擴充功能完整互動測試。
4. 在手機上處理或貼上明文密鑰。

## 2. 標準操作流程（值班版）

### 步驟 A：部署前確認

1. 開啟本次 PR，確認變更範圍不含高風險核心模組（若有，建議改桌機操作）。
2. 確認 CI 測試已全綠（至少 test 與 bundle 成功）。
3. 確認沒有未處理的高嚴重度失敗告警。

### 步驟 B：觸發部署

1. 若採 PR 合併部署：合併 PR。
2. 若採手動部署：在 CI 頁面執行 workflow dispatch。
3. 記錄部署批次資訊：分支、commit SHA、觸發時間。

### 步驟 C：監看部署

1. 觀察 job 執行順序：test -> bundle -> deploy。
2. 任一步驟失敗：先截圖錯誤摘要並停止後續手動操作。
3. 若 deploy 成功，進入步驟 D。

### 步驟 D：Smoke Test（手機端）

於 LINE 群組或測試群發送以下指令，確認都有回覆且內容正確：

1. 幫助
2. 菜單
3. 我的訂單

若專案當下有排程資料，也可加測：

1. 本週菜單
2. 統計

### 步驟 E：回滾（若異常）

1. 立即停止新一輪部署。
2. 在 CI 觸發「回滾 workflow」或重部署前一個穩定 tag/commit。
3. 回滾後再執行一次步驟 D。
4. 在事件紀錄補上：異常時間、影響範圍、回滾版本。

## 3. 失敗情境速查

1. 測試失敗（test failed）
- 行動：不部署，建立修復 PR，改桌機處理。

2. 部署失敗（deploy failed）
- 行動：檢查 CI Secret 與 clasp 授權是否過期；若無法快速排除，回滾。

3. 部署成功但 LINE 無回應
- 行動：先做回滾，再檢查 Webhook 與 Script Properties。

4. 僅部分指令異常
- 行動：先公告降級，建立 hotfix 分支，桌機修復後再走一次 SOP。

## 4. 安全守則（手機專用）

1. 不在任何聊天室貼出 Token、Secret 或部署憑證。
2. 不截圖包含敏感資訊的 Secrets 頁面。
3. 使用受信任網路；避免公用 Wi-Fi 進行部署操作。
4. 手機遺失時立即撤銷相關登入與 CI Token。

## 5. 值班通報模板

標題：LineBotGas 手機值班部署紀錄

1. 觸發人員：
2. 觸發時間：
3. 分支與 commit：
4. 部署結果：成功 / 失敗
5. Smoke test：通過 / 未通過
6. 是否回滾：否 / 是（回滾到：）
7. 後續處理：

## 6. 建議搭配文件

1. 遠端可行性總覽：[docs/remote_workspace_assessment.md](docs/remote_workspace_assessment.md)
2. 部署說明：[docs/deployment_guide.md](docs/deployment_guide.md)
3. 本地測試說明：[docs/local_testing.md](docs/local_testing.md)
4. CI 範本文件：[docs/ci_workflow_template.md](docs/ci_workflow_template.md)
5. Codespaces 快速啟動：[docs/codespaces_mobile_browser_quickstart.md](docs/codespaces_mobile_browser_quickstart.md)
