/**
 * Google Apps Script - Prep Inventory API
 */

const SPREADSHEET_ID = '1qLP9o9aK43LStmczlygbweZdn2vx1jy0TFg6CeinP-E';
const SHEET_NAME = 'Sheet1';

// Known date columns (case insensitive)
const DATE_COLUMNS = ['tht', 'expiration', 'mhd', 'haltbar', 'alert', 'warnung', 'alert date'];
// Known non-shop columns
const NON_SHOP_COLUMNS = ['name', 'product', 'produkt', 'amount', 'menge', 'anzahl', 'tht', 'expiration', 'mhd', 'haltbar', 'alert', 'warnung', 'alert date', 'inuse', 'in use'];

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getAll';
    const callback = e && e.parameter && e.parameter.callback;

    let result;
    switch (action) {
      case 'getAll':
        result = getAllItems();
        break;
      case 'write':
        // Handle write operations via GET (JSONP workaround for CORS)
        const payloadStr = e && e.parameter && e.parameter.payload;
        if (!payloadStr) {
          result = { success: false, error: 'No payload provided' };
          break;
        }
        const payload = JSON.parse(decodeURIComponent(payloadStr));
        switch (payload.action) {
          case 'add':
            result = addItem(payload.item);
            break;
          case 'update':
            result = updateItem(payload.rowIndex, payload.item);
            break;
          case 'delete':
            result = deleteItem(payload.rowIndex);
            break;
          case 'addShopColumn':
            result = addShopColumn(payload.shopName);
            break;
          case 'registerToken':
            result = registerToken(payload.token);
            break;
          default:
            result = { success: false, error: 'Unknown write action: ' + payload.action };
        }
        break;
      default:
        result = { error: 'Unknown action' };
    }

    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    const errorResult = { error: error.message };
    const callback = e && e.parameter && e.parameter.callback;

    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(errorResult) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(JSON.stringify(errorResult))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    const callback = data.callback;

    let result;
    switch (action) {
      case 'add':
        result = addItem(data.item);
        break;
      case 'update':
        result = updateItem(data.rowIndex, data.item);
        break;
      case 'delete':
        result = deleteItem(data.rowIndex);
        break;
      case 'addShopColumn':
        result = addShopColumn(data.shopName);
        break;
      default:
        result = { error: 'Unknown action' };
    }

    if (callback) {
      return ContentService
        .createTextOutput(callback + '(' + JSON.stringify(result) + ')')
        .setMimeType(ContentService.MimeType.JAVASCRIPT);
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function getAllItems() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { items: [], headers: data[0] || [], shopColumns: [] };
  }

  const headers = data[0];
  const items = [];

  // Find column indices
  const colIndex = {
    name: findColumnIndex(headers, ['Name', 'Product', 'Produkt']),
    amount: findColumnIndex(headers, ['Amount', 'Menge', 'Anzahl']),
    expirationDate: findColumnIndex(headers, ['THT', 'Expiration', 'MHD', 'Haltbar']),
    alertDate: findColumnIndex(headers, ['Alert', 'Warnung', 'Alert Date']),
    inUse: findColumnIndex(headers, ['InUse', 'In Use'])
  };

  // Find shop columns (any column not in the known non-shop list)
  const shopColumns = [];
  const shopIndices = {};
  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i]).toLowerCase().trim();
    if (header && !NON_SHOP_COLUMNS.includes(header)) {
      const shopName = header;
      shopColumns.push(shopName);
      shopIndices[shopName] = i;
    }
  }

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[colIndex.name]) continue;

    const shops = {};
    for (const shopName of shopColumns) {
      const idx = shopIndices[shopName];
      shops[shopName] = row[idx] ? String(row[idx]) : '';
    }

    const item = {
      rowIndex: i + 1,
      name: row[colIndex.name] || '',
      amount: row[colIndex.amount] ? String(row[colIndex.amount]) : '',
      shops: shops,
      expirationDate: formatDate(row[colIndex.expirationDate]),
      alertDate: formatDate(row[colIndex.alertDate]),
      inUse: colIndex.inUse >= 0 ? Boolean(row[colIndex.inUse]) : false
    };

    items.push(item);
  }

  return {
    items: items,
    headers: headers.map(h => String(h)),
    shopColumns: shopColumns,
    lastUpdated: new Date().toISOString()
  };
}

function addItem(item) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const colIndex = {
    name: findColumnIndex(headers, ['Name', 'Product', 'Produkt']),
    amount: findColumnIndex(headers, ['Amount', 'Menge', 'Anzahl']),
    expirationDate: findColumnIndex(headers, ['THT', 'Expiration', 'MHD', 'Haltbar']),
    alertDate: findColumnIndex(headers, ['Alert', 'Warnung', 'Alert Date']),
    inUse: findColumnIndex(headers, ['InUse', 'In Use'])
  };

  const newRow = new Array(headers.length).fill('');

  if (colIndex.name >= 0) newRow[colIndex.name] = item.name || '';
  if (colIndex.amount >= 0) newRow[colIndex.amount] = item.amount || '';
  if (colIndex.expirationDate >= 0) newRow[colIndex.expirationDate] = item.expirationDate || '';
  if (colIndex.alertDate >= 0) newRow[colIndex.alertDate] = item.alertDate || '';
  if (colIndex.inUse >= 0) newRow[colIndex.inUse] = item.inUse ? true : false;

  // Handle shop columns
  if (item.shops) {
    for (const shopName in item.shops) {
      const shopIdx = findColumnIndex(headers, [shopName]);
      if (shopIdx >= 0) {
        newRow[shopIdx] = item.shops[shopName] || '';
      } else if (item.shops[shopName]) {
        // Shop column doesn't exist and has a value - add column first
        const newColIndex = sheet.getLastColumn() + 1;
        const displayName = shopName.charAt(0).toUpperCase() + shopName.slice(1);
        sheet.getRange(1, newColIndex).setValue(displayName);
        // Extend newRow array and set value
        while (newRow.length < newColIndex) {
          newRow.push('');
        }
        newRow[newColIndex - 1] = item.shops[shopName];
        headers.push(displayName);
      }
    }
  }

  sheet.appendRow(newRow);
  return { success: true, message: 'Item added successfully' };
}

function updateItem(rowIndex, item) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const colIndex = {
    name: findColumnIndex(headers, ['Name', 'Product', 'Produkt']),
    amount: findColumnIndex(headers, ['Amount', 'Menge', 'Anzahl']),
    expirationDate: findColumnIndex(headers, ['THT', 'Expiration', 'MHD', 'Haltbar']),
    alertDate: findColumnIndex(headers, ['Alert', 'Warnung', 'Alert Date']),
    inUse: findColumnIndex(headers, ['InUse', 'In Use'])
  };

  if (item.name !== undefined && colIndex.name >= 0) {
    sheet.getRange(rowIndex, colIndex.name + 1).setValue(item.name);
  }
  if (item.amount !== undefined && colIndex.amount >= 0) {
    sheet.getRange(rowIndex, colIndex.amount + 1).setValue(item.amount);
  }
  if (item.expirationDate !== undefined && colIndex.expirationDate >= 0) {
    sheet.getRange(rowIndex, colIndex.expirationDate + 1).setValue(item.expirationDate);
  }
  if (item.alertDate !== undefined && colIndex.alertDate >= 0) {
    sheet.getRange(rowIndex, colIndex.alertDate + 1).setValue(item.alertDate);
  }
  if (item.inUse !== undefined && colIndex.inUse >= 0) {
    sheet.getRange(rowIndex, colIndex.inUse + 1).setValue(item.inUse ? true : false);
  }

  // Handle shop columns
  if (item.shops) {
    // Re-read headers after potential updates
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

    for (const shopName in item.shops) {
      const shopIdx = findColumnIndex(currentHeaders, [shopName]);
      if (shopIdx >= 0) {
        sheet.getRange(rowIndex, shopIdx + 1).setValue(item.shops[shopName] || '');
      } else {
        // Shop column doesn't exist, create it at the end
        const newColIndex = sheet.getLastColumn() + 1;
        // Capitalize first letter for display
        const displayName = shopName.charAt(0).toUpperCase() + shopName.slice(1);
        sheet.getRange(1, newColIndex).setValue(displayName);
        sheet.getRange(rowIndex, newColIndex).setValue(item.shops[shopName] || '');
        // Update currentHeaders for subsequent shops
        currentHeaders.push(displayName);
      }
    }
  }

  return { success: true, message: 'Item updated successfully' };
}

function deleteItem(rowIndex) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  sheet.deleteRow(rowIndex);
  return { success: true, message: 'Item deleted successfully' };
}

function addShopColumn(shopName) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Check if column already exists
  const existingIdx = findColumnIndex(headers, [shopName]);
  if (existingIdx >= 0) {
    return { success: false, message: 'Shop column already exists' };
  }

  const newColIndex = sheet.getLastColumn() + 1;
  sheet.getRange(1, newColIndex).setValue(shopName);

  return { success: true, message: 'Shop column added successfully', columnIndex: newColIndex };
}

function findColumnIndex(headers, possibleNames) {
  for (let i = 0; i < headers.length; i++) {
    const header = String(headers[i]).toLowerCase().trim();
    for (const name of possibleNames) {
      if (header === name.toLowerCase()) {
        return i;
      }
    }
  }
  return -1;
}

function formatDate(value) {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return day + '.' + month + '.' + year;
  }
  return String(value);
}

function testGetAll() {
  const result = getAllItems();
  Logger.log(JSON.stringify(result, null, 2));
}

// ============================================
// PUSH NOTIFICATIONS - Firebase Cloud Messaging
// ============================================

const TOKENS_SHEET_NAME = 'FCM_Tokens';
const NOTIFICATIONS_SHEET_NAME = 'Notifications';

// Get or create the FCM tokens sheet
function getTokensSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(TOKENS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(TOKENS_SHEET_NAME);
    sheet.appendRow(['Token', 'CreatedAt', 'LastUsed']);
  }
  return sheet;
}

// Register FCM token (called from the app)
function registerToken(token) {
  const sheet = getTokensSheet();
  const data = sheet.getDataRange().getValues();

  // Check if token already exists
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === token) {
      // Update LastUsed
      sheet.getRange(i + 1, 3).setValue(new Date().toISOString());
      return { success: true, message: 'Token updated' };
    }
  }

  // Add new token
  sheet.appendRow([token, new Date().toISOString(), new Date().toISOString()]);
  return { success: true, message: 'Token registered' };
}

// Get all registered FCM tokens
function getAllTokens() {
  const sheet = getTokensSheet();
  const data = sheet.getDataRange().getValues();
  const tokens = [];
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      tokens.push(data[i][0]);
    }
  }
  return tokens;
}

// Send push notification via Firebase Cloud Messaging
function sendPushNotification(title, body, data) {
  const serverKey = PropertiesService.getScriptProperties().getProperty('FCM_SERVER_KEY');
  if (!serverKey) {
    Logger.log('FCM_SERVER_KEY not configured');
    return { success: false, error: 'FCM_SERVER_KEY not configured' };
  }

  const tokens = getAllTokens();
  if (tokens.length === 0) {
    Logger.log('No FCM tokens registered');
    return { success: false, error: 'No tokens registered' };
  }

  const results = [];

  for (const token of tokens) {
    const payload = {
      to: token,
      notification: {
        title: title,
        body: body,
        icon: '/apple-touch-icon.jpg',
        click_action: '/'
      },
      data: data || {}
    };

    const options = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': 'key=' + serverKey
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    try {
      const response = UrlFetchApp.fetch('https://fcm.googleapis.com/fcm/send', options);
      const result = JSON.parse(response.getContentText());
      results.push({ token: token.substring(0, 20) + '...', result: result });

      // Remove invalid tokens
      if (result.failure === 1 && result.results && result.results[0].error === 'NotRegistered') {
        removeToken(token);
      }
    } catch (error) {
      Logger.log('Error sending notification: ' + error.message);
      results.push({ token: token.substring(0, 20) + '...', error: error.message });
    }
  }

  return { success: true, results: results };
}

// Remove invalid token
function removeToken(token) {
  const sheet = getTokensSheet();
  const data = sheet.getDataRange().getValues();

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === token) {
      sheet.deleteRow(i + 1);
      break;
    }
  }
}

// Check items and send notifications - Run this daily at 8:00 AM
function checkAndSendNotifications() {
  const items = getAllItems().items;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const notifications = [];

  for (const item of items) {
    if (item.inUse) continue; // Skip items in use

    const expDate = parseDate(item.expirationDate);
    const alertDate = parseDate(item.alertDate);

    if (!expDate) continue;

    const daysUntilExpiration = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
    const daysUntilAlert = alertDate ? Math.floor((alertDate - today) / (1000 * 60 * 60 * 24)) : null;

    // Check notification conditions
    if (daysUntilExpiration === 0) {
      // Expires today!
      notifications.push({
        title: 'Expiring Today!',
        body: item.name + ' expires TODAY',
        itemId: item.rowIndex
      });
    } else if (daysUntilExpiration === 7) {
      // 1 week before expiration
      notifications.push({
        title: 'Expiring in 1 Week',
        body: item.name + ' expires in 7 days',
        itemId: item.rowIndex
      });
    } else if (daysUntilExpiration === 30) {
      // 1 month before expiration (only if alert is at least 1 month before)
      if (daysUntilAlert === null || daysUntilAlert >= 30) {
        notifications.push({
          title: 'Expiring in 1 Month',
          body: item.name + ' expires in 30 days',
          itemId: item.rowIndex
        });
      }
    } else if (daysUntilAlert !== null && daysUntilAlert === 0) {
      // Alert date is today
      notifications.push({
        title: 'Alert: ' + item.name,
        body: 'Time to check on ' + item.name + ' (expires ' + item.expirationDate + ')',
        itemId: item.rowIndex
      });
    }
  }

  // Send all notifications
  for (const notif of notifications) {
    sendPushNotification(notif.title, notif.body, { itemId: String(notif.itemId) });
    Logger.log('Sent notification: ' + notif.title + ' - ' + notif.body);
  }

  return { sent: notifications.length, notifications: notifications };
}

// Parse date string (DD.MM.YYYY) to Date object
function parseDate(dateStr) {
  if (!dateStr) return null;
  const parts = dateStr.split('.');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  const date = new Date(year, month, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

// Create a time-based trigger to run notifications daily at 8 AM
function createDailyNotificationTrigger() {
  // Delete existing triggers for this function
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'checkAndSendNotifications') {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  // Create new daily trigger at 8 AM
  ScriptApp.newTrigger('checkAndSendNotifications')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .create();

  return { success: true, message: 'Daily notification trigger created for 8:00 AM' };
}

// Test function to manually send a test notification
function testPushNotification() {
  const result = sendPushNotification(
    'Test Notification',
    'This is a test notification from Prep App',
    { test: 'true' }
  );
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}

// Test function to check what notifications would be sent
function testCheckNotifications() {
  const result = checkAndSendNotifications();
  Logger.log(JSON.stringify(result, null, 2));
  return result;
}
