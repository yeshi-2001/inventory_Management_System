/**
 * Google Apps Script — Vendor Reorder Email Alerts
 *
 * Sheet columns (Row 1 = headers):
 * A: itemId | B: itemName | C: quantity | D: minQuantity | E: vendorEmail | F: vendorName
 *
 * Setup:
 * 1. Open script.google.com → New Project → paste this code
 * 2. Run setupTrigger() once to register the daily trigger
 * 3. Authorize when prompted
 */

const SHEET_NAME = "Inventory";

function checkAndSendReorderEmails() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();

  rows.slice(1).forEach(([itemId, itemName, quantity, minQuantity, vendorEmail, vendorName]) => {
    if (Number(quantity) <= Number(minQuantity)) {
      const suggestedQty = Math.max(0, Number(minQuantity) * 2 - Number(quantity));
      GmailApp.sendEmail(
        vendorEmail,
        `Reorder Request: ${itemName}`,
        "",
        {
          htmlBody: buildEmail(itemId, itemName, quantity, minQuantity, suggestedQty, vendorName),
          name: "Warehouse Management System",
        }
      );
      Logger.log(`Email sent to ${vendorEmail} for ${itemName}`);
    }
  });
}

function buildEmail(itemId, itemName, qty, minQty, suggestedQty, vendorName) {
  return `
    <p>Dear <strong>${vendorName}</strong>,</p>
    <p>This is an automated reorder request from our Warehouse Management System.</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr style="background:#f3f4f6"><td><b>Item ID</b></td><td>${itemId}</td></tr>
      <tr><td><b>Item Name</b></td><td>${itemName}</td></tr>
      <tr style="background:#f3f4f6"><td><b>Current Stock</b></td><td>${qty} units</td></tr>
      <tr><td><b>Minimum Threshold</b></td><td>${minQty} units</td></tr>
      <tr style="background:#fef9c3"><td><b>Suggested Reorder Qty</b></td><td><b>${suggestedQty} units</b></td></tr>
    </table>
    <p>Please process this order at your earliest convenience.</p>
    <p>Regards,<br/>Warehouse Management System</p>
  `;
}

// Run this ONCE to register the daily 9am trigger
function setupTrigger() {
  ScriptApp.newTrigger("checkAndSendReorderEmails")
    .timeBased()
    .everyDays(1)
    .atHour(9)
    .create();
  Logger.log("Daily trigger created.");
}

// Dry-run: logs without sending any emails — safe for testing
function dryRun() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  const rows = sheet.getDataRange().getValues();
  rows.slice(1).forEach(([itemId, itemName, quantity, minQuantity, vendorEmail]) => {
    if (Number(quantity) <= Number(minQuantity)) {
      Logger.log(`[DRY RUN] Would email ${vendorEmail} for ${itemName} (qty: ${quantity})`);
    }
  });
}
