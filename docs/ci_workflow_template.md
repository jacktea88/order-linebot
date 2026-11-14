# CI Workflow 範本（對齊手機值班 SOP）

更新日期：2026-11-14

本文件提供可直接套用的 GitHub Actions 範本，對應以下流程：

1. 測試
2. 打包
3. 部署 GAS
4. 異常時手動回滾

建議先搭配文件：

- 手機值班 SOP：docs/mobile_remote_ops_sop.md
- 遠端可行性評估：docs/remote_workspace_assessment.md

---

## 一、建議先準備的 GitHub Secrets

請在 GitHub repository 的 Secrets and variables 設定：

1. CLASPRC_JSON
- 內容為本機可用的 clasp 憑證檔內容（通常是 .clasprc.json 全文）。

2. CLASP_PROJECT_JSON
- 內容為專案根目錄 .clasp.json 全文（至少需 scriptId）。

3. CLASP_DEPLOYMENT_ID
- 既有 Web App deploymentId。

4. 可選：GAS_WEBAPP_URL
- 供 smoke test 或部署紀錄使用。

5. 可選：LINE_SMOKE_TEST_GROUP
- 若未來串接自動化 smoke test 通知可使用。

注意：不要把上述內容 commit 到 repo。

---

## 二、建議目錄

建議新增：

1. .github/workflows/deploy.yml
2. .github/workflows/rollback.yml

---

## 三、Deploy Workflow 範本（deploy.yml）

```yaml
name: Deploy GAS

on:
  push:
    branches:
      - main
  workflow_dispatch:

concurrency:
  group: gas-deploy-main
  cancel-in-progress: false

jobs:
  deploy:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Bundle dist/Code.gs
        run: npm run bundle

      - name: Restore clasp credentials
        shell: bash
        run: |
          echo "$CLASPRC_JSON" > "$HOME/.clasprc.json"
          echo "$CLASP_PROJECT_JSON" > .clasp.json
        env:
          CLASPRC_JSON: ${{ secrets.CLASPRC_JSON }}
          CLASP_PROJECT_JSON: ${{ secrets.CLASP_PROJECT_JSON }}

      - name: Push to Apps Script
        run: npx @google/clasp push -f

      - name: Deploy to existing deployment
        run: |
          npx @google/clasp deploy \
            --deploymentId "$CLASP_DEPLOYMENT_ID" \
            --description "ci ${GITHUB_SHA} $(date -u +%Y-%m-%dT%H:%M:%SZ)"
        env:
          CLASP_DEPLOYMENT_ID: ${{ secrets.CLASP_DEPLOYMENT_ID }}

      - name: Deployment summary
        shell: bash
        run: |
          echo "## Deploy Result" >> $GITHUB_STEP_SUMMARY
          echo "- Branch: ${GITHUB_REF_NAME}" >> $GITHUB_STEP_SUMMARY
          echo "- Commit: ${GITHUB_SHA}" >> $GITHUB_STEP_SUMMARY
          echo "- Status: Success" >> $GITHUB_STEP_SUMMARY
```

---

## 四、Rollback Workflow 範本（rollback.yml）

說明：

- 這裡示範用輸入 commit SHA 的方式回滾。
- 會 checkout 指定 commit 後重新 test、bundle、push、deploy。
- 請確認回滾 commit 是可部署版本。

```yaml
name: Rollback GAS

on:
  workflow_dispatch:
    inputs:
      target_sha:
        description: Commit SHA to rollback to
        required: true
        type: string

concurrency:
  group: gas-rollback
  cancel-in-progress: false

jobs:
  rollback:
    runs-on: ubuntu-latest
    timeout-minutes: 20

    steps:
      - name: Checkout target commit
        uses: actions/checkout@v4
        with:
          ref: ${{ inputs.target_sha }}

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Bundle dist/Code.gs
        run: npm run bundle

      - name: Restore clasp credentials
        shell: bash
        run: |
          echo "$CLASPRC_JSON" > "$HOME/.clasprc.json"
          echo "$CLASP_PROJECT_JSON" > .clasp.json
        env:
          CLASPRC_JSON: ${{ secrets.CLASPRC_JSON }}
          CLASP_PROJECT_JSON: ${{ secrets.CLASP_PROJECT_JSON }}

      - name: Push to Apps Script
        run: npx @google/clasp push -f

      - name: Deploy to existing deployment
        run: |
          npx @google/clasp deploy \
            --deploymentId "$CLASP_DEPLOYMENT_ID" \
            --description "rollback ${INPUT_SHA} $(date -u +%Y-%m-%dT%H:%M:%SZ)"
        env:
          CLASP_DEPLOYMENT_ID: ${{ secrets.CLASP_DEPLOYMENT_ID }}
          INPUT_SHA: ${{ inputs.target_sha }}

      - name: Rollback summary
        shell: bash
        run: |
          echo "## Rollback Result" >> $GITHUB_STEP_SUMMARY
          echo "- Target SHA: ${{ inputs.target_sha }}" >> $GITHUB_STEP_SUMMARY
          echo "- Status: Success" >> $GITHUB_STEP_SUMMARY
```

---

## 五、手機值班對照表（對齊 SOP）

1. 手機看 PR 與 CI
- 對應 Deploy Workflow 的 Run tests / Bundle / Deploy 狀態。

2. 手機觸發部署
- 可用 merge 到 main，或手動執行 Deploy GAS。

3. 手機緊急回滾
- 執行 Rollback GAS，輸入最近穩定版 commit SHA。

4. 手機驗證
- 部署完成後到 LINE 群測試：幫助、菜單、我的訂單。

---

## 六、常見問題

1. Deploy failed: invalid_grant
- 通常是 CLASPRC_JSON 過期，需重新取得憑證並更新 Secret。

2. Deploy failed: Project not found
- 檢查 CLASP_PROJECT_JSON 的 scriptId 是否正確。

3. Deployment ID not found
- 檢查 CLASP_DEPLOYMENT_ID 是否對應現有 Web App deployment。

4. 部署成功但機器人無回應
- 先回滾，再檢查 LINE Webhook 與 GAS Script Properties。

---

## 七、最低落地順序

1. 先上 Deploy GAS workflow。
2. 驗證 1 次 main 部署成功。
3. 再上 Rollback GAS workflow。
4. 用手機演練一次 rollback 流程。
