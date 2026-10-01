# 新功能本地測試指南

這份文件說明在這個 LINE Bot 專案中，新增功能後如何先在本機測試，再部署到 GAS。

## 1. 可以先在本機測的內容

以下邏輯通常都可以先在本地驗證：

- 指令解析與分流
- 訂單新增、取消、統計
- 特餐、一般菜單與分頁處理
- Flex Message 結構
- 試算表資料讀寫邏輯
- I18n 文案與指令別名
- bundle 後的單檔輸出結果

以下項目通常還是要上線後才能完整驗證：

- LINE Webhook 真實收訊息
- GAS Web App 實際部署與權限
- Google Sheets 真實權限與觸發行為

## 2. 基本檢查流程

先確認專案可以正常打包與測試：

```bash
npm test
npm run bundle
```

如果 `npm test` 通過，表示目前的業務邏輯沒有被破壞。
如果 `npm run bundle` 通過，表示可成功產出 `dist/Code.gs`。

## 3. 新增功能時的本地測試步驟

### 3.1 先做最小變更

先在 `src/` 裡修改單一模組，不要一次改太多檔案。

### 3.2 跑既有測試

修改後先跑：

```bash
npm test
```

如果測試失敗，先看是哪一段流程壞掉，再回頭修正。

### 3.3 打包確認

測試通過後，再跑：

```bash
npm run bundle
```

確認 `dist/Code.gs` 有順利更新。

### 3.4 如有需要，加測試案例

如果你新增的是新的指令、特殊菜單、取消流程、統計邏輯，建議在 `tests/test_order_flow.js` 補一段對應測試，至少覆蓋：

- 正常成功
- 不合法輸入
- 權限不足
- 截止時間或庫存不足

## 4. 這個專案常用的本機驗證項目

### 4.1 變更指令或流程後

檢查：

- `OrderService.js` 是否仍能正確回覆
- `parseOrderText()` 是否仍能解析原本語法
- `handleTextMessage()` 的分流順序是否被改壞

### 4.2 變更試算表邏輯後

檢查：

- `SheetService.js` 的 mock store 是否同步更新
- 新增欄位是否有初始化資料
- 讀寫函式是否同時支援 GAS 與 Node 測試環境

### 4.3 變更 Flex 卡片後

檢查：

- `FlexMessage.js` 產出的 JSON 結構是否合理
- 按鈕文字、頁碼、狀態訊息是否正確
- 內容是否超出預期頁數或長度

## 5. 建議的開發順序

1. 先改 `src/` 中對應模組
2. 先跑 `npm test`
3. 再跑 `npm run bundle`
4. 若需要，更新 `README.md` 或 `docs/`
5. 最後再部署到 GAS

## 6. 部署前檢查

部署前至少確認：

- `npm test` 成功
- `npm run bundle` 成功
- `dist/Code.gs` 已更新
- 若有新增遠端同步流程，`git status` 乾淨或已提交

## 7. 小提醒

本專案的大部分邏輯都適合先做本機測試，但真正的 LINE 回覆、GAS 部署與 Google Sheets 權限，仍然要到雲端環境做最後確認。
