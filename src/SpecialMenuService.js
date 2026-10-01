/**
 * SpecialMenuService.js - Special-date menus with per-item quantity limits and a pre-order cutoff.
 * Orders are stored in the Orders tab (DayOfWeek = '特餐', Date = event date); see SheetService.
 * Compatible with Google Apps Script (GAS) and Node.js testing.
 */

var SpecialSheet = null;
var SpecialFlex = null;
var SpecialI18n = null;

(function () {
  var g = (typeof globalThis !== 'undefined') ? globalThis
       : (typeof global   !== 'undefined') ? global
       : (typeof self     !== 'undefined') ? self
       : null;

  if (g && g.getSpecialDates && g.createSpecialMenuFlex && g.t) {
    SpecialSheet = g;
    SpecialFlex = g;
    SpecialI18n = g;
  } else {
    try {
      SpecialSheet = require('./SheetService.js');
      SpecialFlex = require('./FlexMessage.js');
      SpecialI18n = require('./I18n.js');
    } catch (e) {
      // Fallback
    }
  }
})();

var SPECIAL_MENU_PAGE_SIZE = 20;
var SPECIAL_DATE_PATTERN = '(\\d{4}[\\-/.]\\d{1,2}[\\-/.]\\d{1,2}|\\d{1,2}[\\-/.]\\d{1,2}|\\d{1,2}月\\d{1,2}[日號号]?)(?=\\s|$)';

/* ------------------------------------------------------------------ *
 * Date / cutoff helpers
 * ------------------------------------------------------------------ */

function _specialPad(n) {
  return (n < 10 ? '0' : '') + n;
}

/**
 * Current date and minute in the spreadsheet timezone.
 * @returns {{date: string, dateTime: string}} 'yyyy-MM-dd' and 'yyyy-MM-dd HH:mm'
 */
function _specialNow(refDate) {
  var d = refDate || (typeof globalThis !== 'undefined' && globalThis._mockCurrentDate) || new Date();
  var tz = SpecialSheet.getSpreadsheetTimeZone();
  var dateStr = '';
  var timeStr = '';
  if (typeof Utilities !== 'undefined' && Utilities.formatDate) {
    try {
      dateStr = Utilities.formatDate(d, tz, 'yyyy-MM-dd');
      timeStr = Utilities.formatDate(d, tz, 'HH:mm');
    } catch (e) {}
  }
  if (!dateStr) {
    var parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(d);
    var pm = {};
    parts.forEach(function (p) { pm[p.type] = p.value; });
    dateStr = pm.year + '-' + pm.month + '-' + pm.day;
    timeStr = pm.hour + ':' + pm.minute;
  }
  return { date: dateStr, dateTime: dateStr + ' ' + timeStr };
}

function _specialAddDays(dateStr, days) {
  var p = dateStr.split('-');
  var ms = Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)) + days * 86400000;
  return new Date(ms).toISOString().slice(0, 10);
}

function _specialWeekday(dateStr) {
  var p = dateStr.split('-');
  var idx = new Date(Date.UTC(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10))).getUTCDay();
  return ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][idx];
}

function _specialDateLabel(dateStr) {
  return dateStr + ' (' + _specialWeekday(dateStr) + ')';
}

/**
 * Parse a date typed by a user: YYYY-MM-DD, YYYY/M/D, M/D, M-D or M月D日.
 * Dates without a year resolve to the next occurrence on or after today.
 * @returns {string|null} 'yyyy-MM-dd' or null when invalid
 */
function parseSpecialDate(str, refDate) {
  var s = String(str || '').trim();
  var m = s.match(/^(\d{4})[\-\/.](\d{1,2})[\-\/.](\d{1,2})$/);
  var y, mo, d;
  if (m) {
    y = parseInt(m[1], 10); mo = parseInt(m[2], 10); d = parseInt(m[3], 10);
  } else {
    m = s.match(/^(\d{1,2})[\-\/.](\d{1,2})$/) || s.match(/^(\d{1,2})月(\d{1,2})[日號号]?$/);
    if (!m) return null;
    mo = parseInt(m[1], 10); d = parseInt(m[2], 10);
    var today = _specialNow(refDate).date;
    y = parseInt(today.slice(0, 4), 10);
    if (y + '-' + _specialPad(mo) + '-' + _specialPad(d) < today) y++;
  }
  var dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return y + '-' + _specialPad(mo) + '-' + _specialPad(d);
}

/**
 * Parse 'YYYY-MM-DD HH:mm' (also M/D HH:mm) into normalized 'yyyy-MM-dd HH:mm'.
 * @returns {string|null}
 */
function _specialParseCutoffInput(dateToken, timeToken, refDate) {
  var date = parseSpecialDate(dateToken, refDate);
  var tm = String(timeToken || '').match(/^(\d{1,2}):(\d{2})$/);
  if (!date || !tm) return null;
  var hh = parseInt(tm[1], 10);
  var mi = parseInt(tm[2], 10);
  if (hh > 23 || mi > 59) return null;
  return date + ' ' + _specialPad(hh) + ':' + _specialPad(mi);
}

/**
 * Default cutoff: event date minus SPECIAL_MENU_LEAD_DAYS at SPECIAL_MENU_CUTOFF_TIME.
 * @returns {string} 'yyyy-MM-dd HH:mm'
 */
function getSpecialDefaultCutoffAt(eventDate) {
  var lead = parseInt(SpecialSheet.getConfigValue('SPECIAL_MENU_LEAD_DAYS', '14'), 10);
  if (isNaN(lead) || lead < 0) lead = 14;
  var timeCfg = String(SpecialSheet.getConfigValue('SPECIAL_MENU_CUTOFF_TIME', '23:59') || '').trim();
  var tm = timeCfg.match(/^(\d{1,2}):(\d{2})$/);
  var time = (tm && parseInt(tm[1], 10) <= 23 && parseInt(tm[2], 10) <= 59)
    ? _specialPad(parseInt(tm[1], 10)) + ':' + tm[2]
    : '23:59';
  return _specialAddDays(eventDate, -lead) + ' ' + time;
}

/**
 * Effective cutoff: the date's own CutoffAt when valid, otherwise the default.
 * @param {string} eventDate
 * @param {{cutoffAt?: string}} [dateRec]
 */
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

/* ------------------------------------------------------------------ *
 * Message helpers
 * ------------------------------------------------------------------ */

function _spT(ctx, key, params) {
  return SpecialI18n.t(key, params, ctx.locale);
}

function _spPrefix(key) {
  return SpecialI18n.buildCommandPrefixPattern(key);
}

function _specialUsage(ctx) {
  return _spT(ctx, 'special.usage');
}

function _specialFindDate(eventDate) {
  var rec = SpecialSheet.getSpecialDate(eventDate);
  return (rec && rec.isActive) ? rec : null;
}

function _specialStatusLine(ctx, eventDate, rec) {
  var closed = isSpecialOrderingClosed(eventDate, rec, ctx.refDate);
  return _spT(ctx, 'special.cutoff_line', {
    cutoff: getSpecialCutoffAt(eventDate, rec),
    status: _spT(ctx, closed ? 'special.status_closed' : 'special.status_open')
  });
}

/**
 * Resolve an ordered item name against the menu: exact match first, then a single partial match.
 * @returns {{item: Object|null, candidates: Array<string>}}
 */
function _specialMatchItem(rawName, items) {
  var name = String(rawName || '').trim();
  var i;
  for (i = 0; i < items.length; i++) {
    if (items[i].itemName === name) return { item: items[i], candidates: [] };
  }
  var partial = items.filter(function (it) {
    return name && (it.itemName.indexOf(name) !== -1 || name.indexOf(it.itemName) !== -1);
  });
  if (partial.length === 1) return { item: partial[0], candidates: [] };
  return { item: null, candidates: partial.map(function (it) { return it.itemName; }) };
}

/* ------------------------------------------------------------------ *
 * Command handlers — each returns { text } or { altText, flex }
 * ------------------------------------------------------------------ */

function _specialListDates(ctx) {
  var today = _specialNow(ctx.refDate).date;
  var dates = SpecialSheet.getSpecialDates().filter(function (d) {
    return d.isActive && d.eventDate >= today;
  }).map(function (d) {
    return {
      eventDate: d.eventDate,
      weekday: _specialWeekday(d.eventDate),
      title: d.title,
      cutoffAt: getSpecialCutoffAt(d.eventDate, d),
      closed: isSpecialOrderingClosed(d.eventDate, d, ctx.refDate)
    };
  });
  if (dates.length === 0) {
    return { text: _spT(ctx, 'special.list_empty') };
  }
  return {
    altText: _spT(ctx, 'special.title_list'),
    flex: SpecialFlex.createSpecialDateListFlex(dates, ctx.locale)
  };
}

function _specialShowMenu(ctx, eventDate, page) {
  var rec = _specialFindDate(eventDate);
  if (!rec) return { text: _spT(ctx, 'special.err_not_found', { date: eventDate }) };
  var items = SpecialSheet.getSpecialItems(eventDate);
  var sold = SpecialSheet.getSpecialSoldMap(eventDate);
  var info = {
    eventDate: eventDate,
    weekday: _specialWeekday(eventDate),
    title: rec.title,
    cutoffAt: getSpecialCutoffAt(eventDate, rec),
    closed: isSpecialOrderingClosed(eventDate, rec, ctx.refDate)
  };
  return {
    altText: _spT(ctx, 'special.alt_menu', { date: eventDate }),
    flex: SpecialFlex.createSpecialMenuFlex(info, items, sold, ctx.locale, page, SPECIAL_MENU_PAGE_SIZE)
  };
}

function _specialPlaceOrder(ctx, eventDate, rest) {
  var rec = _specialFindDate(eventDate);
  if (!rec) return { text: _spT(ctx, 'special.err_not_found', { date: eventDate }) };
  if (isSpecialOrderingClosed(eventDate, rec, ctx.refDate)) {
    return { text: _spT(ctx, 'special.err_closed', { date: eventDate, cutoff: getSpecialCutoffAt(eventDate, rec) }) };
  }

  var parsed = ctx.parseOrderText(rest).filter(function (oi) { return !oi.dayOfWeek; });
  if (parsed.length === 0) return { text: _specialUsage(ctx) };

  var kids = SpecialSheet.getChildren ? SpecialSheet.getChildren(ctx.userId, ctx.userName, ctx.userName) : [];
  var soleKid = (kids && kids.length === 1) ? kids[0] : '';
  var menu = SpecialSheet.getSpecialItems(eventDate);
  var okLines = [];
  var failLines = [];
  var total = 0;

  parsed.forEach(function (oi) {
    var match = _specialMatchItem(oi.itemName, menu);
    if (!match.item) {
      failLines.push(match.candidates.length > 1
        ? _spT(ctx, 'special.fail_ambiguous', { item: oi.itemName, options: match.candidates.join('、') })
        : _spT(ctx, 'special.fail_no_item', { item: oi.itemName }));
      return;
    }
    var res = SpecialSheet.addSpecialOrder({
      eventDate: eventDate,
      itemName: match.item.itemName,
      quantity: oi.quantity,
      groupId: ctx.groupId,
      userId: ctx.userId,
      userName: ctx.userName,
      userNickname: ctx.userName,
      childName: oi.childName || soleKid
    });
    if (!res.ok) {
      var key = res.reason === 'SOLD_OUT' ? 'special.fail_sold_out'
        : res.reason === 'EXCEEDS' ? 'special.fail_exceeds'
        : 'special.fail_busy';
      failLines.push(_spT(ctx, key, { item: match.item.itemName, left: res.remaining }));
      return;
    }
    var r = res.record;
    total += r.subtotal;
    var kidTag = r.childName ? ' [' + r.childName + ']' : '';
    var leftTag = res.remaining !== null ? _spT(ctx, 'special.left_suffix', { left: res.remaining }) : '';
    okLines.push('• ' + r.itemName + kidTag + ' x' + r.quantity + ' ($' + r.subtotal + ')' + leftTag);
  });

  var lines = [];
  if (okLines.length > 0) {
    lines.push(_spT(ctx, 'special.order_ok', { date: _specialDateLabel(eventDate) }));
    lines = lines.concat(okLines);
    lines.push(_spT(ctx, 'special.order_total', { amount: total }));
    lines.push(_specialStatusLine(ctx, eventDate, rec));
    if (ctx.notify) {
      ctx.notify(_spT(ctx, 'special.notify_order', {
        user: ctx.userName, date: _specialDateLabel(eventDate), items: okLines.join('\n'), amount: total
      }));
    }
  }
  failLines.forEach(function (l) { lines.push(l); });
  return { text: lines.join('\n') };
}

function _specialAdd(ctx, eventDate, title) {
  if (!ctx.hasOrganizer) return { text: _spT(ctx, 'special.err_no_organizer') };
  if (!ctx.isOrganizer) return { text: _spT(ctx, 'special.err_organizer_only') };
  if (eventDate < _specialNow(ctx.refDate).date) return { text: _spT(ctx, 'special.err_past_date', { date: eventDate }) };

  var fields = { isActive: true };
  if (title) fields.title = title;
  SpecialSheet.saveSpecialDate(eventDate, fields);
  var rec = SpecialSheet.getSpecialDate(eventDate);
  return {
    text: _spT(ctx, 'special.add_ok', { date: _specialDateLabel(eventDate) }) + '\n' +
      _specialStatusLine(ctx, eventDate, rec) + '\n' +
      _spT(ctx, 'special.add_next')
  };
}

function _specialItem(ctx, eventDate, rest) {
  if (!ctx.hasOrganizer) return { text: _spT(ctx, 'special.err_no_organizer') };
  if (!ctx.isOrganizer) return { text: _spT(ctx, 'special.err_organizer_only') };
  if (!_specialFindDate(eventDate)) return { text: _spT(ctx, 'special.err_not_found', { date: eventDate }) };

  var m = String(rest || '').match(/^(.+?)\s+(\d+)(?:\s+(\d+))?$/);
  if (!m) return { text: _spT(ctx, 'special.usage_item') };
  var name = m[1].trim();
  var price = parseInt(m[2], 10);
  var limit = m[3] !== undefined ? parseInt(m[3], 10) : 0;
  SpecialSheet.saveSpecialItem(eventDate, name, price, limit);

  var sold = SpecialSheet.getSpecialSoldMap(eventDate)[name] || 0;
  return {
    text: _spT(ctx, 'special.item_ok', {
      date: eventDate,
      item: name,
      price: price,
      limit: limit > 0 ? _spT(ctx, 'special.limit_n', { n: limit }) : _spT(ctx, 'special.unlimited'),
      sold: sold
    })
  };
}

function _specialCutoff(ctx, eventDate, rest) {
  var rec = _specialFindDate(eventDate);
  if (!rec) return { text: _spT(ctx, 'special.err_not_found', { date: eventDate }) };

  var arg = String(rest || '').trim();
  if (!arg) {
    return { text: _spT(ctx, 'special.cutoff_show', { date: _specialDateLabel(eventDate) }) + '\n' + _specialStatusLine(ctx, eventDate, rec) };
  }
  if (!ctx.hasOrganizer) return { text: _spT(ctx, 'special.err_no_organizer') };
  if (!ctx.isOrganizer) return { text: _spT(ctx, 'special.err_organizer_only') };

  if (/^(預設|重設|default|reset)$/i.test(arg)) {
    SpecialSheet.saveSpecialDate(eventDate, { cutoffAt: '' });
  } else {
    var tokens = arg.split(/\s+/);
    var cutoff = tokens.length === 2 ? _specialParseCutoffInput(tokens[0], tokens[1], ctx.refDate) : null;
    if (!cutoff) return { text: _spT(ctx, 'special.usage_cutoff') };
    if (cutoff.slice(0, 10) > eventDate) {
      return { text: _spT(ctx, 'special.err_cutoff_after_event', { date: eventDate }) };
    }
    SpecialSheet.saveSpecialDate(eventDate, { cutoffAt: cutoff });
  }
  rec = SpecialSheet.getSpecialDate(eventDate);
  return { text: _spT(ctx, 'special.cutoff_ok', { date: _specialDateLabel(eventDate) }) + '\n' + _specialStatusLine(ctx, eventDate, rec) };
}

function _specialMyOrders(ctx) {
  var orders = SpecialSheet.getUserOrders(ctx.userId, ctx.groupId, null, SpecialSheet.SPECIAL_DAY_MARKER, ctx.userName);
  if (!orders || orders.length === 0) return { text: _spT(ctx, 'special.my_empty') };

  orders.sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
  var lines = [_spT(ctx, 'special.my_title')];
  var lastDate = '';
  var total = 0;
  orders.forEach(function (o) {
    if (o.date !== lastDate) {
      lastDate = o.date;
      var rec = SpecialSheet.getSpecialDate(o.date);
      lines.push('');
      lines.push('📅 ' + _specialDateLabel(o.date) + ' ' + _spT(ctx, isSpecialOrderingClosed(o.date, rec, ctx.refDate) ? 'special.status_closed' : 'special.status_open'));
    }
    var kidTag = o.childName ? ' [' + o.childName + ']' : '';
    lines.push('  • ' + o.itemName + kidTag + ' x' + o.quantity + ' ($' + o.subtotal + ')');
    total += Number(o.subtotal) || 0;
  });
  lines.push('');
  lines.push(_spT(ctx, 'special.order_total', { amount: total }));
  return { text: lines.join('\n') };
}

function _specialCancel(ctx, eventDate, itemArg) {
  if (!eventDate || !itemArg) {
    var mine = _specialMyOrders(ctx);
    return { text: mine.text + '\n\n' + _spT(ctx, 'special.usage_cancel') };
  }
  var rec = _specialFindDate(eventDate);
  if (!rec) return { text: _spT(ctx, 'special.err_not_found', { date: eventDate }) };
  if (isSpecialOrderingClosed(eventDate, rec, ctx.refDate)) {
    return { text: _spT(ctx, 'special.err_cancel_closed', { date: eventDate, cutoff: getSpecialCutoffAt(eventDate, rec) }) };
  }
  var all = /^(全部|all)$/i.test(itemArg.trim());
  var count = SpecialSheet.cancelOrder(ctx.userId, ctx.groupId, all ? '' : itemArg.trim(), eventDate, SpecialSheet.SPECIAL_DAY_MARKER, ctx.userName);
  if (count === 0) return { text: _spT(ctx, 'special.cancel_none', { date: eventDate }) };
  if (ctx.notify) {
    ctx.notify(_spT(ctx, 'special.notify_cancel', { user: ctx.userName, date: _specialDateLabel(eventDate), count: count }));
  }
  return { text: _spT(ctx, 'special.cancel_ok', { date: _specialDateLabel(eventDate), count: count }) };
}

function _specialStatsForDate(ctx, eventDate) {
  var rec = SpecialSheet.getSpecialDate(eventDate);
  var summary = SpecialSheet.getOrderSummary(ctx.groupId, eventDate, SpecialSheet.SPECIAL_DAY_MARKER);
  var menu = SpecialSheet.getSpecialItems(eventDate, true);
  var limitOf = {};
  menu.forEach(function (m) { limitOf[m.itemName] = m.quantityLimit; });

  var lines = ['📅 ' + _specialDateLabel(eventDate) + (rec && rec.title ? ' ' + rec.title : '')];
  lines.push(_specialStatusLine(ctx, eventDate, rec));
  if (summary.items.length === 0) {
    lines.push(_spT(ctx, 'special.stats_none'));
    return lines.join('\n');
  }
  summary.items.forEach(function (it) {
    var cap = limitOf[it.itemName] > 0 ? ' / ' + limitOf[it.itemName] : '';
    var buyers = it.buyers && it.buyers.length > 0 ? ' (' + it.buyers.join(', ') + ')' : '';
    lines.push('  • ' + it.itemName + ' x ' + it.quantity + cap + ' ＝ $' + it.subtotal + buyers);
  });
  lines.push(_spT(ctx, 'special.stats_total', { qty: summary.totalQuantity, amount: summary.totalAmount }));
  return lines.join('\n');
}

function _specialStats(ctx, eventDate) {
  var dates = [];
  if (eventDate) {
    dates = [eventDate];
  } else {
    var seen = {};
    SpecialSheet.getGroupOrders(ctx.groupId, null, SpecialSheet.SPECIAL_DAY_MARKER).forEach(function (o) {
      if (!seen[o.date]) { seen[o.date] = true; dates.push(o.date); }
    });
    dates.sort();
  }
  if (dates.length === 0) return { text: _spT(ctx, 'special.stats_empty') };
  var text = dates.map(function (d) { return _specialStatsForDate(ctx, d); }).join('\n\n');
  return { text: text.length > 4800 ? text.slice(0, 4800) + '\n…' : text };
}

/* ------------------------------------------------------------------ *
 * Dispatcher
 * ------------------------------------------------------------------ */

/**
 * Handle special-date menu commands.
 * @param {Object} ctx - { text, userId, groupId, userName, locale, isOrganizer, hasOrganizer,
 *                         parseOrderText(fn), notify(fn), refDate }
 * @returns {{text: string}|{altText: string, flex: Object}|null} null when the text is not a special-menu command
 */
function handleSpecialMenuCommand(ctx) {
  var text = String(ctx.text || '').trim();
  if (!text || !SpecialSheet || !SpecialI18n) return null;
  var dp = SPECIAL_DATE_PATTERN;
  var m;

  var addRe = new RegExp('^' + _spPrefix('cmd.special_add') + '(?:\\s+' + dp + '(?:\\s+(.+))?)?$', 'i');
  if ((m = text.match(addRe))) {
    if (!m[1]) return { text: _spT(ctx, 'special.usage_add') };
    var addDate = parseSpecialDate(m[1], ctx.refDate);
    return addDate ? _specialAdd(ctx, addDate, (m[2] || '').trim()) : { text: _spT(ctx, 'special.err_date_format') };
  }

  var itemRe = new RegExp('^' + _spPrefix('cmd.special_item') + '(?:\\s+' + dp + '(?:\\s+(.+))?)?$', 'i');
  if ((m = text.match(itemRe))) {
    if (!m[1]) return { text: _spT(ctx, 'special.usage_item') };
    var itemDate = parseSpecialDate(m[1], ctx.refDate);
    return itemDate ? _specialItem(ctx, itemDate, m[2]) : { text: _spT(ctx, 'special.err_date_format') };
  }

  var cutoffRe = new RegExp('^' + _spPrefix('cmd.special_cutoff') + '(?:\\s+' + dp + '(?:\\s+(.+))?)?$', 'i');
  if ((m = text.match(cutoffRe))) {
    if (!m[1]) return { text: _spT(ctx, 'special.usage_cutoff') };
    var cutoffDate = parseSpecialDate(m[1], ctx.refDate);
    return cutoffDate ? _specialCutoff(ctx, cutoffDate, m[2]) : { text: _spT(ctx, 'special.err_date_format') };
  }

  var cancelRe = new RegExp('^' + _spPrefix('cmd.special_cancel') + '(?:\\s+' + dp + ')?(?:\\s+(.+))?$', 'i');
  if ((m = text.match(cancelRe))) {
    var cancelDate = m[1] ? parseSpecialDate(m[1], ctx.refDate) : null;
    if (m[1] && !cancelDate) return { text: _spT(ctx, 'special.err_date_format') };
    return _specialCancel(ctx, cancelDate, m[2]);
  }

  if (new RegExp('^' + _spPrefix('cmd.special_my') + '$', 'i').test(text)) {
    return _specialMyOrders(ctx);
  }

  var statsRe = new RegExp('^' + _spPrefix('cmd.special_stats') + '(?:\\s+' + dp + ')?$', 'i');
  if ((m = text.match(statsRe))) {
    var statsDate = m[1] ? parseSpecialDate(m[1], ctx.refDate) : null;
    if (m[1] && !statsDate) return { text: _spT(ctx, 'special.err_date_format') };
    return _specialStats(ctx, statsDate);
  }

  var menuPrefix = _spPrefix('cmd.special_menu');
  var menuRe = new RegExp('^' + menuPrefix + '(?:\\s+' + dp + '(?:\\s+(.+))?)?$', 'i');
  if ((m = text.match(menuRe))) {
    if (!m[1]) return _specialListDates(ctx);
    var menuDate = parseSpecialDate(m[1], ctx.refDate);
    if (!menuDate) return { text: _spT(ctx, 'special.err_date_format') };
    var rest = (m[2] || '').trim();
    var pageMatch = rest.match(/^(?:菜單|menu)?\s*(?:第\s*(\d+)\s*[頁页])?$/i);
    if (pageMatch) return _specialShowMenu(ctx, menuDate, parseInt(pageMatch[1], 10) || 1);
    return _specialPlaceOrder(ctx, menuDate, rest);
  }

  // Looks like a special-menu command but with unusable arguments: explain instead of falling through to regular ordering
  if (new RegExp('^' + menuPrefix + '(?:\\s|$)', 'i').test(text)) {
    return { text: _specialUsage(ctx) };
  }
  return null;
}

/* ------------------------------------------------------------------ *
 * Dual-Environment Export (GAS + Node.js)
 * ------------------------------------------------------------------ */
(function () {
  var g = (typeof globalThis !== 'undefined') ? globalThis
       : (typeof global   !== 'undefined') ? global
       : (typeof self     !== 'undefined') ? self
       : this;

  g.handleSpecialMenuCommand = handleSpecialMenuCommand;
  g.parseSpecialDate = parseSpecialDate;
  g.getSpecialCutoffAt = getSpecialCutoffAt;
  g.getSpecialDefaultCutoffAt = getSpecialDefaultCutoffAt;
  g.isSpecialOrderingClosed = isSpecialOrderingClosed;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      handleSpecialMenuCommand: handleSpecialMenuCommand,
      parseSpecialDate: parseSpecialDate,
      getSpecialCutoffAt: getSpecialCutoffAt,
      getSpecialDefaultCutoffAt: getSpecialDefaultCutoffAt,
      isSpecialOrderingClosed: isSpecialOrderingClosed
    };
  }
})();
