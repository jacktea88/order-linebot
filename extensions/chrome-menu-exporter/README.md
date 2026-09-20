# 🍱 便當點餐機器人 - 菜單擷取 Chrome 擴充套件 (Menu Exporter)

專為 **LINE 便當點餐機器人** 設計的 Chrome 擴充套件，解決 Google Apps Script (GAS) 連線受到 Cloudflare WAF / Bot 防護阻擋（如 Uber Eats 回應 HTTP 403 Challenge `<title>Just a moment...</title>`）的問題。

利用真實瀏覽器環境已通過人機驗證與具備完整 Session Cookie 的優勢，在瀏覽器端一鍵擷取 **Uber Eats**、**foodpanda** 與 **你訂 (Nidin)** 店家完整菜單，並自動轉換成 Google 試算表格式！

---

## ✨ 主要功能

1. **三合一多平台自動偵測**：
   - 🍔 **Uber Eats**：支援網址自動解析 Base64 UUID，使用頁面原生連線與 DOM 雙軌智能擷取。
   - 🐼 **foodpanda**：支援商家菜單 API 自動擷取。
   - 🥤 **你訂 (Nidin)**：支援手搖飲、便當店家菜單，自動解析加料與多規格真實價格。
2. **多語系國際化 (i18n) 支援**：
   - 支援 Chrome 官方國際化架構 (`_locales/`)：**繁體中文 (`zh_TW`)**、**English (`en`)**、**日本語 (`ja`)**。
   - 彈出介面右上角提供即時切換語言下拉選單，自動記憶使用者語言偏好。
3. **雙軌一鍵複製 Google 試算表格式 (TSV)**：
   - **📋 複製 Menu 格式 (7欄)**：`DayOfWeek \t RestaurantName \t Category \t ItemName \t Price \t IsAvailable \t Description`，支援自訂星期（如：`週一`）或設為 `ALL`，回到試算表 `Menu` 頁籤最下方空白列第一格按 `Ctrl+V` (Mac: `Cmd+V`) 即可 1 秒貼上！
   - **📋 複製自訂餐廳格式 (5欄)**：`Category \t ItemName \t Price \t IsAvailable \t Description`，可直接貼入為該餐廳獨立開設之工作表（如：`老王便當`）。
4. **下載 TSV 檔案**：
   - 附帶 UTF-8 BOM，雙擊直接以 Excel 或 Google Sheets 開啟不亂碼。
5. **即時預覽與統計**：
   - 顯示品項總數、分類數量與前 10 筆餐點即時預覽。

---

## 🚀 3 步極速安裝指南 (Chrome 擴充套件)

1. **開啟 Chrome 擴充功能管理頁面**：
   - 在 Chrome 網址列輸入：`chrome://extensions/` 並按 Enter。
2. **開啟「開發者模式」**：
   - 將右上角的 **「開發人員模式 (Developer mode)」** 開關切換為 **開啟**。
3. **載入擴充套件**：
   - 點擊左上角的 **「載入未封裝項目 (Load unpacked)」** 按鈕。
   - 選擇本專案目錄中的資料夾：
     ```text
     order-linebot/extensions/chrome-menu-exporter
     ```
   - 安裝完成！Chrome 右上角工具列會出現 🍱 圖示（可點擊拼圖圖示將其釘選到工具列）。

---

## 📖 使用教學

1. **開啟店家網址**：
   - 在 Chrome 中打開任一家 Uber Eats、foodpanda 或你訂的菜單頁面。
   - 例如：`https://www.ubereats.com/tw/store/...`
2. **點開擴充套件**：
   - 點擊右上角工具列的 🍱 圖示。
   - 擴充套件會自動識別平台與預填店家名稱。
3. **擷取菜單**：
   - 可在「店家名稱」自訂店名，或在「排程星期」指定星期（例如：`週一`）。
   - 點選 **「🚀 擷取菜單」**，約 1~2 秒即可完成抓取並顯示餐點總數與預覽。
4. **貼入 Google 試算表**：
   - **方式 A（推薦 - 寫入 Menu 總表）**：
     點擊 **「📋 複製 Menu 格式 (7欄)」**，切換到 Google 試算表的 **`Menu`** 工作表，點擊最下方空白列的 A 欄儲存格，按 **Ctrl+V**（Mac: **Cmd+V**）貼上即可。
   - **方式 B（寫入自訂餐廳分頁）**：
     點擊 **「📋 複製自訂餐廳格式 (5欄)」**，貼入專屬餐廳名稱分頁（例如：`深夜未歸`）。
5. **更新排程**：
   - 到試算表的 **`WeeklySchedule`** 分頁，將對應星期的餐廳名稱設定為剛貼上的店家名稱即可開始點餐！

---

## 📁 檔案結構

```text
extensions/chrome-menu-exporter/
├── manifest.json              # Chrome Manifest V3 設定檔 (含 default_locale 與權限)
├── _locales/                  # Chrome 國際化多語系辭典
│   ├── zh_TW/messages.json    # 繁體中文
│   ├── en/messages.json       # English
│   └── ja/messages.json       # 日本語
├── popup.html                 # 擴充套件彈出介面 (含語系選單、欄位設定與預覽)
├── popup.css                  # Tailwind 風格美化樣式
├── popup.js                   # 菜單擷取邏輯、i18n 切換引擎與 TSV/JSON 匯出轉換
├── icons/                     # 擴充套件多解析度圖示
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md                  # 本說明文件
```
