/**
 * Google Apps Script - Prep Inventory API
 */

const SPREADSHEET_ID = '1qLP9o9aK43LStmczlygbweZdn2vx1jy0TFg6CeinP-E';
const SHEET_NAME = 'Sheet1';

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'getAll';
    const callback = e && e.parameter && e.parameter.callback;

    let result;
    switch (action) {
      case 'getAll':
        result = getAllItems();
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

function getAllItems() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { items: [], headers: data[0] || [] };
  }

  const headers = data[0];
  const items = [];

  const colIndex = {
    name: findColumnIndex(headers, ['Name', 'Product', 'Produkt']),
    amount: findColumnIndex(headers, ['Amount', 'Menge', 'Anzahl']),
    edeka: findColumnIndex(headers, ['Edeka']),
    denns: findColumnIndex(headers, ['Denns', "Denn's"]),
    rewe: findColumnIndex(headers, ['Rewe']),
    expirationDate: findColumnIndex(headers, ['THT', 'Expiration', 'MHD', 'Haltbar']),
    alertDate: findColumnIndex(headers, ['Alert', 'Warnung', 'Alert Date'])
  };

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row[colIndex.name]) continue;

    const item = {
      rowIndex: i + 1,
      name: row[colIndex.name] || '',
      amount: row[colIndex.amount] || '',
      shops: {
        edeka: colIndex.edeka >= 0 ? (row[colIndex.edeka] || '') : '',
        denns: colIndex.denns >= 0 ? (row[colIndex.denns] || '') : '',
        rewe: colIndex.rewe >= 0 ? (row[colIndex.rewe] || '') : ''
      },
      expirationDate: formatDate(row[colIndex.expirationDate]),
      alertDate: formatDate(row[colIndex.alertDate])
    };

    items.push(item);
  }

  return {
    items: items,
    lastUpdated: new Date().toISOString()
  };
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
