/**
 * popup.js - Chrome Extension for LINE Meal Ordering Bot Menu Exporter
 * Supports Uber Eats, foodpanda, and 你訂 (Nidin).
 * Features multi-language internationalization (i18n) and Google Sheets formatting.
 */

// Embedded i18n dictionaries for instant in-popup switching and standalone fallback
const I18N_DICTIONARIES = {
  'zh_TW': {
    popupTitle: '便當小幫手 菜單擷取器',
    popupSubtitle: '支援 Uber Eats / foodpanda / 你訂',
    detecting: '檢測中...',
    unsupportedPage: '未支援頁面',
    storeNameLabel: '店家名稱：',
    storeNamePlaceholder: '自動偵測店家名稱...',
    targetDayLabel: '排程星期（可選）：',
    dayUnspecified: '不指定 (ALL)',
    dayMon: '週一',
    dayTue: '週二',
    dayWed: '週三',
    dayThu: '週四',
    dayFri: '週五',
    daySat: '週六',
    daySun: '週日',
    fetchMenuBtn: '🚀 擷取菜單',
    fetchingBtn: '⏳ 擷取中...',
    refetchBtn: '🚀 重新擷取',
    itemsUnit: '道餐點',
    categoriesUnit: '個分類',
    copyMenuTsvBtn: '📋 複製 Menu 格式 (7欄)',
    copyCustomTsvBtn: '📋 複製自訂餐廳格式 (5欄)',
    downloadTsvBtn: '💾 下載 TSV 檔案',
    copyJsonBtn: '📋 複製 JSON',
    tipGuide: '💡 <b>操作指南：</b>點擊「複製 Menu 格式」後，切換至 Google 試算表 <code>Menu</code> 頁籤，點選最下方空白列第一格按 <b>Ctrl+V</b> (或 Cmd+V) 即可一鍵貼上！若使用自訂餐廳工作表，請複製 5 欄格式。',
    previewTitle: '餐點預覽（前 10 筆）：',
    thCategory: '分類',
    thItem: '餐點名稱',
    thPrice: '價格',
    thDescription: '描述',
    unsupportedTitle: '⚠️ 目前頁面非支援的店家菜單網址',
    unsupportedDesc: '請在 Chrome 中開啟以下平台的店家菜單頁面後再點開本套件：',
    successFetch: '✅ 成功抓取！共取得 <b>{count}</b> 道餐點！',
    copySuccessMenu: '📋 <b>已成功複製 {count} 筆 Menu 格式菜單至剪貼簿！</b><br>請前往 Google 試算表【Menu】分頁，點選最下方空白列第一個儲存格按 <b>Ctrl+V</b> (或 Cmd+V) 貼上！',
    copySuccessCustom: '📋 <b>已成功複製 {count} 筆自訂餐廳格式菜單至剪貼簿！</b><br>請前往 Google 試算表自訂餐廳分頁，點選最下方空白列第一個儲存格按 <b>Ctrl+V</b> (或 Cmd+V) 貼上！',
    copySuccessJson: '📋 <b>已成功複製 JSON 格式至剪貼簿！</b>',
    errorFetch: '❌ 擷取失敗：{error}'
  },
  'en': {
    popupTitle: 'Meal Bot Menu Exporter',
    popupSubtitle: 'Supports Uber Eats / foodpanda / Nidin',
    detecting: 'Detecting...',
    unsupportedPage: 'Unsupported Page',
    storeNameLabel: 'Store Name:',
    storeNamePlaceholder: 'Auto-detecting store name...',
    targetDayLabel: 'Schedule Day (Optional):',
    dayUnspecified: 'Unspecified (ALL)',
    dayMon: 'Monday (週一)',
    dayTue: 'Tuesday (週二)',
    dayWed: 'Wednesday (週三)',
    dayThu: 'Thursday (週四)',
    dayFri: 'Friday (週五)',
    daySat: 'Saturday (週六)',
    daySun: 'Sunday (週日)',
    fetchMenuBtn: '🚀 Extract Menu',
    fetchingBtn: '⏳ Extracting...',
    refetchBtn: '🚀 Re-extract',
    itemsUnit: 'items',
    categoriesUnit: 'categories',
    copyMenuTsvBtn: '📋 Copy Menu TSV (7 Cols)',
    copyCustomTsvBtn: '📋 Copy Custom Tab TSV (5 Cols)',
    downloadTsvBtn: '💾 Download TSV File',
    copyJsonBtn: '📋 Copy JSON',
    tipGuide: '💡 <b>Tip:</b> Click "Copy Menu TSV", go to Google Sheets <code>Menu</code> tab, select the first cell of a new row and press <b>Ctrl+V</b> (or Cmd+V) to paste! For custom restaurant tabs, use the 5-column copy button.',
    previewTitle: 'Menu Preview (First 10 items):',
    thCategory: 'Category',
    thItem: 'Item Name',
    thPrice: 'Price',
    thDescription: 'Description',
    unsupportedTitle: '⚠️ Unsupported Page',
    unsupportedDesc: 'Please open a store menu page from the following platforms in Chrome before launching this extension:',
    successFetch: '✅ Successfully extracted <b>{count}</b> items!',
    copySuccessMenu: '📋 <b>Successfully copied {count} items (Menu format) to clipboard!</b><br>Go to Google Sheets [Menu] tab, select the first cell of a new row and press <b>Ctrl+V</b> (or Cmd+V) to paste!',
    copySuccessCustom: '📋 <b>Successfully copied {count} items (Custom restaurant format) to clipboard!</b><br>Go to your custom restaurant tab, select the first cell of a new row and press <b>Ctrl+V</b> (or Cmd+V) to paste!',
    copySuccessJson: '📋 <b>Successfully copied JSON to clipboard!</b>',
    errorFetch: '❌ Extraction failed: {error}'
  },
  'ja': {
    popupTitle: 'メニュー抽出ツール',
    popupSubtitle: 'Uber Eats / foodpanda / Nidin に対応',
    detecting: '検出中...',
    unsupportedPage: '未対応ページ',
    storeNameLabel: '店舗名：',
    storeNamePlaceholder: '店舗名を自動検出...',
    targetDayLabel: 'スケジュール曜日（任意）：',
    dayUnspecified: '指定なし (ALL)',
    dayMon: '月曜日 (週一)',
    dayTue: '火曜日 (週二)',
    dayWed: '水曜日 (週三)',
    dayThu: '木曜日 (週四)',
    dayFri: '金曜日 (週五)',
    daySat: '土曜日 (週六)',
    daySun: '日曜日 (週日)',
    fetchMenuBtn: '🚀 メニューを取得',
    fetchingBtn: '⏳ 取得中...',
    refetchBtn: '🚀 再取得',
    itemsUnit: '品目',
    categoriesUnit: 'カテゴリー',
    copyMenuTsvBtn: '📋 Menu形式コピー (7列)',
    copyCustomTsvBtn: '📋 カスタム店舗形式コピー (5列)',
    downloadTsvBtn: '💾 TSVファイルをダウンロード',
    copyJsonBtn: '📋 JSONコピー',
    tipGuide: '💡 <b>操作ガイド：</b>「Menu形式コピー」をクリック後、Googleスプレッドシートの <code>Menu</code> シートの一番下の空行で <b>Ctrl+V</b> (または Cmd+V) を押すと貼り付けできます！',
    previewTitle: 'メニュープレビュー（上位10件）：',
    thCategory: '分類',
    thItem: 'メニュー名',
    thPrice: '価格',
    thDescription: '説明',
    unsupportedTitle: '⚠️ 未対応のページです',
    unsupportedDesc: 'Chromeで対応プラットフォームの店舗メニューページを開いてから再度お試しください：',
    successFetch: '✅ 取得成功！全 <b>{count}</b> 件のメニューを取得しました！',
    copySuccessMenu: '📋 <b>{count} 件のメニュー（Menu形式）をクリップボードにコピーしました！</b><br>Googleスプレッドシートの【Menu】シートで <b>Ctrl+V</b> (または Cmd+V) で貼り付けてください！',
    copySuccessCustom: '📋 <b>{count} 件のメニュー（カスタム店舗形式）をクリップボードにコピーしました！</b><br>カスタム店舗シートで <b>Ctrl+V</b> (または Cmd+V) で貼り付けてください！',
    copySuccessJson: '📋 <b>JSON形式でクリップボードにコピーしました！</b>',
    errorFetch: '❌ 取得失敗：{error}'
  }
};

let currentLocale = 'zh_TW';
let currentTab = null;
let currentPlatform = null;
let currentStoreData = null;

document.addEventListener('DOMContentLoaded', async () => {
  initLocale();
  initUI();
  await detectActiveTab();
});

/**
 * Initialize locale preference
 */
function initLocale() {
  const savedLocale = localStorage.getItem('menu_exporter_locale');
  if (savedLocale && I18N_DICTIONARIES[savedLocale]) {
    currentLocale = savedLocale;
  } else {
    // Detect from browser UI language
    let uiLang = (chrome.i18n && chrome.i18n.getUILanguage) ? chrome.i18n.getUILanguage() : navigator.language;
    uiLang = uiLang.toLowerCase();
    if (uiLang.startsWith('zh')) {
      currentLocale = 'zh_TW';
    } else if (uiLang.startsWith('ja')) {
      currentLocale = 'ja';
    } else {
      currentLocale = 'en';
    }
  }

  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.value = currentLocale;
    langSelect.addEventListener('change', (e) => {
      setLocale(e.target.value);
    });
  }

  applyTranslations();
}

/**
 * Set and switch active locale
 */
function setLocale(locale) {
  if (!I18N_DICTIONARIES[locale]) return;
  currentLocale = locale;
  localStorage.setItem('menu_exporter_locale', locale);
  applyTranslations();
  if (currentStoreData) {
    renderResults(currentStoreData);
  }
  if (!currentPlatform) {
    showUnsupported();
  }
}

/**
 * Translate message key
 */
function t(key, placeholders = {}) {
  // First check active in-memory dictionary
  let text = (I18N_DICTIONARIES[currentLocale] && I18N_DICTIONARIES[currentLocale][key]) ||
             (I18N_DICTIONARIES['zh_TW'][key]) || key;

  // Substitute placeholders e.g. {count}, {error}
  for (const [k, v] of Object.entries(placeholders)) {
    text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return text;
}

/**
 * Apply translations to DOM elements
 */
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.innerHTML = t(key);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.placeholder = t(key);
  });
}

/**
 * Initialize event listeners
 */
function initUI() {
  document.getElementById('fetchBtn').addEventListener('click', handleFetchMenu);
  document.getElementById('copyMenuTsvBtn').addEventListener('click', handleCopyMenuTsv);
  document.getElementById('copyCustomTsvBtn').addEventListener('click', handleCopyCustomTsv);
  document.getElementById('downloadTsvBtn').addEventListener('click', handleDownloadTsv);
  document.getElementById('copyJsonBtn').addEventListener('click', handleCopyJson);
}

function showAlert(msg, type = 'info') {
  const el = document.getElementById('statusAlert');
  el.className = `alert alert-${type}`;
  el.innerHTML = msg;
  el.classList.remove('hidden');
}

function hideAlert() {
  document.getElementById('statusAlert').classList.add('hidden');
}

/**
 * Detect the active Chrome tab and identify platform
 */
async function detectActiveTab() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) {
      showUnsupported();
      return;
    }
    currentTab = tab;
    const url = tab.url;

    // 1. Uber Eats
    if (/ubereats\.com\/(?:[a-zA-Z-]+\/)?store\/([^/?#]+)\/([a-zA-Z0-9_-]+)/i.test(url)) {
      currentPlatform = 'ubereats';
      setPlatformBadge('Uber Eats', 'badge-uber');
      const match = url.match(/store\/([^/?#]+)\/([a-zA-Z0-9_-]+)/i);
      if (match) {
        document.getElementById('storeNameInput').value = decodeSlug(match[1]);
      }
      return;
    }

    // 2. foodpanda
    if (/foodpanda\.com(?:\.[a-z]{2})?\/restaurant\/([^/?#]+)/i.test(url)) {
      currentPlatform = 'foodpanda';
      setPlatformBadge('foodpanda', 'badge-foodpanda');
      const match = url.match(/\/restaurant\/([^/?#]+)(?:\/([^/?#]+))?/i);
      if (match && match[2]) {
        document.getElementById('storeNameInput').value = decodeSlug(match[2]);
      } else if (match && match[1]) {
        document.getElementById('storeNameInput').value = match[1];
      }
      return;
    }

    // 3. 你訂 (Nidin)
    if (/nidin\.shop\/(?:(?:gb|order|v1|voucher)\/)?menu\/([0-9]+)/i.test(url)) {
      currentPlatform = 'nidin';
      setPlatformBadge('你訂 (Nidin)', 'badge-nidin');
      document.getElementById('storeNameInput').value = '你訂店家';
      return;
    }

    showUnsupported();
  } catch (e) {
    showUnsupported();
  }
}

function setPlatformBadge(name, className) {
  const badge = document.getElementById('platformBadge');
  badge.textContent = name;
  badge.className = `badge ${className}`;
}

function showUnsupported() {
  currentPlatform = null;
  setPlatformBadge(t('unsupportedPage'), 'badge-gray');
  document.getElementById('unsupportedSection').classList.remove('hidden');
  document.getElementById('fetchBtn').disabled = true;
}

function decodeSlug(slug) {
  if (!slug) return '';
  try {
    const decoded = decodeURIComponent(slug);
    if (/^[a-zA-Z0-9_-]+$/.test(slug)) {
      return decoded.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).trim();
    }
    return decoded.replace(/[-_]+/g, ' ').trim();
  } catch (e) {
    return slug.replace(/[-_]+/g, ' ').trim();
  }
}

/**
 * Handle fetch menu action
 */
async function handleFetchMenu() {
  if (!currentPlatform || !currentTab) return;

  const btn = document.getElementById('fetchBtn');
  const btnText = document.getElementById('fetchBtnText');
  btn.disabled = true;
  btnText.textContent = t('fetchingBtn');
  hideAlert();

  try {
    // Execute extraction script inside the active tab
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: inTabScraper,
      args: [currentPlatform, currentTab.url]
    });

    if (!result || !result.result || !result.result.success) {
      const err = (result && result.result && result.result.error) || '未知錯誤';
      showAlert(t('errorFetch', { error: err }), 'error');
      btn.disabled = false;
      btnText.textContent = t('refetchBtn');
      return;
    }

    currentStoreData = result.result;
    if (currentStoreData.storeName && !document.getElementById('storeNameInput').value) {
      document.getElementById('storeNameInput').value = currentStoreData.storeName;
    } else if (currentStoreData.storeName) {
      document.getElementById('storeNameInput').value = currentStoreData.storeName;
    }

    renderResults(currentStoreData);
    showAlert(t('successFetch', { count: currentStoreData.items.length }), 'success');
  } catch (err) {
    showAlert(t('errorFetch', { error: err.message }), 'error');
  } finally {
    btn.disabled = false;
    btnText.textContent = t('refetchBtn');
  }
}

/**
 * Render preview table and counts
 */
function renderResults(data) {
  document.getElementById('itemCount').textContent = data.items.length;

  const categories = [...new Set(data.items.map(i => i.category))];
  document.getElementById('categoryCount').textContent = categories.length;

  const tbody = document.getElementById('previewTbody');
  tbody.innerHTML = '';

  const previewItems = data.items.slice(0, 10);
  previewItems.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(item.category)}</td>
      <td><b>${escapeHtml(item.itemName)}</b></td>
      <td>$${item.price}</td>
      <td title="${escapeHtml(item.description || '')}">${escapeHtml((item.description || '').slice(0, 20))}</td>
    `;
    tbody.appendChild(tr);
  });

  const previewInfo = document.getElementById('previewInfo');
  previewInfo.textContent = data.items.length > 10 ? `(${data.items.length} ${t('itemsUnit')})` : '';

  document.getElementById('resultsSection').classList.remove('hidden');
}

/**
 * Copy TSV for Google Sheets [Menu] tab (7 Columns):
 * DayOfWeek \t RestaurantName \t Category \t ItemName \t Price \t IsAvailable \t Description
 */
async function handleCopyMenuTsv() {
  if (!currentStoreData || !currentStoreData.items) return;

  const storeName = document.getElementById('storeNameInput').value.trim() || currentStoreData.storeName || '店家菜單';
  const targetDay = document.getElementById('targetDaySelect').value.trim() || 'ALL';

  const tsvLines = currentStoreData.items.map(item => {
    return [
      targetDay,
      storeName,
      item.category,
      item.itemName,
      item.price,
      'TRUE',
      item.description || ''
    ].join('\t');
  });

  const tsvText = tsvLines.join('\n');
  await navigator.clipboard.writeText(tsvText);

  showAlert(t('copySuccessMenu', { count: currentStoreData.items.length }), 'success');
}

/**
 * Copy TSV for Custom Restaurant tab (5 Columns):
 * Category \t ItemName \t Price \t IsAvailable \t Description
 */
async function handleCopyCustomTsv() {
  if (!currentStoreData || !currentStoreData.items) return;

  const tsvLines = currentStoreData.items.map(item => {
    return [
      item.category,
      item.itemName,
      item.price,
      'TRUE',
      item.description || ''
    ].join('\t');
  });

  const tsvText = tsvLines.join('\n');
  await navigator.clipboard.writeText(tsvText);

  showAlert(t('copySuccessCustom', { count: currentStoreData.items.length }), 'success');
}

/**
 * Download TSV file (7 columns with header, UTF-8 BOM for Excel/Sheets)
 */
function handleDownloadTsv() {
  if (!currentStoreData || !currentStoreData.items) return;

  const storeName = document.getElementById('storeNameInput').value.trim() || currentStoreData.storeName || '店家菜單';
  const targetDay = document.getElementById('targetDaySelect').value.trim() || 'ALL';
  const header = ['DayOfWeek', 'RestaurantName', 'Category', 'ItemName', 'Price', 'IsAvailable', 'Description'].join('\t');
  const tsvLines = currentStoreData.items.map(item => {
    return [
      targetDay,
      storeName,
      item.category,
      item.itemName,
      item.price,
      'TRUE',
      item.description || ''
    ].join('\t');
  });

  // Include UTF-8 BOM for correct Excel/Sheets Chinese display
  const content = '\uFEFF' + header + '\n' + tsvLines.join('\n');
  const blob = new Blob([content], { type: 'text/tab-separated-values;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${storeName}_Menu.tsv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Copy JSON to clipboard
 */
async function handleCopyJson() {
  if (!currentStoreData || !currentStoreData.items) return;
  const storeName = document.getElementById('storeNameInput').value.trim() || currentStoreData.storeName || '店家菜單';
  const targetDay = document.getElementById('targetDaySelect').value.trim() || 'ALL';
  const payload = {
    restaurantName: storeName,
    dayOfWeek: targetDay,
    itemsCount: currentStoreData.items.length,
    items: currentStoreData.items
  };
  await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
  showAlert(t('copySuccessJson'), 'success');
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * In-tab scraper injected directly into the active browser page
 * Runs inside the user's authentic session context with cookies and headers intact.
 */
async function inTabScraper(platform, pageUrl) {
  function base64ToUuid(b64) {
    if (!b64 || b64.length < 20) return b64;
    try {
      let cleanB64 = b64.replace(/-/g, '+').replace(/_/g, '/');
      while (cleanB64.length % 4 !== 0) cleanB64 += '=';
      const binary = atob(cleanB64);
      let hex = '';
      for (let i = 0; i < binary.length; i++) {
        const h = binary.charCodeAt(i).toString(16).padStart(2, '0');
        hex += h;
      }
      if (hex.length >= 32) {
        return `${hex.substr(0,8)}-${hex.substr(8,4)}-${hex.substr(12,4)}-${hex.substr(16,4)}-${hex.substr(20,12)}`.toLowerCase();
      }
    } catch (e) {}
    return b64;
  }

  try {
    // 1. Uber Eats scraper
    if (platform === 'ubereats') {
      const match = pageUrl.match(/store\/([^/?#]+)\/([a-zA-Z0-9_-]+)/i);
      if (!match) throw new Error('無法從 Uber Eats 網址識別店家代號');

      const rawStoreId = match[2];
      const storeUuid = base64ToUuid(rawStoreId);

      // Call same-origin internal API
      const res = await fetch('/_p/api/getStoreV1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeUuid: storeUuid })
      });

      if (!res.ok) {
        throw new Error(`Uber Eats API 回應錯誤 HTTP ${res.status}`);
      }

      const json = await res.json();
      const storeData = json.data || {};
      const storeTitle = storeData.title || document.title.replace(/\s*\|.*$/, '').trim();

      const catalogSectionsMap = storeData.catalogSectionsMap || {};
      const items = [];

      for (const catId of Object.keys(catalogSectionsMap)) {
        const sectionList = catalogSectionsMap[catId] || [];
        for (const sec of sectionList) {
          const catName = (sec.payload && sec.payload.standardItemsPayload && sec.payload.standardItemsPayload.title && sec.payload.standardItemsPayload.title.text) || '一般';
          const itemList = (sec.payload && sec.payload.standardItemsPayload && sec.payload.standardItemsPayload.catalogItems) || [];

          for (const item of itemList) {
            const title = (item.title || '').trim();
            if (!title) continue;
            let price = 0;
            if (typeof item.price === 'number') {
              price = item.price > 1000 ? Math.round(item.price / 100) : item.price;
            }
            const desc = (item.itemDescription || '').replace(/[\r\n\t]+/g, ' ').trim();

            items.push({
              category: catName,
              itemName: title,
              price: price,
              description: desc
            });
          }
        }
      }

      // Fallback to DOM card extraction if API returned empty
      if (items.length === 0) {
        const itemElements = document.querySelectorAll('li[data-testid="store-item"]');
        itemElements.forEach(el => {
          const nameEl = el.querySelector('span[data-testid="rich-text"]');
          const itemName = nameEl ? nameEl.textContent.trim() : '';
          const textContent = el.textContent || '';
          const priceMatch = textContent.match(/\$([0-9,]+)/);
          const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, ''), 10) : 0;
          if (itemName) {
            items.push({
              category: '精選餐點',
              itemName: itemName,
              price: price,
              description: ''
            });
          }
        });
      }

      if (items.length === 0) throw new Error('未能取得任何餐點品項');

      return {
        success: true,
        platform: 'ubereats',
        storeName: storeTitle,
        items: items
      };
    }

    // 2. foodpanda scraper
    if (platform === 'foodpanda') {
      const match = pageUrl.match(/\/restaurant\/([^/?#]+)(?:\/([^/?#]+))?/i);
      if (!match) throw new Error('無法從網址解析 foodpanda 店家代碼');

      const vendorCode = match[1];
      const apiUrl = `https://tw.fd-api.com/api/v5/vendors/${vendorCode}?include=menus`;
      const res = await fetch(apiUrl, {
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) throw new Error(`foodpanda API 回應錯誤 HTTP ${res.status}`);

      const json = await res.json();
      const vendor = (json.data && json.data.vendor) || json.data || {};
      const storeName = vendor.name || document.title.replace(/\s*\|.*$/, '').trim();

      const menus = vendor.menus || [];
      const items = [];

      for (const menu of menus) {
        const menuCats = menu.menu_categories || [];
        for (const cat of menuCats) {
          const catName = cat.name || '一般';
          const products = cat.products || [];
          for (const prod of products) {
            const name = (prod.name || '').trim();
            if (!name) continue;
            let price = 0;
            if (prod.product_variations && prod.product_variations.length > 0) {
              price = Math.round(prod.product_variations[0].price || 0);
            }
            const desc = (prod.description || '').replace(/[\r\n\t]+/g, ' ').trim();

            items.push({
              category: catName,
              itemName: name,
              price: price,
              description: desc
            });
          }
        }
      }

      if (items.length === 0) throw new Error('未能取得任何餐點品項');

      return {
        success: true,
        platform: 'foodpanda',
        storeName: storeName,
        items: items
      };
    }

    // 3. 你訂 (Nidin) scraper
    if (platform === 'nidin') {
      const match = pageUrl.match(/nidin\.shop\/(?:(?:gb|order|v1|voucher)\/)?menu\/([0-9]+)/i);
      if (!match) throw new Error('無法從網址解析你訂 (Nidin) 門市代碼');

      const storeId = match[1];
      const infoRes = await fetch(`/store/${storeId}/info`, {
        headers: { 'Accept': 'application/json' }
      });
      let storeName = '你訂店家';
      if (infoRes.ok) {
        const infoData = await infoRes.json();
        const brand = (infoData.data && (infoData.data.brand_name || infoData.data.brand_title)) || '';
        const store = (infoData.data && (infoData.data.store_name || infoData.data.title)) || '';
        if (brand || store) {
          storeName = `${brand} ${store}`.trim();
        }
      }

      const menuRes = await fetch(`/store/${storeId}/onShelfMenu`, {
        headers: { 'Accept': 'application/json' }
      });
      if (!menuRes.ok) throw new Error(`你訂 API 回應 HTTP ${menuRes.status}`);

      const menuData = await menuRes.json();
      const menuList = menuData.data || [];
      const items = [];

      for (const cat of menuList) {
        const catName = cat.title || cat.name || '一般';
        const prodList = cat.items || cat.products || [];
        for (const prod of prodList) {
          const name = (prod.title || prod.name || '').trim();
          if (!name) continue;
          let price = parseInt(prod.price || 0, 10);
          if (price === 0 && prod.combine_list_json) {
            try {
              const combos = typeof prod.combine_list_json === 'string' ? JSON.parse(prod.combine_list_json) : prod.combine_list_json;
              if (Array.isArray(combos) && combos.length > 0 && combos[0].price) {
                price = parseInt(combos[0].price, 10);
              }
            } catch (e) {}
          }
          const desc = (prod.description || prod.detail || '').replace(/[\r\n\t]+/g, ' ').trim();

          items.push({
            category: catName,
            itemName: name,
            price: price,
            description: desc
          });
        }
      }

      if (items.length === 0) throw new Error('未能取得任何餐點品項');

      return {
        success: true,
        platform: 'nidin',
        storeName: storeName,
        items: items
      };
    }

    throw new Error('未支援的點餐平台');
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
}
