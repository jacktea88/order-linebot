# 短期遠端開發 + 手動部署清單

更新日期：2026-11-14

適用模式：短期先採遠端開發，發版時以手動方式更新 GAS（路線 A）。

## A. 發版前檢查

- [ ] 已在功能分支完成修改（src 目錄）
- [ ] 變更內容已自我檢查（避免誤改設定與秘密資訊）
- [ ] 本機或遠端工作區依賴已安裝
- [ ] 測試可執行
- [ ] 打包可執行

## B. 發版流程（路線 A）

- [ ] 1. 安裝依賴（首次無 lockfile 用 npm install；已有 lockfile 可用 npm ci）
- [ ] 2. 執行測試：npm test
- [ ] 3. 進行打包：npm run bundle
- [ ] 4. 開啟 dist/Code.gs 並全選複製
- [ ] 5. 到 GAS 編輯器貼上覆蓋 Code.gs
- [ ] 6. 更新既有 Web App 部署（不要新建 URL）
- [ ] 7. 在 LINE 進行 smoke test（幫助、菜單、我的訂單）

## C. 發版後檢查

- [ ] LINE 指令回覆正常
- [ ] 菜單與訂單查詢正常
- [ ] 無明顯錯誤訊息與異常延遲
- [ ] 記錄本次部署時間與提交版本

## D. 異常處理與回滾

- [ ] 發現異常先停止繼續部署
- [ ] 回到上一個穩定版本重新部署
- [ ] 回滾後再次執行 smoke test
- [ ] 補上異常紀錄（時間、影響、原因、處置）

## E. 安全守則

- [ ] 不把 Token 或 Secret 寫入 repo
- [ ] 不在聊天工具貼出敏感資訊截圖
- [ ] 只更新既有部署，避免 Webhook URL 漂移

## 參考文件

- 路線評估：docs/remote_workspace_assessment.md
- 手機值班 SOP：docs/mobile_remote_ops_sop.md
- Codespaces 快速啟動：docs/codespaces_mobile_browser_quickstart.md
- CI 範本：docs/ci_workflow_template.md
- 部署指南：docs/deployment_guide.md
- 本地測試：docs/local_testing.md
