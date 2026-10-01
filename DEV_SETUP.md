# 開發啟動說明

這個專案已經完成 clone，且本地測試與打包都可直接執行。

## 常用指令

- `npm test`：執行測試套件。
- `npm run bundle`：將 `src/` 模組打包成 `dist/Code.gs`。

## 開發流程

1. 修改 `src/` 下的程式。
2. 執行 `npm test` 確認行為沒壞。
3. 執行 `npm run bundle` 產生 GAS 發行版。
4. 將 `dist/Code.gs` 內容貼到 Google Apps Script 專案。

## 注意事項

- 本地測試時如果沒有設定 LINE 的 script properties，會看到 `CHANNEL_ACCESS_TOKEN` 缺少的警告；這在離線測試屬於正常現象。
- 目前 workspace 已建立 `npm test` 與 `npm run bundle` 兩個 VS Code 任務，可直接從工作台執行。