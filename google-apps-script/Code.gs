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
    for (const shopName in item.shops) {
      const shopIdx = findColumnIndex(headers, [shopName]);
      if (shopIdx >= 0) {
        sheet.getRange(rowIndex, shopIdx + 1).setValue(item.shops[shopName] || '');
      } else {
        // Shop column doesn't exist, create it
        const newColIndex = sheet.getLastColumn() + 1;
        sheet.getRange(1, newColIndex).setValue(shopName);
        sheet.getRange(rowIndex, newColIndex).setValue(item.shops[shopName] || '');
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
