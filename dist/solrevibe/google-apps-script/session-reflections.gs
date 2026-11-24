/**
 * SOL REViBE — Google Sheets Collector (Google Apps Script Web App)
 *
 * Setup:
 * 1. Open spreadsheet:
 *    https://docs.google.com/spreadsheets/d/11j0j2KF7ivB0h-6ExvT7qiIWdGGmtZCGJmmmooKh0Js/edit
 * 2. Click Extensions -> Apps Script, replace Code.gs with this file, and Save.
 * 3. Click Deploy -> New deployment -> Web app:
 *      - Execute as: Me
 *      - Who has access: Anyone
 * 4. Copy the Web App URL (https://script.google.com/macros/s/.../exec) and
 *    set it as TLC_GOOGLE_SHEETS_WEBAPP_URL in Vercel (team: gerard-6963s-projects, project: sol-revibe).
 */

const SPREADSHEET_ID = '11j0j2KF7ivB0h-6ExvT7qiIWdGGmtZCGJmmmooKh0Js';

const GMI_HEADERS = [
  'Submitted At',
  'Session Date',
  'Station Location',
  'Video Title',
  'Vimeo ID',
  'Before GMI (1-10)',
  'After GMI (1-10)',
  'Points Shifted',
  'Outcome Summary',
  'User Agent'
];

const TLC_HEADERS = [
  'Submitted At',
  'Session Date',
  'Station Location',
  'Video Title',
  'Vimeo ID',
  'Opening Number (1-10)',
  'Ending Number (1-10)',
  'Point Drop',
  'Distance',
  'Shift Title',
  'Experience Description',
  'User Agent'
];

function getOrInitSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function formatSessionDate_(isoString) {
  const d = isoString ? new Date(isoString) : new Date();
  if (isNaN(d.getTime())) return String(isoString || '');
  return Utilities.formatDate(d, Session.getScriptTimeZone() || 'America/Denver', 'yyyy-MM-dd HH:mm:ss');
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, service: 'SOL REViBE Session Reflections Collector' }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const raw = (e && e.postData && e.postData.contents) ? e.postData.contents : '{}';
    const data = JSON.parse(raw);
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const submittedAt = String(data.submittedAt || new Date().toISOString());
    const sessionDate = formatSessionDate_(submittedAt);

    if (String(data.formType || '') === 'shadow_index_assessment' || String(data.formType || '') === 'gmi_assessment') {
      const sheet = getOrInitSheet_(ss, 'GMI Check-In', GMI_HEADERS);
      const before = Number(data.openingNumber);
      const after = Number(data.endingNumber);
      const shift = data.pointShift !== undefined ? Number(data.pointShift) : (after - before);
      sheet.appendRow([
        submittedAt,
        sessionDate,
        String(data.stationLocation || ''),
        String(data.videoTitle || 'Rigging Future Echoes'),
        String(data.vimeoId || '1249260783'),
        before,
        after,
        shift,
        String(data.encouragerTitle || ''),
        String(data.userAgent || '')
      ]);
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, sheet: 'GMI Check-In' }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = getOrInitSheet_(ss, 'Thought Loop Clearing', TLC_HEADERS);
    sheet.appendRow([
      submittedAt,
      sessionDate,
      String(data.stationLocation || ''),
      String(data.videoTitle || 'TAG 1 - Thought Loop Clearing'),
      String(data.vimeoId || '1245793823'),
      Number(data.openingNumber),
      Number(data.endingNumber),
      Number(data.pointDrop),
      Number(data.distance),
      String(data.encouragerTitle || ''),
      String(data.experienceDescription || data.loopAppearance || ''),
      String(data.userAgent || '')
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, sheet: 'Thought Loop Clearing' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err && err.message ? err.message : String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}
