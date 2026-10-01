# 特別日期限定菜單：修改說明

## 1. 需求

建立特定日期限定的菜單，每項菜色有數量限制，須提前兩週預訂，截止時間可修改。

已確認的設計決策：

| 項目 | 決定 |
| --- | --- |
| 建立與維護方式 | 試算表與 LINE 主辦人指令皆可 |
| 預設截止時間 | 活動日前 14 天 23:59，可個別修改 |
| 訂單儲存 | 沿用 `Orders` 分頁 |
| 數量上限 | 所有群組共用的總量 |
| 語系 | 只提供繁中，其他語系透過 `t()` 退回 zh-TW |
| 數量上限留空或 0 | 不限量（不檢查庫存、不顯示剩餘量、不需加鎖） |

不在範圍內：多語系翻譯、每人限購、結單與付款整合、定時提醒、外送平台匯入特餐菜單。

## 2. 為何這樣設計

1. **沿用 `Orders` 分頁**：付款、主辦人通知、小孩分配等既有邏輯都以 `Orders` 為基礎，另開訂單表會重複實作。
2. **不新增 `SpecialDate` 欄位，改用 `DayOfWeek = '特餐'`、`Date = 活動日`**：`Orders` 原本的查詢都以星期判斷，新增欄位必須改動每一個讀取處，也會影響既有試算表的欄位順序。改成特殊標記後，只要在 `_matchOrderTiming` 一處隔離，特餐訂單就不會混入週一到週五的統計、`我的訂單` 與一般取消。
3. **庫存檢查與寫入包在 `LockService`**：多人同時預訂時，若先讀已售數量再寫入，會超賣；腳本鎖讓「檢查 + 寫入」成為單一步驟。不限量品項不需要鎖。
4. **整筆拒絕，不部分成交**：避免使用者點 4 份卻只拿到 3 份卻沒察覺。訊息會顯示剩餘量，讓使用者自行調整。
5. **特餐邏輯獨立成 `SpecialMenuService.js`**：`OrderService.js` 已很大，獨立檔案可避免繼續膨脹；處理器回傳 `{text}` 或 `{altText, flex}`，由 `OrderService` 負責回覆，因此新檔案不依賴 `LineService`。
6. **特餐指令攔截點在說明與語言指令之後、其他指令之前**：否則 `取消特餐 ...` 會被既有的取消指令吃掉，`特餐 日期 品名+N` 會被一般點餐解析器當成普通品項。

## 3. 修改檔案與程式碼

### 3.1 `src/Config.js`

新增兩個分頁名稱：

```js
SHEET_NAMES: {
  // ...
  SPECIAL_MENU_DATES: 'SpecialMenuDates',
  SPECIAL_MENU_ITEMS: 'SpecialMenuItems'
}
```

### 3.2 `src/SheetService.js`

**a. 初始化資料與分頁定義**

- 記憶體模擬資料 `_mockStore` 新增 `SpecialMenuDates`、`SpecialMenuItems`，Config 新增預設值 `SPECIAL_MENU_LEAD_DAYS: '14'`、`SPECIAL_MENU_CUTOFF_TIME: '23:59'`。
- `initSheets` 的 `sheetDefs` 新增兩個分頁（表頭如下），並把預設 Config 寫入：
  - `SpecialMenuDates`：`EventDate, Title, CutoffAt, IsActive, Notes`
  - `SpecialMenuItems`：`EventDate, Category, ItemName, Price, QuantityLimit, IsAvailable, Description`
- `SYSTEM_TAB_NAMES` 加入 `UserPreferences`、`SpecialMenuDates`、`SpecialMenuItems`，避免被當成店家菜單分頁。

**b. 隔離特餐訂單（`_matchOrderTiming`）**

```js
// Special-date orders (Date = event date) are only visible to queries that explicitly ask for them
if (oDay === SPECIAL_DAY_MARKER) {
  return qDay === SPECIAL_DAY_MARKER && (!qDate || oDate === qDate);
}
if (qDay === SPECIAL_DAY_MARKER) return false;
```

第一段讓特餐訂單只被「明確查特餐」的查詢看到；第二段避免一般訂單因日期相同被特餐查詢撈到。

**c. 新增資料層函式**

| 函式 | 用途 |
| --- | --- |
| `SPECIAL_DAY_MARKER` | 特餐標記 `'特餐'` |
| `_formatDateTimeValue(val)` | 將試算表的日期時間統一成 `yyyy-MM-dd HH:mm`（只有日期時視為 23:59） |
| `_specialQuantityLimit(val)` | 解析數量上限，0 或空白代表不限量 |
| `getSpecialDates()` / `getSpecialDate(date)` | 讀取特餐日期，依日期排序 |
| `saveSpecialDate(date, fields)` | 新增或更新；`cutoffAt: ''` 代表重設為預設 |
| `getSpecialItems(date, includeUnavailable)` | 讀取品項 |
| `saveSpecialItem(...)` | 新增或更新品項（以日期 + 品名為鍵） |
| `getSpecialSoldMap(date)` | 統計各品項已訂數量（所有群組、僅 ACTIVE） |
| `addSpecialOrder(orderData)` | 加鎖後檢查庫存並寫入訂單 |

庫存檢查核心：

```js
if (item.quantityLimit > 0) {
  var sold = getSpecialSoldMap(eventDate)[item.itemName] || 0;
  var left = Math.max(0, item.quantityLimit - sold);
  if (qty > left) {
    return { ok: false, reason: left === 0 ? 'SOLD_OUT' : 'EXCEEDS', remaining: left, item: item };
  }
  remaining = left - qty;
}
```

回傳 `{ok:true, record, item, remaining}` 或 `{ok:false, reason:'NOT_FOUND'|'SOLD_OUT'|'EXCEEDS'|'BUSY'}`。上述函式與 `SPECIAL_DAY_MARKER`、`_formatDateValue` 皆已加入 `g.xxx` 與 `module.exports`。

### 3.3 `src/SpecialMenuService.js`（新檔）

**截止時間邏輯**

```js
function getSpecialDefaultCutoffAt(eventDate) {
  var lead = parseInt(SpecialSheet.getConfigValue('SPECIAL_MENU_LEAD_DAYS', '14'), 10);
  // ...
  return _specialAddDays(eventDate, -lead) + ' ' + time;   // 例如 2026-10-01 23:59
}

function getSpecialCutoffAt(eventDate, dateRec) {
  var own = dateRec && dateRec.cutoffAt;
  if (own && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(own)) return own;
  return getSpecialDefaultCutoffAt(eventDate);
}

function isSpecialOrderingClosed(eventDate, dateRec, refDate) {
  var now = _specialNow(refDate);
  if (now.date > eventDate) return true;
  return now.dateTime >= getSpecialCutoffAt(eventDate, dateRec);
}
```

- 有自訂 `CutoffAt` 就用自訂值，否則用預設值，因此修改截止時間只需寫入該欄位。
- 時間一律以試算表時區計算（`_specialNow`），並支援測試用的 `globalThis._mockCurrentDate`。

**指令（主要函式 `handleSpecialMenuCommand(ctx)`）**

| 對象 | 指令 |
| --- | --- |
| 所有人 | `特餐菜單`、`特餐 <日期>`、`特餐 <日期> 品名+數量`、`取消特餐 [日期] [品名\|全部]`、`我的特餐`、`特餐統計 [日期]` |
| 僅主辦人 | `新增特餐 <日期> [標題]`、`特餐品項 <日期> <品名> <價格> [數量]`、`特餐截止 <日期> <截止日期 時間\|預設>` |

- 日期格式：`YYYY-MM-DD`、`YYYY/M/D`、`M/D`、`M-D`、`M月D日`。沒寫年份時取下一個不早於今天的日期。
- 截止時間不可晚於活動日；`特餐截止 <日期> 預設` 會重設回預設值。
- 下單前會檢查是否已截止；單一使用者只登記一位小孩時自動帶入；品名支援完全相符與唯一的部分相符。
- 成功預訂或取消時通知主辦人（`notify`）。
- 取消僅限截止前。
- 指令前綴像特餐但參數不合法時，回覆用法說明，避免落入一般點餐解析。

### 3.4 `src/OrderService.js`

新增模組載入：

```js
var SpecialModule = null;
(function () {
  // ... 與其他模組相同的 globalThis / require 判斷
  if (g && g.handleSpecialMenuCommand) { SpecialModule = g; }
  else { try { SpecialModule = require('./SpecialMenuService.js'); } catch (e) {} }
})();
```

在 `handleTextMessage` 的語言設定（1-1）之後、本週菜單（2）之前插入：

```js
// 1-2. SPECIAL-DATE MENUS
if (SpecialModule && SpecialModule.handleSpecialMenuCommand) {
  var specialReply = SpecialModule.handleSpecialMenuCommand({
    text: text, userId: userId, groupId: groupId, userName: userDisplayName, locale: userLocale,
    isOrganizer: isUserOrganizer(userId, userDisplayName),
    hasOrganizer: !!(SheetModule.getConfigValue('ORGANIZER_ID', '') || '').trim(),
    parseOrderText: parseOrderText,
    notify: notifyOrganizer
  });
  if (specialReply) {
    return specialReply.flex
      ? LineModule.replyFlex(replyToken, specialReply.altText, specialReply.flex)
      : LineModule.replyText(replyToken, specialReply.text);
  }
}
```

### 3.5 `src/FlexMessage.js`

- 新增 `createSpecialDateListFlex(dates, locale)`：列出即將到來的特餐日期、截止時間與狀態，按鈕送出 `特餐 <日期>`。
- 新增 `createSpecialMenuFlex(info, items, soldMap, locale, page, pageSize)`：顯示標題、日期、截止時間、每項價格與剩餘量（`剩餘 x/上限`，不限量顯示「不限量」）；按鈕送出 `特餐 <日期> <品名>+1`；售完或已截止時按鈕改為灰色；每頁 20 項並有換頁按鈕。
- `createHelpFlex` 的 `commands` 陣列新增「特別日期菜單」項目。
- 兩個新函式已加入 `g.` 與 `module.exports`。

### 3.6 `src/I18n.js`

- zh-TW 訊息目錄新增 `help.cmd_special.*` 與 `special.*` 鍵（用法、錯誤、成功訊息、通知等）。含 `$` 的模板用字串相接（`'... $' + '{price}'`），避免 `t()` 內 `String.replace` 把 `$` 當特殊符號處理。
- `I18N_COMMANDS['zh-TW']` 新增：`cmd.special_menu`、`cmd.special_add`、`cmd.special_item`、`cmd.special_cutoff`、`cmd.special_cancel`、`cmd.special_my`、`cmd.special_stats`。

### 3.7 `scripts/bundle.js`

`fileOrder` 在 `FlexMessage.js` 之後、`OrderService.js` 之前加入 `SpecialMenuService.js`，因為它依賴前面的檔案，且 `OrderService` 需要用到它。

### 3.8 `tests/test_order_flow.js`

- 幫助卡按鈕數量因多一個項目而調整（9 -> 10、10 -> 11），英文、日文、越南文語言按鈕索引由 9 改為 10，並新增對 `特餐菜單` 按鈕的檢查。
- 新增 Test 19，涵蓋：
  - 僅主辦人可建立、加品項、改截止時間；預設截止為活動日前 14 天 23:59
  - 日期列表與菜單顯示剩餘量
  - 共用庫存、超量整筆拒絕、恰好售完、取消後釋出庫存、不限量品項
  - 特餐訂單不出現在一般訂單與週統計
  - 截止時間修改：晚於活動日被拒絕、縮短後截止、延長後重新開放、重設為預設
  - 截止後無法預訂與取消；無效日期與不存在日期的訊息

### 3.9 `README.md`

指令表新增特餐指令，並說明新分頁與訂單儲存慣例。

## 4. 使用與設定重點

- 主辦人判斷依賴 Config 的 `ORGANIZER_ID`；未設定時會提示先 `開單` 或設定 `ORGANIZER_ID`。
- 預設截止規則由 Config 的 `SPECIAL_MENU_LEAD_DAYS`（預設 14）與 `SPECIAL_MENU_CUTOFF_TIME`（預設 23:59）控制。
- 已有訂單後調整品項價格或上限：既有訂單保留原價；新上限若低於已訂量，不會取消既有訂單，只會讓後續預訂被拒絕。
- 部署後會自動建立兩個新分頁與預設 Config：`doPost` 每次收到事件都會先呼叫 `initSheets()`。也可手動執行 `setup`（見下節）。

## 5. 在 GAS 部署新版本

1. 本機執行 `npm run bundle`，產生 `dist/Code.gs`。
2. 開啟試算表，點「擴充功能」>「Apps Script」，把編輯器中 `Code.gs` 的內容全部取代為 `dist/Code.gs` 的內容，按「儲存」。
3. （可選）在函式下拉選單選 `setup`，按「執行」，立即建立分頁與預設 Config。第一次執行需要授權。
4. 點右上角「部署」>「管理部署作業」，選擇現有的 Web App 部署，按鉛筆圖示，「版本」選「新版本」，按「部署」。
5. 網址不變，LINE Developers 的 Webhook URL 不必修改。傳一則訊息給 Bot（例如 `特餐菜單`）確認新版已生效。

注意：只儲存程式碼不會更新 Web App，必須建立「新版本」；若改選「新增部署作業」，網址會改變，需要重新設定 Webhook URL。

## 6. 驗證

- `npm test` 全數通過。
- `npm run bundle` 產出 `dist/Code.gs`（11 個檔案）。
- 尚未在真實的 Google Sheets 與 LINE 環境實測。
