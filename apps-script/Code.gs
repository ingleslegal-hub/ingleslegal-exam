const SHEET_ID_PROPERTY = 'RESULTS_SHEET_ID';

const TIER_THRESHOLDS = { 'Tier 1': 75, 'Tier 2': 75, 'Tier 3': 75 };

const TIER_MEANING = {
'Tier 1': 'Tier 1 confirms working proficiency in legal English and the core vocabulary of major US practice areas, reading intake notes, following basic procedural language, and communicating with supervision. It is Ingles Legal recommended bar for entry-level legal support roles.',
'Tier 2': 'Tier 2 confirms the candidate can read and draft at an advanced professional level across core US legal practice areas, and can operate day-to-day legal software without supervision. A Tier 2 pass is Ingles Legal recommended bar for mid-level legal support hires.',
'Tier 3': 'Tier 3 confirms expert-level fluency, including complex litigation vocabulary and cross-border contract work, operating independently on high-stakes matters. It is Ingles Legal recommended bar for senior legal support and paralegal roles.'
};

const PROMO_CODE = 'RESULT20';

function doPost(e) {
try {
const data = JSON.parse(e.postData.contents);
if (data.type === 'final') { handleFinal(data); } else if (data.type === 'batch') { handleBatch(data); } else if (data.type === 'vocab') { handleVocab(data); } else if (data.type === 'certificate') { return saveCertificate_(data); }
return ContentService.createTextOutput(JSON.stringify({ ok: true })).setMimeType(ContentService.MimeType.JSON);
} catch (err) {
return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) })).setMimeType(ContentService.MimeType.JSON);
}
}

function getSheets() {
const props = PropertiesService.getScriptProperties();
let id = props.getProperty(SHEET_ID_PROPERTY);
let ss = null;
if (id) { try { ss = SpreadsheetApp.openById(id); } catch (err) { ss = null; } }
if (!ss) { ss = SpreadsheetApp.create('Ingles Legal — Exam Results Log'); props.setProperty(SHEET_ID_PROPERTY, ss.getId()); }
let finalSheet = ss.getSheetByName('Final Results');
if (!finalSheet) {
finalSheet = ss.insertSheet('Final Results');
finalSheet.appendRow(['Result ID', 'Timestamp', 'Tier', 'Name', 'Email', 'Score', 'Total', 'Percent', 'Passed', 'Started At', 'Completed At', 'Category Breakdown (JSON)']);
finalSheet.setFrozenRows(1);
}
let batchSheet = ss.getSheetByName('Batch Progress');
if (!batchSheet) {
batchSheet = ss.insertSheet('Batch Progress');
batchSheet.appendRow(['Timestamp', 'Tier', 'Name', 'Email', 'Batch', 'Score', 'Total', 'Percent', 'Started At', 'Completed At']);
batchSheet.setFrozenRows(1);
}
return { ss: ss, finalSheet: finalSheet, batchSheet: batchSheet };
}

function handleBatch(data) {
const sheets = getSheets();
sheets.batchSheet.appendRow([new Date(), data.tier, data.name, data.email, data.batch, data.score, data.total, data.percent, data.startedAt, data.completedAt]);
}

function handleFinal(data) {
const sheets = getSheets();
const answers = data.answers || [];
const breakdown = categoryBreakdown(answers);
const resultId = makeResultId(data.tier);
sheets.finalSheet.appendRow([resultId, new Date(), data.tier, data.name, data.email, data.score, data.total, data.percent, data.passed, data.startedAt, data.completedAt, JSON.stringify(breakdown)]);
if (data.email) { sendResultsEmail(data, breakdown, resultId); }
}

function categoryBreakdown(answers) {
const cats = {};
answers.forEach(function (a) {
if (!cats[a.cat]) cats[a.cat] = { correct: 0, total: 0 };
cats[a.cat].total++;
if (a.given === a.correct) cats[a.cat].correct++;
});
return Object.keys(cats).map(function (cat) {
const c = cats[cat];
return { cat: cat, correct: c.correct, total: c.total, percent: Math.round((c.correct / c.total) * 1000) / 10 };
}).sort(function (a, b) { return b.percent - a.percent; });
}

function makeResultId(tier) {
const tierCode = (tier || '').replace(/[^0-9]/g, '') || 'X';
const rand = Utilities.getUuid().split('-')[0].toUpperCase().slice(0, 6);
return 'IL-T' + tierCode + '-' + rand;
}

function formatDate(iso) {
try {
const d = new Date(iso);
return Utilities.formatDate(d, 'America/Bogota', 'MMMM d, yyyy');
} catch (err) {
return iso || '';
}
}

function barRowHtml(b, threshold) {
const barColor = b.percent >= threshold ? '#0ca30c' : '#d03b3b';
return '<tr><td style="padding:10px 0;font-family:Arial,sans-serif;font-size:13px;color:#241626;width:38%;vertical-align:middle;">' + b.cat + '</td><td style="padding:10px 8px;vertical-align:middle;"><div style="background:#e6ddd0;border-radius:4px;height:10px;width:100%;position:relative;overflow:hidden;"><div style="background:' + barColor + ';height:10px;width:' + b.percent + '%;border-radius:4px;"></div></div></td><td style="padding:10px 0 10px 8px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:#241626;text-align:right;width:14%;vertical-align:middle;">' + b.percent + '%</td></tr>';
}

function tableRowHtml(b) {
return '<tr><td style="padding:8px 10px;border-bottom:1px solid #e6ddd0;font-family:Arial,sans-serif;font-size:13px;">' + b.cat + '</td><td style="padding:8px 10px;border-bottom:1px solid #e6ddd0;font-family:Arial,sans-serif;font-size:13px;text-align:right;">' + b.correct + ' / ' + b.total + '</td><td style="padding:8px 10px;border-bottom:1px solid #e6ddd0;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-align:right;">' + b.percent + '%</td></tr>';
}

function sendResultsEmail(data, breakdown, resultId) {
const passed = !!data.passed;
const passText = passed ? 'PASSED' : 'Not yet passing';
const passBg = passed ? 'rgba(12,163,12,0.25)' : 'rgba(208,59,59,0.25)';
const threshold = TIER_THRESHOLDS[data.tier] || 75;
const meaning = TIER_MEANING[data.tier] || '';
const strongest = breakdown.length ? breakdown[0] : null;
const growth = breakdown.length ? breakdown[breakdown.length - 1] : null;
const barRows = breakdown.map(function (b) { return barRowHtml(b, threshold); }).join('');
const tableRows = breakdown.map(tableRowHtml).join('');
const calloutsHtml = (strongest && growth) ? ('<table role="presentation" width="100%" style="border-collapse:collapse;margin-top:16px;"><tr><td style="width:50%;padding:14px;background:#fbf8f2;border:1px solid #e6ddd0;border-radius:8px;" valign="top"><div style="font-family:Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#0ca30c;font-weight:700;">Strongest area</div><div style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;margin-top:4px;color:#241626;">' + strongest.cat + '</div><div style="font-family:Arial,sans-serif;font-size:13px;color:#7d7084;margin-top:2px;">' + strongest.percent + '% correct</div></td><td style="width:4%;"></td><td style="width:46%;padding:14px;background:#fbf8f2;border:1px solid #e6ddd0;border-radius:8px;" valign="top"><div style="font-family:Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#d03b3b;font-weight:700;">Growth area</div><div style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;margin-top:4px;color:#241626;">' + growth.cat + '</div><div style="font-family:Arial,sans-serif;font-size:13px;color:#7d7084;margin-top:2px;">' + growth.percent + '% correct</div></td></tr></table>') : '';
const html = '<div style="font-family:Georgia,\'Times New Roman\',serif;max-width:640px;margin:0 auto;color:#241626;background:#f5f1e8;">' + '<div style="background:linear-gradient(165deg,#2a1b33,#3a2644);padding:32px 28px;border-radius:12px 12px 0 0;color:#fff;">' + '<div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;opacity:0.8;">Legal English Certification</div>' + '<h1 style="font-family:Arial,sans-serif;margin:10px 0 4px;font-size:22px;">' + data.tier + ' Certification Exam</h1>' + '<div style="font-family:Arial,sans-serif;font-size:13px;opacity:0.85;">' + (data.name || 'Candidate') + ' &middot; completed ' + formatDate(data.completedAt) + '</div>' + '<div style="font-family:Arial,sans-serif;font-size:42px;font-weight:800;color:#d4b483;margin-top:16px;">' + data.percent + '%</div>' + '<div style="font-family:Arial,sans-serif;font-size:13px;opacity:0.85;">' + data.score + ' of ' + data.total + ' questions correct</div>' + '<div style="display:inline-block;margin-top:14px;padding:6px 14px;border-radius:20px;background:' + passBg + ';font-family:Arial,sans-serif;font-weight:700;font-size:12px;">' + passText + '</div>' + '<div style="margin-top:16px;font-family:Arial,sans-serif;font-size:12px;opacity:0.75;">Result ID <b>' + resultId + '</b> &middot; Passing threshold: ' + threshold + '%</div>' + '</div>' + '<div style="background:#fbf8f2;padding:28px;border:1px solid #e6ddd0;border-top:none;">' + '<h2 style="font-family:Arial,sans-serif;font-size:16px;margin:0 0 4px;">Score by category</h2>' + '<p style="font-family:Arial,sans-serif;font-size:12px;color:#7d7084;margin:0 0 10px;">Percentage correct in each area, against the ' + data.tier + ' passing threshold of ' + threshold + '%.</p>' + '<table role="presentation" width="100%" style="border-collapse:collapse;">' + barRows + '</table>' + calloutsHtml + '<h2 style="font-family:Arial,sans-serif;font-size:16px;margin:28px 0 4px;">Full breakdown</h2>' + '<table role="presentation" width="100%" style="border-collapse:collapse;">' + '<tr><th style="text-align:left;padding:8px 10px;border-bottom:2px solid #241626;font-family:Arial,sans-serif;font-size:12px;">Category</th><th style="text-align:right;padding:8px 10px;border-bottom:2px solid #241626;font-family:Arial,sans-serif;font-size:12px;">Correct</th><th style="text-align:right;padding:8px 10px;border-bottom:2px solid #241626;font-family:Arial,sans-serif;font-size:12px;">Score</th></tr>' + tableRows + '<tr><td style="padding:8px 10px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;">Overall</td><td style="padding:8px 10px;text-align:right;font-family:Arial,sans-serif;font-size:13px;font-weight:700;">' + data.score + ' / ' + data.total + '</td><td style="padding:8px 10px;text-align:right;font-family:Arial,sans-serif;font-size:13px;font-weight:700;">' + data.percent + '%</td></tr>' + '</table>' + '<h2 style="font-family:Arial,sans-serif;font-size:16px;margin:28px 0 8px;">What this certification means</h2>' + '<p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#5b4f63;margin:0;">' + meaning + '</p>' + '<h2 style="font-family:Arial,sans-serif;font-size:16px;margin:28px 0 8px;">Next steps</h2>' + '<table role="presentation" width="100%" style="border-collapse:collapse;background:#201723;border-radius:8px;">' + '<tr><td style="padding:16px 18px;">' + '<div style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#fff;">Keep building — 20% off any Ingles Legal course</div>' + '<div style="font-family:Arial,sans-serif;font-size:12px;color:#c6b6cc;margin-top:2px;">Use this code at checkout within 30 days of this result.</div>' + '<div style="display:inline-block;margin-top:10px;padding:6px 12px;background:#3a2b3f;border-radius:6px;font-family:monospace;font-size:13px;color:#c9a96e;font-weight:700;letter-spacing:1px;">' + PROMO_CODE + '</div>' + '</td></tr>' + '</table>' + '<table role="presentation" width="100%" style="border-collapse:collapse;background:#fff;border:1px solid #e6ddd0;border-radius:8px;margin-top:14px;">' + '<tr><td style="padding:16px 18px;">' + '<div style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#241626;">Add a recorded interview assessment</div>' + '<div style="font-family:Arial,sans-serif;font-size:12px;color:#5b4f63;margin-top:4px;line-height:1.5;">A 15-minute recorded interview, reviewed and scored alongside this exam, gives employers a fuller picture of spoken fluency and professional communication. $10 one time.</div>' + '<div style="font-family:Arial,sans-serif;font-size:12px;color:#7d7084;margin-top:10px;">Reply to this email if you would like to add it, we will follow up with details.</div>' + '</td></tr>' + '</table>' + '<p style="font-family:Arial,sans-serif;font-size:11px;color:#7d7084;margin-top:24px;">To verify this result, contact verify@ingleslegal.com with the Result ID above.</p>' + '</div>' + '<div style="font-family:Arial,sans-serif;font-size:11px;color:#7d7084;text-align:center;padding:16px;">Ingles Legal &middot; Legal English Certification &middot; ingleslegal.com</div>' + '</div>';
const subject = 'Your ' + data.tier + ' results: ' + data.percent + '% — ' + passText;
const plainText = 'Your ' + data.tier + ' exam results: ' + data.score + '/' + data.total + ' (' + data.percent + '%) — ' + passText + '. Result ID: ' + resultId + '. Strongest area: ' + (strongest ? strongest.cat : 'n/a') + '. Growth area: ' + (growth ? growth.cat : 'n/a') + '.';
GmailApp.sendEmail(data.email, subject, plainText, { htmlBody: html, name: 'Ingles Legal' });
}
/* ===== ADD-ON FOR VOCABULARY EXAM RESULTS =====
   Paste the two functions below at the END of your existing Code.gs
   (after sendResultsEmail), and change ONE line inside doPost — see note below.
   Nothing else in the file needs to change; tier exam handling is untouched. */
 
function handleVocab(data) {
  const sheets = getSheets();
  let vocabSheet = sheets.ss.getSheetByName('Vocabulary Results');
  if (!vocabSheet) {
    vocabSheet = sheets.ss.insertSheet('Vocabulary Results');
    vocabSheet.appendRow(['Result ID', 'Timestamp', 'Name', 'Email', 'Category', 'Variant', 'Correct', 'Total', 'Percent', 'Started At', 'Completed At']);
    vocabSheet.setFrozenRows(1);
  }
  const resultId = 'IL-VOC-' + Utilities.getUuid().split('-')[0].toUpperCase().slice(0, 6);
  vocabSheet.appendRow([resultId, new Date(), data.name, data.email, data.category, data.variant, data.correct, data.total, data.percent, data.startedAt, data.completedAt]);
  if (data.email) { sendVocabResultsEmail(data, resultId); }
}
 
function sendVocabResultsEmail(data, resultId) {
  const categoryLabel = String(data.category || '').replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  const variantLabel = data.variant === 'half' ? 'Half Exam' : String(data.variant || '').indexOf('full') !== -1 ? 'Full Exam' : ('Section ' + data.variant);
  const html = '<div style="font-family:Georgia,\'Times New Roman\',serif;max-width:640px;margin:0 auto;color:#241626;background:#f5f1e8;">'
    + '<div style="background:linear-gradient(165deg,#2a1b33,#3a2644);padding:32px 28px;border-radius:12px 12px 0 0;color:#fff;">'
    + '<div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;opacity:0.8;">Legal Vocabulary Exam</div>'
    + '<h1 style="font-family:Arial,sans-serif;margin:10px 0 4px;font-size:22px;">' + categoryLabel + '</h1>'
    + '<div style="font-family:Arial,sans-serif;font-size:13px;opacity:0.85;">' + (data.name || 'Candidate') + ' &middot; ' + variantLabel + '</div>'
    + '<div style="font-family:Arial,sans-serif;font-size:42px;font-weight:800;color:#d4b483;margin-top:16px;">' + data.percent + '%</div>'
    + '<div style="font-family:Arial,sans-serif;font-size:13px;opacity:0.85;">' + data.correct + ' of ' + data.total + ' questions correct</div>'
    + '<div style="margin-top:16px;font-family:Arial,sans-serif;font-size:12px;opacity:0.75;">Result ID <b>' + resultId + '</b></div>'
    + '</div>'
    + '<div style="background:#fbf8f2;padding:28px;border:1px solid #e6ddd0;border-top:none;">'
    + '<p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#5b4f63;margin:0;">Thanks for taking the Ingles Legal vocabulary exam. Keep practicing the terms you missed and try a different section or category any time — vocabulary mastery builds the foundation for the Tier certification exams.</p>'
    + '<table role="presentation" width="100%" style="border-collapse:collapse;background:#201723;border-radius:8px;margin-top:20px;">'
    + '<tr><td style="padding:16px 18px;">'
    + '<div style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#fff;">Ready for certification?</div>'
    + '<div style="font-family:Arial,sans-serif;font-size:12px;color:#c6b6cc;margin-top:2px;">Take a Tier exam to earn a shareable Legal English certification.</div>'
    + '</td></tr>'
    + '</table>'
    + '</div>'
    + '<div style="font-family:Arial,sans-serif;font-size:11px;color:#7d7084;text-align:center;padding:16px;">Ingles Legal &middot; Legal English Vocabulary &middot; ingleslegal.com</div>'
    + '</div>';
  const subject = 'Your vocabulary exam results: ' + data.percent + '%';
  const plainText = 'Your vocabulary exam results (' + categoryLabel + ', ' + variantLabel + '): ' + data.correct + '/' + data.total + ' (' + data.percent + '%). Result ID: ' + resultId + '.';
  GmailApp.sendEmail(data.email, subject, plainText, { htmlBody: html, name: 'Ingles Legal' });
}
 
/* ===== THE ONE-LINE CHANGE =====
   Inside your existing doPost(e) function, find this line:
 
     if (data.type === 'final') { handleFinal(data); } else if (data.type === 'batch') { handleBatch(data); }
 
   and change it to:
 
     if (data.type === 'final') { handleFinal(data); } else if (data.type === 'batch') { handleBatch(data); } else if (data.type === 'vocab') { handleVocab(data); }
 
   That's the only edit to existing code. Save, then Deploy > Manage deployments > edit the existing
   web app deployment > New version (keep the same URL) so the live webhook picks up the change. */

/* ===== CERTIFICATES AND VERIFICATION (added) ===== */
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
