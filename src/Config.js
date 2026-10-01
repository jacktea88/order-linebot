/**
 * Config.js - Central configuration for LINE Meal Ordering Bot
 * Supports both Google Apps Script (GAS) and Node.js runtime for testing.
 */

var CONFIG = {
  /** LINE Messaging API — Reply to a user's message */
  LINE_REPLY_URL: 'https://api.line.me/v2/bot/message/reply',

  /** LINE Messaging API — Push a message to a user or group */
  LINE_PUSH_URL: 'https://api.line.me/v2/bot/message/push',

  /** LINE Messaging API — Fetch a user's profile (displayName, pictureUrl) */
  LINE_PROFILE_URL: 'https://api.line.me/v2/bot/profile',

  /** LINE Messaging API — Group management (member profile) */
  LINE_GROUP_MEMBER_URL: 'https://api.line.me/v2/bot/group',

  /**
   * Spreadsheet tab names used by the bot's data layer.
   * Each key maps to the literal tab name in the Google Sheet.
   */
  SHEET_NAMES: {
    CONFIG: 'Config',
    WEEKLY_SCHEDULE: 'WeeklySchedule',
    MENU: 'Menu',
    ORDERS: 'Orders',
    SUMMARY: 'Summary',
    CHILDREN: 'Children',
    USER_PREFERENCES: 'UserPreferences',
    SPECIAL_MENU_DATES: 'SpecialMenuDates',
    SPECIAL_MENU_ITEMS: 'SpecialMenuItems'
  },

  /**
   * Default system locale ('zh-TW', 'en', 'ja', 'ko', 'th', 'id', 'vi')
   */
  DEFAULT_LOCALE: 'zh-TW',

  /**
   * Allow individual users to customize their preferred language via menu
   * 'true': Users can switch language; help flex shows language button
   * 'false': Fixed to DEFAULT_LOCALE across the entire system
   */
  ENABLE_USER_LOCALE: 'false',

  /**
   * Allow weekend ordering (Saturday and Sunday)
   * 'true': Members can place orders for Saturday and Sunday
   * 'false': Only Monday to Friday ordering is supported
   */
  ALLOW_WEEKEND_ORDERING: 'false',

  /**
   * Mon to Fri days of week in Chinese
   */
  DAYS_OF_WEEK: ['週一', '週二', '週三', '週四', '週五'],

  /**
   * Order lifecycle status values.
   * OPEN   — Accepting new items (before cutoff)
   * CLOSED — No further changes (after cutoff / summary locked)
   */
  ORDER_STATUS: {
    OPEN: 'OPEN',
    CLOSED: 'CLOSED'
  },

  /**
   * Default daily cutoff time (24-hour clock)
   */
  DEFAULT_CUTOFF_HOUR: 11,
  DEFAULT_CUTOFF_MINUTE: 0,

  /**
   * Default Open Source Repository URL (AGPL-3.0)
   */
  SOURCE_CODE_URL: 'https://tinyurl.com/4c92wtee',

  /**
   * Allow group members to switch organizer when calling '開單'
   * 'true': Anyone calling '開單' becomes the new organizer
   * 'false': Only the existing ORGANIZER_ID can modify or open order
   */
  ALLOW_SWITCH_ORGANIZER: 'true',

  /**
   * User Identifier Storage Mode
   * 'HASHED_ID': One-way HMAC-SHA256 salted hash (e.g. usr_8f9c21b4a7d3e5f0). Default for privacy.
   * 'USER_ID': Raw LINE User ID (e.g. U12345...).
   * 'NICKNAME': User Display Name / Nickname as index. Zero User ID storage.
   */
  USER_IDENTIFIER_MODE: 'HASHED_ID',

  /**
   * Optional custom salt for HASHED_ID mode.
   * If left blank, falls back to CHANNEL_SECRET or default internal salt.
   */
  HASH_SALT: ''
};

/**
 * getConfigProperty — Dynamic property lookup with fallback chain:
 * 1. PropertiesService (GAS)
 * 2. process.env (Node.js)
 * 3. defaultValue
 */
function getConfigProperty(key, defaultValue) {
  // 1. Google Apps Script — PropertiesService
  try {
    if (typeof PropertiesService !== 'undefined') {
      var props = PropertiesService.getScriptProperties();
      var val = props.getProperty(key);
      if (val !== '' && val !== null && val !== undefined) {
        return val;
      }
    }
  } catch (e) {
    // Non-GAS runtime
  }

  // 2. Node.js — process.env
  try {
    if (typeof process !== 'undefined' && process.env) {
      var envVal = process.env[key];
      if (envVal !== undefined && envVal !== '') {
        return envVal;
      }
    }
  } catch (e) {
    // process global unavailable
  }

  // 3. Fallback
  return defaultValue;
}

/**
 * isDevFastMode — Fast-path flag for local testing and development.
 * When enabled, the bot skips slower integration checks such as sheet existence scans
 * and LINE profile lookups so webhook responses feel closer to the final reply path.
 */
function isDevFastMode() {
  return getConfigProperty('DEV_FAST_MODE', 'false') === 'true';
}

/**
 * isDevOrderPreviewMode — Test-only flag for order-related commands.
 * When enabled, order commands return a quick acknowledgement before any order sheet reads/writes.
 */
function isDevOrderPreviewMode() {
  return getConfigProperty('DEV_ORDER_PREVIEW_MODE', 'false') === 'true';
}

/**
 * isDevOrderCacheMode — Short-term cache flag for order query/summary paths.
 * This only makes sense together with DEV_ORDER_PREVIEW_MODE so it stays test-only.
 */
function isDevOrderCacheMode() {
  return getConfigProperty('DEV_ORDER_CACHE_MODE', 'false') === 'true';
}

/**
 * isDevFlexStaticCacheMode — Cache fixed help/menu card text bundles.
 * This only affects static translated strings and does not cache dynamic menu data.
 */
function isDevFlexStaticCacheMode() {
  return getConfigProperty('DEV_FLEX_STATIC_CACHE_MODE', 'false') === 'true';
}

/**
 * _maskScriptPropertyValue — Hide sensitive values while still showing enough context for debugging.
 * @param {string} key
 * @param {string} value
 * @returns {string}
 */
function _maskScriptPropertyValue(key, value) {
  var text = (value === null || value === undefined) ? '' : String(value);
  if (!text) return '';
  if (!key) return text;

  if (/(token|secret|password|passwd|api[_-]?key|hash[_-]?salt|salt)/i.test(String(key))) {
    if (text.length <= 8) {
      return '***';
    }
    return text.slice(0, 4) + '***' + text.slice(-4);
  }

  return text;
}

/**
 * showScriptPropertiesDiagnostics — Log and return script properties for debugging.
 * Sensitive values are masked automatically. When `keys` is omitted, all script properties are shown.
 * @param {Array<string>} [keys]
 * @returns {Object<string,string>}
 */
function showScriptPropertiesDiagnostics(keys) {
  var result = {};
  var props = {};

  try {
    if (typeof PropertiesService !== 'undefined') {
      props = PropertiesService.getScriptProperties().getProperties() || {};
    }
  } catch (e) {
    props = {};
  }

  var targetKeys = (Array.isArray(keys) && keys.length > 0)
    ? keys
    : Object.keys(props);

  if (typeof Logger !== 'undefined') {
    Logger.log('🔎 Script Properties Diagnostics Start');
  }
  if (typeof console !== 'undefined') {
    console.log('🔎 Script Properties Diagnostics Start');
  }

  targetKeys.forEach(function (key) {
    var rawValue = props.hasOwnProperty(key) ? props[key] : getConfigProperty(key, '');
    var maskedValue = _maskScriptPropertyValue(key, rawValue);
    result[key] = maskedValue;

    var line = key + ' = ' + maskedValue;
    if (typeof Logger !== 'undefined') {
      Logger.log(line);
    }
    if (typeof console !== 'undefined') {
      console.log(line);
    }
  });

  if (typeof Logger !== 'undefined') {
    Logger.log('🔎 Script Properties Diagnostics End');
  }
  if (typeof console !== 'undefined') {
    console.log('🔎 Script Properties Diagnostics End');
  }

  return result;
}

// Dual-Environment Export (GAS + Node.js)
(function () {
  var g = (typeof globalThis !== 'undefined') ? globalThis
       : (typeof global   !== 'undefined') ? global
       : (typeof self     !== 'undefined') ? self
       : this;

  g.CONFIG = CONFIG;
  g.getConfigProperty = getConfigProperty;
  g.isDevFastMode = isDevFastMode;
  g.isDevOrderPreviewMode = isDevOrderPreviewMode;
  g.isDevOrderCacheMode = isDevOrderCacheMode;
  g.isDevFlexStaticCacheMode = isDevFlexStaticCacheMode;
  g.showScriptPropertiesDiagnostics = showScriptPropertiesDiagnostics;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      CONFIG: CONFIG,
      getConfigProperty: getConfigProperty,
      isDevFastMode: isDevFastMode,
      isDevOrderPreviewMode: isDevOrderPreviewMode,
      isDevOrderCacheMode: isDevOrderCacheMode,
      isDevFlexStaticCacheMode: isDevFlexStaticCacheMode,
      showScriptPropertiesDiagnostics: showScriptPropertiesDiagnostics
    };
  }
})();
