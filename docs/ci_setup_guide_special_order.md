# 中期階段升級指南：遠端開發 + CI 自動部署

**更新日期**：2026-11-14  
**目標分支**：`special-order`  
**前置完成**：短期手動部署（第 1-8 步）

---

## 概述

從短期的「遠端開發 + 手動部署」升級到「遠端開發 + CI 自動部署」。這將自動化以下流程：

- 自動測試
- 自動打包
- 自動部署到 Google Apps Script
- 手動回滾支持

---

## 升級前置檢查

- [ ] 短期部署已完成（Webhook 已驗證）
- [ ] 已在 Codespaces 中進行過 1 次完整手動部署（第 4-8 步）
- [ ] 知道自己的 GAS Script ID 和 Web App Deployment ID
- [ ] 擁有 GitHub 倉庫的 Admin 或 Maintainer 權限

---

## 第 1 階段：本地 clasp 授權與 Secret 設定

### 1.1 在本地電腦進行 clasp 授權（一次性）

**環境**：在你的本地電腦（非 Codespaces）執行

```bash
# 安裝 clasp CLI（如果未安裝）
npm install -g @google/clasp

# 執行授權登入
clasp login
```

- 這會開啟瀏覽器進行 Google OAuth 授權
- 授權完成後，會生成 `~/.config/clasp/.clasprc.json`（或 `~/.clasprc.json`，取決於作業系統）

### 1.2 獲取授權文件內容

在本地電腦上執行：

```bash
# 查看授權文件位置
cat ~/.config/clasp/.clasprc.json
# 或在 Windows 上
type %APPDATA%\.clasp\credentials.json
```

複製整個 JSON 內容，注意不要洩露個人資訊。

### 1.3 在 GitHub 中添加 Secrets

1. 進入你的 GitHub 倉庫
2. 點選 **Settings** → **Secrets and variables** → **Actions**
3. 點選 **New repository secret**

**Secret 1: CLASPRC_JSON**
- **Name**: `CLASPRC_JSON`
- **Value**: 貼上第 1.2 步複製的 `.clasprc.json` 內容

**Secret 2: CLASP_DEPLOYMENT_ID**
- **Name**: `CLASP_DEPLOYMENT_ID`
- **Value**: 你的 Web App Deployment ID（從第 8 步取得）
  - 格式：長的英文數字字串，如 `AKfycbzS5qllaxVkRmU6TFgsNn1f_bwxV7E...`

### 1.4 驗證 Secrets 已正確設定

在 Actions 頁面應該可以看到這兩個 Secret 已列出（不顯示具體值）。

---

## 第 2 階段：推送代碼觸發 CI 部署

### 2.1 驗證本地 clasp.json 配置

在 Codespaces 中已為你創建了 `.clasp.json`：

```bash
cd /workspaces/order-linebot
cat .clasp.json
```

應該看到：
```json
{
  "scriptId": "1xL_OwpsStQlaz2LeaTWff12CRPvBXmUknFxSaYH1iJD9ZlB7VnTZ2Re9",
  "rootDir": "dist"
}
```

> 💡 **Note**: `.clasp.json` 已被 `.gitignore` 忽略，不會被上傳到 GitHub。本地配置只在 Codespaces 使用。

### 2.2 推送代碼到 special-order

```bash
cd /workspaces/order-linebot

# 確認在 special-order 分支
git branch

# 進行修改（例如修改 src 中的程式碼）
# ...

# 提交並推送
git add .
git commit -m "feat: your feature description

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

git push origin special-order
```

### 2.3 監看 CI 部署執行

1. 進入 GitHub 倉庫首頁
2. 點選 **Actions** 標籤
3. 應該看到 **「Deploy to GAS (special-order)」** workflow 正在執行
4. 點選進去查看實時日誌：
   - ✅ Checkout
   - ✅ Setup Node.js
   - ✅ Install dependencies
   - ✅ Run tests
   - ✅ Bundle dist/Code.gs
   - ✅ Setup clasp
   - ✅ Push to Apps Script
   - ✅ Deploy to existing deployment

### 2.4 部署完成後的檢查

部署成功後：
- [ ] GitHub Actions 顯示綠色 ✅
- [ ] 進行 LINE Smoke Test：
  - 在 LINE 群組發送「幫助」→ 收到幫助訊息
  - 在 LINE 群組發送「菜單」→ 收到菜單卡片
  - 在 LINE 群組發送「我的訂單」→ 收到訂單清單

---

## 第 3 階段：緊急回滾流程

如果部署後發現問題，可以快速回滾到上一個穩定版本。

### 3.1 查找穩定版本的 Commit SHA

```bash
# 查看提交歷史
git log --oneline | head -10

# 找到要回滾到的 commit SHA（前 7 個字符，如 c2ab4d3）
```

### 3.2 觸發回滾 Workflow

1. 進入 GitHub 倉庫 → **Actions**
2. 左側選擇 **「Rollback GAS (special-order)」**
3. 點選 **「Run workflow」** 按鈕
4. 填入以下信息：
   - **Commit SHA to rollback to**: 輸入上一個穩定版本的 SHA（如 `9796353`）
   - **Reason for rollback**: 簡短說明（如 `Critical bug in menu display`）
5. 點選 **「Run workflow」** 執行

### 3.3 驗證回滾完成

- 監看 workflow 執行日誌
- 部署成功後再次進行 Smoke Test
- 記錄回滾信息到事件日誌

---

## 第 4 階段：日常操作流程（中期穩定模式）

### 日常開發

```bash
# 在 special-order 分支進行開發
git checkout special-order

# 修改 src 中的程式碼
# ...

# 本地測試
npm test

# 本地打包驗證
npm run bundle

# 提交並推送
git add .
git commit -m "feat: description"
git push origin special-order
```

### 觸發部署（2 種方式）

**方式 A：自動觸發（推薦）**
- 推送代碼到 special-order → 自動觸發 Deploy workflow

**方式 B：手動觸發**
1. 進入 GitHub Actions
2. 選擇 **「Deploy to GAS (special-order)」**
3. 點選 **「Run workflow」**
4. 選擇 `special-order` 分支
5. 點選 **「Run workflow」**

### 監控部署

- 監看 GitHub Actions 日誌
- 部署完成後在 LINE 群組進行快速驗證

---

## 常見問題排除

### Q1: Deploy 失敗 - `invalid_grant` 錯誤

**原因**：CLASPRC_JSON Secret 過期或無效

**解決**：
1. 在本地重新執行 `clasp login`
2. 複製新的 `.clasprc.json` 內容
3. 更新 GitHub Secret: `CLASPRC_JSON`

### Q2: Deploy 失敗 - `Project not found`

**原因**：Script ID 不正確

**解決**：
1. 檢查 `.clasp.json` 中的 `scriptId` 是否正確
2. 確認 clasp 授權用戶對該 Script 有編輯權限

### Q3: Deploy 成功但 LINE 機器人無回應

**原因**：通常是 Webhook 或 Script Properties 問題

**解決**：
1. 先執行回滾
2. 檢查 GAS Script Properties 中的 `CHANNEL_ACCESS_TOKEN` 和 `CHANNEL_SECRET` 是否正確
3. 檢查 LINE Webhook URL 是否仍然指向正確的 Web App URL

### Q4: 想要修改部署策略（例如改為手動觸發）

編輯 `.github/workflows/deploy.yml`，修改 `on:` 部分：

```yaml
# 改為只手動觸發
on:
  workflow_dispatch:

# 或改為只在 main 推送時觸發
on:
  push:
    branches:
      - main
```

---

## 安全最佳實踐

1. **絕不在代碼中寫入密鑰**
   - ✅ 使用 GitHub Secrets
   - ❌ 不要 commit `.clasprc.json` 或 Token

2. **定期驗證授權有效性**
   - 每月檢查一次部署是否成功
   - 若授權失效，重新執行 `clasp login`

3. **限制 Secret 存取權限**
   - 只授予需要的人員對倉庫 Settings 的存取權

4. **監控部署歷史**
   - 定期查看 GitHub Actions 日誌
   - 記錄每次部署的 commit 和時間戳

---

## 參考文件

- [CI Workflow 範本](./ci_workflow_template.md)
- [手機值班 SOP](./mobile_remote_ops_sop.md)
- [遠端工作區評估](./remote_workspace_assessment.md)
- [部署指南](./deployment_guide.md)

---

## 檢查清單

- [ ] 本地 clasp 授權已完成
- [ ] CLASPRC_JSON Secret 已添加到 GitHub
- [ ] CLASP_DEPLOYMENT_ID Secret 已添加到 GitHub
- [ ] .clasp.json 已在本地配置
- [ ] 推送代碼到 special-order 並成功觸發 Deploy workflow
- [ ] Deploy workflow 執行成功（測試 → 打包 → 部署）
- [ ] LINE Smoke Test 驗證通過
- [ ] 演練過一次回滾流程

**下一步**：升級到長期階段（多分支策略 + 自動化 smoke test）
