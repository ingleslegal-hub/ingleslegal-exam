/**
 * Ingles Legal - certificate registry and verification (Google Apps Script)
 *
 * WHAT IT DOES
 *  - Saves every certificate issued by the exams into a "Certificates" sheet (one row per certificate).
 *  - Answers verification lookups from verify.html (JSONP, so no CORS setup is needed).
 *
 * HOW TO ADD IT (about 5 minutes)
 *  1. Open the Apps Script project that already receives the exam results (the one behind RESULTS_WEBHOOK_URL).
 *  2. Add a new file (+ next to Files > Script) and paste this whole file into it.
 *  3. In your EXISTING doPost(e), extend the type check so it also handles certificates:
 *
 *        ... else if (data.type === 'vocab') { handleVocab(data); } else if (data.type === 'certificate') { return saveCertificate_(data); }
 *
 *     If your project has no doGet(e) yet, nothing else is needed: this file defines one.
 *     If it already has a doGet(e), add this at its top instead and delete the doGet below:
 *
 *        if (e && e.parameter && e.parameter.verify) { return verifyCertificate_(e); }
 *
 *  4. Deploy > Manage deployments > edit the web app > Version: New version > Deploy.
 *     Keep "Execute as: Me" and "Who has access: Anyone". The URL does not change.
 *
 * PRIVACY: the sheet stores name, email, exam and score. Verification returns ONLY the masked
 * name (first name + last initial), exam, level, score and issue date. Email is never returned.
 *
 * SCALE: a lookup scans one column, which is fine for tens of thousands of certificates. Beyond that,
 * move the lookup to a database (the certificates and QR codes do not change).
 */

var CERT_SHEET_NAME = 'Certificates';
// Pass mark is 75% for every exam (TIER_THRESHOLDS in Code.gs is also 75 for all tiers).
function certPassMark_(data) {
  return 75;
}
var CERT_HEADERS = ['id', 'issuedAt', 'name', 'email', 'exam', 'level', 'kind', 'percent', 'correct', 'total'];

function certSheet_() {
  var ss = getSheets().ss; // same results spreadsheet the other exam data goes to
  var sh = ss.getSheetByName(CERT_SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CERT_SHEET_NAME);
    sh.appendRow(CERT_HEADERS);
    sh.setFrozenRows(1);
  }
  return sh;
}

function saveCertificate_(data) {
  var lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    var id = String(data.id || '');
    // Basic validation: well-formed ID, a passing score, and no duplicates.
    if (!/^IL-[A-Z0-9]{1,5}-[A-Z2-9]{8}$/.test(id)) return json_({ ok: false, error: 'bad id' });
    var percent = Number(data.percent);
    if (!(percent >= certPassMark_(data) && percent <= 100)) return json_({ ok: false, error: 'not passing' });
    var sh = certSheet_();
    var found = sh.getRange(2, 1, Math.max(sh.getLastRow() - 1, 1), 1).createTextFinder(id).matchEntireCell(true).findNext();
    if (found && sh.getLastRow() > 1) return json_({ ok: false, error: 'duplicate' });
    sh.appendRow([
      id, new Date(), String(data.name || '').slice(0, 120), String(data.email || '').slice(0, 160),
      String(data.exam || '').slice(0, 160), String(data.level || '').slice(0, 120), String(data.kind || ''),
      percent, Number(data.correct) || 0, Number(data.total) || 0
    ]);
    return json_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function maskName_(name) {
  var parts = String(name || '').trim().split(/\s+/).filter(String);
  if (!parts.length) return '';
  if (parts.length === 1) return parts[0];
  return parts[0] + ' ' + parts[parts.length - 1].charAt(0).toUpperCase() + '.';
}

function verifyCertificate_(e) {
  var id = String(e.parameter.verify || '').trim().toUpperCase();
  var out = { found: false };
  if (/^IL-[A-Z0-9]{1,5}-[A-Z2-9]{8}$/.test(id)) {
    var sh = certSheet_();
    if (sh.getLastRow() > 1) {
      var hit = sh.getRange(2, 1, sh.getLastRow() - 1, 1).createTextFinder(id).matchEntireCell(true).findNext();
      if (hit) {
        var row = sh.getRange(hit.getRow(), 1, 1, CERT_HEADERS.length).getValues()[0];
        out = {
          found: true, id: row[0], issuedAt: new Date(row[1]).toISOString(), name: maskName_(row[2]),
          exam: row[4], level: row[5], percent: row[7], correct: row[8], total: row[9]
        };
      }
    }
  }
  var cb = String(e.parameter.callback || '');
  if (/^[A-Za-z_][A-Za-z0-9_]{0,40}$/.test(cb)) {
    return ContentService.createTextOutput(cb + '(' + JSON.stringify(out) + ');').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return json_(out);
}

function doGet(e) {
  if (e && e.parameter && e.parameter.verify) return verifyCertificate_(e);
  return json_({ ok: true, service: 'ingleslegal-exams' });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
