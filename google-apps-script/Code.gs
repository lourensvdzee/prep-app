/**
 * Google Apps Script - Prep Inventory API
 *
 * SETUP INSTRUCTIONS:
 * 1. Go to https://script.google.com
 * 2. Create a new project
 * 3. Copy this entire file into Code.gs
 * 4. Update SPREADSHEET_ID below with your Google Sheet ID
 * 5. Deploy > New deployment > Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 6. Copy the deployment URL and add it to your frontend .env file
 */

// Replace with your Google Sheet ID (from the URL: docs.google.com/spreadsheets/d/SHEET_ID/edit)
const SPREADSHEET_ID = '1qLP9o9aK43LStmczlygbweZdn2vx1jy0TFg6CeinP-E';
const SHEET_NAME = 'Sheet1'; // Change if your sheet has a different name

/**
 * Handle GET requests - Read inventory data
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getAll';

    let result;
    switch (action) {
      case 'getAll':
        result = getAllItems();
        break;
      default:
        result = { error: 'Unknown action' };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({ error: error.message });
  }
}

/**
 * Handle POST requests - Create/Update/Delete items
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

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
      default:
        result = { error: 'Unknown action' };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({ error: error.message });
  }
}

/**
 * Get all inventory items from the sheet
 */
function getAllItems() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const data = sheet.getDataRange().getValues();

  if (data.length <= 1) {
    return { items: [], headers: data[0] || [] };
  }

  const headers = data[0];
  const items = [];

  // Map column indices based on your sheet structure
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

    // Skip empty rows
    if (!row[colIndex.name]) continue;

    const item = {
      rowIndex: i + 1, // 1-based row number for updates
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

/**
 * Add a new item to the sheet
 */
function addItem(item) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const colIndex = {
    name: findColumnIndex(headers, ['Name', 'Product', 'Produkt']),
    amount: findColumnIndex(headers, ['Amount', 'Menge', 'Anzahl']),
    edeka: findColumnIndex(headers, ['Edeka']),
    denns: findColumnIndex(headers, ['Denns', "Denn's"]),
    rewe: findColumnIndex(headers, ['Rewe']),
    expirationDate: findColumnIndex(headers, ['THT', 'Expiration', 'MHD', 'Haltbar']),
    alertDate: findColumnIndex(headers, ['Alert', 'Warnung', 'Alert Date'])
  };

  const newRow = new Array(headers.length).fill('');
  newRow[colIndex.name] = item.name || '';
  newRow[colIndex.amount] = item.amount || '';
  if (colIndex.edeka >= 0) newRow[colIndex.edeka] = item.shops?.edeka || '';
  if (colIndex.denns >= 0) newRow[colIndex.denns] = item.shops?.denns || '';
  if (colIndex.rewe >= 0) newRow[colIndex.rewe] = item.shops?.rewe || '';
  newRow[colIndex.expirationDate] = item.expirationDate || '';
  newRow[colIndex.alertDate] = item.alertDate || '';

  sheet.appendRow(newRow);

  return { success: true, message: 'Item added successfully' };
}

/**
 * Update an existing item
 */
function updateItem(rowIndex, item) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  const colIndex = {
    name: findColumnIndex(headers, ['Name', 'Product', 'Produkt']),
    amount: findColumnIndex(headers, ['Amount', 'Menge', 'Anzahl']),
    edeka: findColumnIndex(headers, ['Edeka']),
    denns: findColumnIndex(headers, ['Denns', "Denn's"]),
    rewe: findColumnIndex(headers, ['Rewe']),
    expirationDate: findColumnIndex(headers, ['THT', 'Expiration', 'MHD', 'Haltbar']),
    alertDate: findColumnIndex(headers, ['Alert', 'Warnung', 'Alert Date'])
  };

  if (item.name !== undefined) {
    sheet.getRange(rowIndex, colIndex.name + 1).setValue(item.name);
  }
  if (item.amount !== undefined) {
    sheet.getRange(rowIndex, colIndex.amount + 1).setValue(item.amount);
  }
  if (item.expirationDate !== undefined) {
    sheet.getRange(rowIndex, colIndex.expirationDate + 1).setValue(item.expirationDate);
  }
  if (item.alertDate !== undefined) {
    sheet.getRange(rowIndex, colIndex.alertDate + 1).setValue(item.alertDate);
  }

  return { success: true, message: 'Item updated successfully' };
}

/**
 * Delete an item (clears the row content)
 */
function deleteItem(rowIndex) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  sheet.deleteRow(rowIndex);
  return { success: true, message: 'Item deleted successfully' };
}

/**
 * Helper: Find column index by possible header names
 */
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

/**
 * Helper: Format date to DD.MM.YYYY string
 */
function formatDate(value) {
  if (!value) return '';

  // If it's already a string, return as-is
  if (typeof value === 'string') {
    return value;
  }

  // If it's a Date object, format it
  if (value instanceof Date) {
    const day = String(value.getDate()).padStart(2, '0');
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const year = value.getFullYear();
    return `${day}.${month}.${year}`;
  }

  return String(value);
}

/**
 * Helper: Create JSON response with CORS headers
 */
function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Test function - Run this to verify your setup
 */
function testGetAll() {
  const result = getAllItems();
  Logger.log(JSON.stringify(result, null, 2));
}
