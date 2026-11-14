# 🚀 中期階段快速參考卡 (special-order 分支)

## 立即需要執行（按順序）

### 1️⃣ 本地 clasp 授權（在你的電腦上）
```bash
npm install -g @google/clasp
clasp login
# 瀏覽器會開啟，完成 Google 授權
```

### 2️⃣ 複製授權文件內容
```bash
# macOS/Linux
cat ~/.config/clasp/.clasprc.json

# Windows
type %APPDATA%\.clasp\credentials.json
```

### 3️⃣ GitHub Secrets 設定
- 位置：倉庫 Settings → Secrets and variables → Actions
- Secret 1: `CLASPRC_JSON` = 上步驟複製的內容
- Secret 2: `CLASP_DEPLOYMENT_ID` = `AKfycbzS5qllaxVkRmU6TFgsNn1f_bwxV7EZTmAao9H9GEHKMt_fdsSw3YMHLnVgYC2zfyCc`

### 4️⃣ 測試部署
```bash
cd /workspaces/order-linebot
echo "# Test" >> README.md
git add README.md
git commit -m "test: CI deployment"
git push origin special-order
```

### 5️⃣ 監看部署
進入 GitHub Actions 查看 "Deploy to GAS (special-order)" 狀態

### 6️⃣ LINE Smoke Test
```
發送指令到 LINE 群組：
✅ 幫助
✅ 菜單
✅ 我的訂單
```

---

## 日常操作流程

```
開發修改 src/ → git add → git commit → git push origin special-order
                                          ↓
                                    自動觸發 CI
                                    npm test ✓
                                    npm bundle ✓
                                    clasp push ✓
                                    clasp deploy ✓
                                          ↓
                                    GitHub Actions 通知
                                          ↓
                                    在 LINE 驗證
```

---

## 快速指令

| 需求 | 指令 |
|------|------|
| 推送代碼並部署 | `git push origin special-order` |
| 手動觸發部署 | GitHub Actions → Deploy workflow → Run workflow |
| 回滾到某版本 | GitHub Actions → Rollback workflow → 輸入 commit SHA |
| 查看部署日誌 | GitHub Actions → 點選最新 workflow run |
| 查看授權狀態 | `clasp list`（本地） |

---

## 常見問題速查

| 問題 | 解決方案 |
|------|--------|
| Deploy failed: `invalid_grant` | 重新執行 `clasp login`，更新 CLASPRC_JSON Secret |
| Deploy failed: `Project not found` | 檢查 .clasp.json 的 scriptId |
| 部署成功但 LINE 無回應 | 檢查 Script Properties 中的 TOKEN 和 SECRET |
| 想更改觸發規則 | 編輯 `.github/workflows/deploy.yml` 的 `on:` 部分 |

---

## 📝 重要檔案位置

- 部署工作流：`.github/workflows/deploy.yml`
- 回滾工作流：`.github/workflows/rollback.yml`
- 本地配置：`.clasp.json`（不上傳，本地只用）
- 詳細指南：`docs/ci_setup_guide_special_order.md`

---

## ⚠️ 不要做的事

❌ 把 .clasprc.json commit 到 repo  
❌ 在聊天室洩露 CLASPRC_JSON 或 Token  
❌ 直接修改 GitHub Secrets（只在指定位置設定）  
❌ 依賴過期的 clasp 授權（定期檢查）

---

**需要更詳細的說明？** 
👉 查看 `docs/ci_setup_guide_special_order.md`
