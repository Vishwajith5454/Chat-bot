// sheet.js
// Handles reading/writing bookings to Google Sheets

const { google } = require('googleapis');
const creds = require('./credentials.json');

// Create a JWT auth client using the service account credentials
const client = new google.auth.JWT(
  creds.client_email,
  null,
  creds.private_key,
  ['https://www.googleapis.com/auth/spreadsheets']
);

// Replace with your actual Sheet ID (from your “Booking” sheet URL)
const SHEET_ID = '1AbCDEFghijkLMN_opQRsTUvWXyz12345';

// We’ll append new rows under header row, so the range starts at A2
const RANGE = 'Booking!A2:C';

async function getSheetClient() {
  await client.authorize();
  const gsapi = google.sheets({ version: 'v4', auth: client });
  return gsapi;
}

module.exports.checkIfBooked = async (resource, date) => {
  const gsapi = await getSheetClient();
  const res = await gsapi.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: RANGE
  });

  const rows = res.data.values || [];
  // Each row is [Resource, Date, Booked By]
  return rows.some(row => row[0] === resource && row[1] === date);
};

module.exports.addBooking = async (resource, date, user) => {
  const gsapi = await getSheetClient();
  await gsapi.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: RANGE,
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [[resource, date, user]]
    }
  });
};
