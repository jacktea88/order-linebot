# GAS 更新說明

這份說明整理的是本次為了降低 webhook 回應延遲所做的變更，方便你在部署到 Google Apps Script 前後快速確認。

## 本次修改重點

1. 新增初始化守門函式 `_hasRequiredSheets()`。
2. 新增 `ensureSheetsInitialized()`，改成只有在首次執行或缺少必要分頁時才跑完整 `initSheets()`。
3. `setup()` 成功後會寫入 Script Properties 的 `SHEETS_INITIALIZED=true`，避免下一次 webhook 重複初始化。
4. 加上註解，說明這組邏輯同時是為了維持自動補表能力，以及加速 webhook 回應速度。

## 快取列表與啟動時機

1. 幫助卡片與菜單卡片的固定文字快取
	- 旗標：`DEV_FLEX_STATIC_CACHE_MODE=true`
	- 作用範圍：只快取幫助卡片與菜單卡片中不會隨訂單變動的固定翻譯字串與按鈕文案。
	- 啟動時機：第一次建立對應卡片時先寫入快取，第二次用同樣語系與同樣條件讀取時直接命中。
	- 不包含：實際菜單品項、數量、售完狀態、價格等動態資料。

2. 訂單查詢與摘要快取
	- 旗標：`DEV_ORDER_PREVIEW_MODE=true` 且 `DEV_ORDER_CACHE_MODE=true` 必須同時成立。
	- 作用範圍：`getUserOrders()`、`getGroupOrders()`、`getOrderSummary()`、`getWeeklyOrderSummary()` 這些訂單讀取路徑。
	- 啟動時機：第一次查詢同條件時先建立快取，第二次同條件讀取時直接命中。
	- 失效時機：新增、取消、批次取消等寫入路徑會推進版本號，讓下一次讀取重新建快取。

3. 預覽模式與正式模式的關係
	- 上述兩種快取都屬於測試/預覽用途，不影響正式流程。
	- 如果未開啟對應旗標，程式會照原本流程直接讀試算表，不會使用快取。

## 判斷流程

1. 先讀 Script Properties 的 `SHEETS_INITIALIZED`。
2. 如果旗標已存在，接著檢查必要分頁是否齊全。
3. 旗標為真且分頁齊全時，直接略過 `initSheets()`。
4. 只要旗標不存在或分頁缺失，就重新執行 `initSheets()`，並在成功後補上旗標。

## 你部署時要注意的事

1. 如果你已經手動執行過 `setup()`，下一次 webhook 通常不會再跑完整初始化。
2. 如果某些必要分頁被刪掉或改壞，系統會自動補回。
3. 這個修改不影響既有 webhook、LINE reply、特餐、訂單流程，只是把初始化的成本降到最低。

## 驗證結果

- `npm test` 通過。
- `npm run bundle` 通過。
- `src/Code.js` 的新增函式沒有語法錯誤。
- `src/FlexMessage.js` 與 `src/SheetService.js` 的快取邏輯沒有語法錯誤。

## 對應檔案

- [src/Code.js](../src/Code.js)
- [dist/Code.gs](../dist/Code.gs)
