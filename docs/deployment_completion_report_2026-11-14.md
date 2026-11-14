# 上線完成報告（短期遠端開發 + 手動部署）

日期：2026-11-14
專案：LineBotGas
分支：special-order

## 一、執行摘要

本次已完成以下目標：

1. 建立並驗證 GitHub Actions 自動部署流程（Deploy to GAS）。
2. 建立並驗證回滾流程（Rollback GAS）。
3. 完成一次不影響線上的回滾演練（同版回滾）。
4. 完成 Secrets 補齊與 workflow 穩定性修正。

## 二、關鍵成果

1. Deploy workflow 可成功執行。
2. Rollback workflow 可成功執行。
3. LINE smoke test（幫助、菜單、我的訂單）可正常回覆。
4. 本機工作區檔案未誤提交（LineBotGas.code-workspace 仍維持本機變更）。

## 三、主要變更紀錄

本次重要提交（special-order）：

1. 71bf47c
- 訊息：fix(ci): harden clasp auth and secret validation
- 內容：加強 Secrets 驗證與 clasp 認證流程穩定性。

2. f7e95bd
- 訊息：fix(ci): robust rollback checkout with full history
- 內容：回滾流程改為先完整抓歷史，再檢查/切換 target commit，降低 git checkout 失敗機率。

## 四、Secrets 與部署設定

已確認/使用的關鍵設定：

1. CLASPRC_JSON
2. CLASP_SCRIPT_ID
3. CLASP_DEPLOYMENT_ID

Apps Script 設定資訊：

1. scriptId：1xL_OwpsStQlaz2LeaTWff12CRPvBXmUknFxSaYH1iJD9ZlB7VnTZ2Re9
2. rootDir：dist
3. deploymentId（非 HEAD）：AKfycbzS5qllaxVkRmU6TFgsNn1f_bwxV7EZTmAao9H9GEHKMt_fdsSw3YMHLnVgYC2zfyCc

## 五、流程驗證結果

Deploy 驗證：成功

1. Install dependencies：Pass
2. Run tests：Pass
3. Bundle：Pass
4. Push to Apps Script：Pass
5. Deploy to existing deployment：Pass

Rollback 演練：成功

1. 可指定 target SHA 執行
2. 部署完成後服務維持正常
3. smoke test 通過

## 六、風險與後續

目前風險：

1. 若 Secrets 被移除或過期，部署會失敗。
2. 若輸入不存在的 target SHA，回滾會失敗（目前已有較清楚錯誤訊息）。

建議後續動作：

1. 將 special-order 的 workflow 修正合回預設分支（master）。
2. 將本報告與 run 連結補入團隊值班文件。
3. 每月至少做一次 rollback 演練。

## 七、交接備忘

日常建議操作順序：

1. 開發分支修改
2. 跑測試與打包
3. 執行 Deploy workflow
4. 做 LINE smoke test
5. 異常時優先執行 Rollback workflow 回穩

參考文件：

1. docs/short_term_manual_deploy_checklist.md
2. docs/mobile_remote_ops_sop.md
3. docs/ci_workflow_template.md
4. docs/codespaces_mobile_browser_quickstart.md
5. docs/remote_workspace_assessment.md
