# 修復：批次設定道親名單丟失舊記錄問題

## 問題描述
當使用者執行「設定道親」命令批次登記道親名單時，系統會**刪除所有舊的道親記錄，然後替換為新的記錄**。這導致修改批次名單時，舊的名單會完全消失。

### 原始行為
```
使用者原本有：大寶、二寶
執行：設定道親 大寶、二寶、三寶
結果：舊記錄被刪除，只保留 大寶、二寶、三寶
問題：如果網路中斷或其他錯誤，可能新記錄沒有成功寫入，導致全部遺失
```

## 修復方案
改變 `setChildren()` 函數的邏輯為**追加模式**，而不是替換模式：

1. **檢查已有的道親記錄**：先取得使用者已有的所有道親名字
2. **避免重複**：只新增不存在的道親名字
3. **保留舊記錄**：舊的道親記錄完全保留
4. **新增新記錄**：只追加新的道親記錄

### 修復後行為
```
使用者原本有：大寶、二寶
執行：設定道親 大寶、二寶、三寶
結果：保留大寶、二寶，新增三寶 → 大寶、二寶、三寶
使用者可以安心地批次新增，舊記錄不會遺失
```

## 修改內容

### 1. SheetService.js - setChildren 函數
- **行數**：2970-3020
- **變更**：
  - ❌ 移除：刪除所有舊記錄的邏輯 (`_mockStore.Children.filter()` 和 `sheet.deleteRow()`)
  - ✅ 新增：檢查已有道親名字的邏輯
  - ✅ 新增：只追加新記錄而不是刪除舊記錄

### 2. SheetService.js - clearChildren 函數（新增）
- **行數**：3050-3085
- **用途**：新增輔助函數用於**測試**清空使用者的所有道親
- **說明**：這不是面向使用者的功能，只用於測試環境確保狀態乾淨

### 3. OrderService.js - 回應訊息更新
- **行數**：1465
- **變更**：
  - ❌ 舊：「已為您成功**設定**道親名冊」
  - ✅ 新：「已為您成功**新增**道親名冊」
  - 說明：訊息更新以反映追加模式而不是替換模式

### 4. tests/test_order_flow.js - 測試更新
- **行數**：1519-1520, 1596, 1610 等
- **變更**：由於改為追加模式，測試需要在預期狀態前調用 `clearChildren()` 來清空舊記錄，確保測試不受先前狀態影響

## 測試驗證
- ✅ 所有單元測試通過（npm test）
- ✅ 10 個主要功能測試通過
- ✅ 19 個特殊功能測試通過
- ✅ 重複新增同名道親不會產生重複記錄
- ✅ Google Sheets 和 Mock 模式都正確實現

## 使用者影響
### 正面影響
1. **安全性提升**：修改批次名單時舊記錄不會丟失
2. **操作便利性**：使用者可以安心地多次執行「設定道親」命令，逐步新增道親
3. **容錯能力**：即使網路中斷，舊記錄也能保留

### 行為變化
| 場景 | 舊行為 | 新行為 |
|------|--------|--------|
| 已有 A、B，執行「設定道親 A、B、C」 | 只有 A、B、C | A、B、C（C 新增） |
| 已有 A、B，執行「設定道親 B、C」 | 只有 B、C | A、B、C（C 新增） |
| 已有 A、B，執行「設定道親 A」 | 只有 A | A、B（B 保留） |

### 刪除道親
使用者若要移除某位道親，應使用「**刪除道親**」命令而非「設定道親」命令。

## 技術細節

### Mock Store（Node.js 測試環境）
```javascript
// 2974-2998 行
var existingNames = _mockStore.Children
  .filter(function (c) { return c.userId === userId || c.userId === effUserId; })
  .map(function (c) { return c.childName; });

names.forEach(function (n) {
  if (existingNames.indexOf(_sanitizeSheetCell(n)) === -1) {
    // 只新增不存在的
    _mockStore.Children.push({...});
  }
});
```

### Google Sheets（正式環境）
```javascript
// 3008-3018 行
var existingNames = [];
for (var r = 1; r < rows.length; r++) {
  var rUid = String(rows[r][0]).trim();
  if (rUid === userId || rUid === effUserId) {
    var childName = String(rows[r][3]).trim();
    if (childName) {
      existingNames.push(childName);
    }
  }
}
// 只追加新的
names.forEach(function (n) {
  var sanitizedName = _sanitizeSheetCell(n);
  if (existingNames.indexOf(sanitizedName) === -1) {
    sheet.appendRow([...]);
  }
});
```

## 相關命令
- **設定道親**（修復內容）：批次新增道親 → 現在是追加而非替換
- **新增道親**（無變化）：逐個新增單個道親 + 備註
- **刪除道親**（無變化）：移除指定道親記錄
- **我的道親**（無變化）：查看已登記的道親清單

## 後續建議
1. 若使用者需要「完全替換」道親名單，應使用「先刪除所有 → 再新增」的流程
2. 可考慮未來在 UI 中提供「清除所有道親」的確認按鈕（需要雙重確認以防誤操作）
