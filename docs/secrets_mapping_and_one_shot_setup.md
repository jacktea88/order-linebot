# Codespaces Secrets 與 GitHub Actions Secrets 對照表 + 一次設定完成指令

更新日期：2026-11-14

適用情境：
- 在 Codespaces 用指令部署（npm run deploy:gas）
- 用 GitHub Actions 自動部署與回滾（deploy.yml / rollback.yml）

---

## 1) Secrets 對照表

| Secret 名稱 | Codespaces（指令部署） | GitHub Actions（CI/CD） | 用途 | 範例值格式 |
| :--- | :---: | :---: | :--- | :--- |
| CLASPRC_JSON | 必要 | 必要 | clasp OAuth 認證 JSON 內容 | {"token":...,"oauth2ClientSettings":...} |
| CLASP_SCRIPT_ID | 必要 | 必要 | GAS 專案 Script ID（用於產生 .clasp.json） | 1xL_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx |
| CLASP_DEPLOYMENT_ID | 建議必要 | 必要 | 既有 Web App deploymentId（固定原 URL） | AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxxx |

說明：
- Actions 端三個都必填，否則 workflow 會在 Validate required secrets 直接失敗。
- Codespaces 若未提供 CLASP_DEPLOYMENT_ID，deploy 腳本會嘗試從 clasp deployments 推斷；正式環境仍建議明確提供。

---

## 2) 一次設定完成指令（PowerShell）

先在 PowerShell 準備三個變數，然後一次寫入 Actions 與 Codespaces。

```powershell
# ===== 先填入你的值 =====
$REPO = "jacktea88/order-linebot"
$CLASP_SCRIPT_ID = "1xL_OwpsStQlaz2LeaTWff12CRPvBXmUknFxSaYH1iJD9ZlB7VnTZ2Re9"
$CLASP_DEPLOYMENT_ID = "AKfycbxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
$CLASPRC_PATH = "$HOME/.clasprc.json"   # Windows 可改成: $env:USERPROFILE\.clasprc.json

# ===== 前置檢查 =====
if (!(Test-Path $CLASPRC_PATH)) {
  throw "找不到 $CLASPRC_PATH，請先在本機執行 clasp login"
}
$CLASPRC_JSON = Get-Content -Raw $CLASPRC_PATH

# ===== 寫入 GitHub Actions Secrets =====
gh secret set CLASPRC_JSON -b "$CLASPRC_JSON" -R $REPO --app actions
gh secret set CLASP_SCRIPT_ID -b "$CLASP_SCRIPT_ID" -R $REPO --app actions
gh secret set CLASP_DEPLOYMENT_ID -b "$CLASP_DEPLOYMENT_ID" -R $REPO --app actions

# ===== 寫入 Codespaces Secrets（同一組值） =====
gh secret set CLASPRC_JSON -b "$CLASPRC_JSON" -R $REPO --app codespaces
gh secret set CLASP_SCRIPT_ID -b "$CLASP_SCRIPT_ID" -R $REPO --app codespaces
gh secret set CLASP_DEPLOYMENT_ID -b "$CLASP_DEPLOYMENT_ID" -R $REPO --app codespaces

Write-Host "Secrets 已寫入完成（Actions + Codespaces）" -ForegroundColor Green
```

---

## 3) 設定完成後驗證

### 3.1 驗證 Actions 可用

1. 到 GitHub Repo -> Settings -> Secrets and variables -> Actions
2. 確認以下三個名稱存在：
   - CLASPRC_JSON
   - CLASP_SCRIPT_ID
   - CLASP_DEPLOYMENT_ID

### 3.2 驗證 Codespaces 可用

1. 到 GitHub Repo -> Settings -> Secrets and variables -> Codespaces
2. 確認同名三個 Secret 已存在
3. 重建或重開 Codespace 讓新 Secret 注入環境

### 3.3 在 Codespace 測試一鍵部署

```bash
npm ci
npm run deploy:gas
```

---

## 4) 常見失敗與修正

### 問題 A：gh secret set exit code 1

可能原因：
- 未登入 gh
- Token scope 不足
- 對該 repo 無管理 secrets 權限

快速修正：

```powershell
gh auth status
gh auth login
gh auth refresh -h github.com -s repo,read:org,codespace,secrets
```

若仍失敗，請改用 GitHub 網站手動新增（Settings -> Secrets and variables）。

### 問題 B：workflow 顯示 Missing secret

- 檢查 Secret 名稱是否完全一致（大小寫要一致）
- 確認你是設在正確 repo（jacktea88/order-linebot）
- 若剛新增，重新觸發一次 workflow

---

## 5) 建議策略

1. 正式部署：以 Actions 為主。
2. 緊急備援：Codespaces 執行 npm run deploy:gas。
3. Secrets 內容變更（例如重新 clasp login）時，同步更新 Actions 與 Codespaces 兩邊。