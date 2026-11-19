const SHEET_ID_PROPERTY = 'RESULTS_SHEET_ID';
 
const TIER_THRESHOLDS = { 'Tier 1': 75, 'Tier 2': 75, 'Tier 3': 75 };
 
const TIER_MEANING = {
'Tier 1': 'Tier 1 confirms working proficiency in legal English and the core vocabulary of major US practice areas, reading intake notes, following basic procedural language, and communicating with supervision. It is Ingleslegal\'s recommended bar for entry-level legal support roles.',
'Tier 2': 'Tier 2 confirms the candidate can read and draft at an advanced professional level across core US legal practice areas, and can operate day-to-day legal software without supervision. A Tier 2 pass is Ingleslegal\'s recommended bar for mid-level legal support hires.',
'Tier 3': 'Tier 3 confirms expert-level fluency, including complex litigation vocabulary and cross-border contract work, operating independently on high-stakes matters. It is Ingleslegal\'s recommended bar for senior legal support and paralegal roles.'
};
 
const PROMO_CODE = 'EXAM15';

var IL_EXAM_BASE = 'https://ingleslegal-hub.github.io/ingleslegal-exam/';
var WAITLIST_URL = IL_EXAM_BASE + 'waitlist.html';
var LOGO_URL = IL_EXAM_BASE + 'logo-transparent.png';
var LOGO_IMG = '<img src="' + LOGO_URL + '" width="180" alt="Ingleslegal" style="display:block;width:180px;max-width:60%;height:auto;border:0;margin:0 0 20px;">';
var IL_PATHWAYS = {
  immigration: { name: 'Immigration Support Specialist', month: 'January 2027', exam: 'pathways/immigration-exam.html', desc: 'Run an immigration file from the first call to filing and court date: family-based, humanitarian and removal-defense support.', size: '8 courses &middot; 30 hours' },
  launchpad: { name: 'Legal English Launchpad', month: 'February 2027', exam: '', desc: 'The starting point for low to intermediate English: workplace English, phone and email skills, first legal vocabulary and simple documents.', size: '10 courses &middot; 40 hours' },
  personal_injury: { name: 'Personal Injury Case Specialist', month: 'February 2027', exam: 'pathways/personal-injury-exam.html', desc: 'Carry a personal injury claim from the accident call to settlement disbursement, with a focus on pre-litigation.', size: '8 courses &middot; 30 hours' },
  workers_comp: { name: "Workers' Compensation Case Manager", month: 'March 2027', exam: 'pathways/workers-comp-exam.html', desc: "Manage an injured worker's case from first report to settlement, with examples from California, Texas, Florida and Illinois.", size: '8 courses &middot; 30 hours' },
  family_law: { name: 'Family Law Paralegal', month: 'March 2027', exam: 'pathways/family-law-exam.html', desc: 'Support divorce, custody, support and protective-order cases from intake to final judgment, with California and Texas examples.', size: '8 courses &middot; 30 hours' },
  criminal_defense: { name: 'Criminal Defense Legal Assistant', month: 'March 2027', exam: 'pathways/criminal-defense-exam.html', desc: 'Support a defense team from the first jail call to sentencing: court calendars, discovery and immigration consequences for Spanish-speaking clients.', size: '8 courses &middot; 30 hours' }
};
var PATHWAY_BY_LABEL = { 'Immigration Pathway': 'immigration', 'Personal Injury Pathway': 'personal_injury', "Workers' Compensation Pathway": 'workers_comp', 'Family Law Pathway': 'family_law', 'Criminal Defense Pathway': 'criminal_defense' };
var PATHWAY_CODES = { immigration: 'IMM', personal_injury: 'PI', workers_comp: 'WC', family_law: 'FAM', criminal_defense: 'CRIM' };
 
function doPost(e) {
try {
const data = JSON.parse(e.postData.contents);
if (data.type === 'final') { handleFinal(data); } else if (data.type === 'batch') { handleBatch(data); } else if (data.type === 'vocab') { handleVocab(data); } else if (data.type === 'certificate') { return saveCertificate_(data); } else if (data.type === 'waitlist') { return handleWaitlist_(data); }
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
if (!ss) { ss = SpreadsheetApp.create('Ingleslegal — Exam Results Log'); props.setProperty(SHEET_ID_PROPERTY, ss.getId()); }
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
ensureProfileHeaders_(finalSheet, 12);
ensureProfileHeaders_(batchSheet, 10);
return { ss: ss, finalSheet: finalSheet, batchSheet: batchSheet };
}
 
// Entry-screen answers from the Tier exams, stored after the existing columns so older rows still line up.
const PROFILE_HEADERS = ['Legal English Use', 'Branch of Law', 'English Level'];
function ensureProfileHeaders_(sheet, baseCols) {
if (sheet.getLastColumn() < baseCols + PROFILE_HEADERS.length) {
sheet.getRange(1, baseCols + 1, 1, PROFILE_HEADERS.length).setValues([PROFILE_HEADERS]);
}
}
function profileCells_(data) {
return [data.legalEnglishUse || '', data.branchOfLaw || '', data.englishLevel || ''];
}

// Shown after the exam name when a shorter length was chosen (Tier: one/two batches; pathway: half).
function lengthSuffix_(data) {
var names = { one: 'One batch', two: 'Two batches', half: 'Half exam' };
var n = names[data.length];
return n ? ' &middot; ' + n + ' (' + data.total + ' questions)' : '';
}

function handleBatch(data) {
const sheets = getSheets();
sheets.batchSheet.appendRow([new Date(), data.tier, data.name, data.email, data.batch, data.score, data.total, data.percent, data.startedAt, data.completedAt].concat(profileCells_(data)));
}
 
function handleFinal(data) {
const sheets = getSheets();
const answers = data.answers || [];
const breakdown = categoryBreakdown(answers);
const resultId = makeResultId(data.tier);
sheets.finalSheet.appendRow([resultId, new Date(), data.tier, data.name, data.email, data.score, data.total, data.percent, data.passed, data.startedAt, data.completedAt, JSON.stringify(breakdown)].concat(profileCells_(data)));
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
const pwKey = PATHWAY_BY_LABEL[tier];
if (pwKey) return 'IL-' + PATHWAY_CODES[pwKey] + '-' + rand;
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
const passed = !!data.passed; const reportId = (passed && /^IL-[A-Z0-9]{1,5}-[A-Z2-9]{8}$/.test(String(data.certId || ''))) ? String(data.certId) : ''; const verifyUrl = 'https://ingleslegal-hub.github.io/ingleslegal-exam/verify.html' + (reportId ? '?id=' + reportId : ''); const verifyLine = reportId ? 'Anyone can check this Proficiency Report on the <a href="' + verifyUrl + '" style="color:#7d7084;">Ingleslegal verify page</a> with Report ID <b>' + reportId + '</b>. Questions? Contact exams@ingleslegal.com.' : 'Keep this Result ID for your records. Questions? Contact exams@ingleslegal.com.';
const passText = passed ? 'PASSED' : 'Not yet passing';
const nextKey = PATHWAY_BY_LABEL[data.tier]; const nextPw = nextKey ? IL_PATHWAYS[nextKey] : null;
const nextTitle = nextPw ? ('The ' + nextPw.name + ' pathway opens in ' + nextPw.month) : 'Six learning pathways open January to March 2027';
const nextLink = WAITLIST_URL + (nextKey ? '?pathway=' + nextKey : '');
const nextCta = nextPw ? 'Notify me when it opens' : 'Notify me when pathways open';
const passBg = passed ? 'rgba(12,163,12,0.25)' : 'rgba(208,59,59,0.25)';
const threshold = TIER_THRESHOLDS[data.tier] || 75;
const meaning = TIER_MEANING[data.tier] || (nextPw ? (passed ? ('You met the ' + threshold + '% passing bar for the ' + nextPw.name + ' exam. You already handle the core legal English of this kind of case work, and the pathway builds on it step by step.') : ('This exam measures the legal English used in ' + nextPw.name + ' work. Your category scores show where to focus first, and the pathway covers each of these areas step by step.')) : '');
const strongest = breakdown.length ? breakdown[0] : null;
const growth = breakdown.length ? breakdown[breakdown.length - 1] : null;
const barRows = breakdown.map(function (b) { return barRowHtml(b, threshold); }).join('');
const tableRows = breakdown.map(tableRowHtml).join('');
const calloutsHtml = (strongest && growth) ? ('<table role="presentation" width="100%" style="border-collapse:collapse;margin-top:16px;"><tr><td style="width:50%;padding:14px;background:#fbf8f2;border:1px solid #e6ddd0;border-radius:8px;" valign="top"><div style="font-family:Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#0ca30c;font-weight:700;">Strongest area</div><div style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;margin-top:4px;color:#241626;">' + strongest.cat + '</div><div style="font-family:Arial,sans-serif;font-size:13px;color:#7d7084;margin-top:2px;">' + strongest.percent + '% correct</div></td><td style="width:4%;"></td><td style="width:46%;padding:14px;background:#fbf8f2;border:1px solid #e6ddd0;border-radius:8px;" valign="top"><div style="font-family:Arial,sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:#d03b3b;font-weight:700;">Growth area</div><div style="font-family:Arial,sans-serif;font-size:15px;font-weight:700;margin-top:4px;color:#241626;">' + growth.cat + '</div><div style="font-family:Arial,sans-serif;font-size:13px;color:#7d7084;margin-top:2px;">' + growth.percent + '% correct</div></td></tr></table>') : '';
const html = '<div style="font-family:Georgia,\'Times New Roman\',serif;max-width:640px;margin:0 auto;color:#241626;background:#f5f1e8;">' + '<div style="background:linear-gradient(165deg,#2a1b33,#3a2644);padding:32px 28px;border-radius:12px 12px 0 0;color:#fff;">' + LOGO_IMG + '<div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;opacity:0.8;">Legal English Proficiency Assessment</div>' + '<h1 style="font-family:Arial,sans-serif;margin:10px 0 4px;font-size:22px;">' + data.tier + ' Proficiency Exam' + lengthSuffix_(data) + '</h1>' + '<div style="font-family:Arial,sans-serif;font-size:13px;opacity:0.85;">' + (data.name || 'Candidate') + ' &middot; completed ' + formatDate(data.completedAt) + '</div>' + '<div style="font-family:Arial,sans-serif;font-size:42px;font-weight:800;color:#d4b483;margin-top:16px;">' + data.percent + '%</div>' + '<div style="font-family:Arial,sans-serif;font-size:13px;opacity:0.85;">' + data.score + ' of ' + data.total + ' questions correct</div>' + '<div style="display:inline-block;margin-top:14px;padding:6px 14px;border-radius:20px;background:' + passBg + ';font-family:Arial,sans-serif;font-weight:700;font-size:12px;">' + passText + '</div>' + '<div style="margin-top:16px;font-family:Arial,sans-serif;font-size:12px;opacity:0.75;">' + (reportId ? 'Report ID <b>' + reportId : 'Result ID <b>' + resultId) + '</b> &middot; Passing threshold: ' + threshold + '%</div>' + '</div>' + '<div style="background:#fbf8f2;padding:28px;border:1px solid #e6ddd0;border-top:none;">' + '<h2 style="font-family:Arial,sans-serif;font-size:16px;margin:0 0 4px;">Score by category</h2>' + '<p style="font-family:Arial,sans-serif;font-size:12px;color:#7d7084;margin:0 0 10px;">Percentage correct in each area, against the ' + data.tier + ' passing threshold of ' + threshold + '%.</p>' + '<table role="presentation" width="100%" style="border-collapse:collapse;">' + barRows + '</table>' + calloutsHtml + '<h2 style="font-family:Arial,sans-serif;font-size:16px;margin:28px 0 4px;">Full breakdown</h2>' + '<table role="presentation" width="100%" style="border-collapse:collapse;">' + '<tr><th style="text-align:left;padding:8px 10px;border-bottom:2px solid #241626;font-family:Arial,sans-serif;font-size:12px;">Category</th><th style="text-align:right;padding:8px 10px;border-bottom:2px solid #241626;font-family:Arial,sans-serif;font-size:12px;">Correct</th><th style="text-align:right;padding:8px 10px;border-bottom:2px solid #241626;font-family:Arial,sans-serif;font-size:12px;">Score</th></tr>' + tableRows + '<tr><td style="padding:8px 10px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;">Overall</td><td style="padding:8px 10px;text-align:right;font-family:Arial,sans-serif;font-size:13px;font-weight:700;">' + data.score + ' / ' + data.total + '</td><td style="padding:8px 10px;text-align:right;font-family:Arial,sans-serif;font-size:13px;font-weight:700;">' + data.percent + '%</td></tr>' + '</table>' + '<h2 style="font-family:Arial,sans-serif;font-size:16px;margin:28px 0 8px;">What this score means</h2>' + '<p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#5b4f63;margin:0;">' + meaning + '</p>' + '<h2 style="font-family:Arial,sans-serif;font-size:16px;margin:28px 0 8px;">Next steps</h2>' + '<table role="presentation" width="100%" style="border-collapse:collapse;background:#2b1b33;border-radius:8px;">' + '<tr><td style="padding:16px 18px;">' + '<div style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#fff;">' + nextTitle + '</div>' + '<div style="font-family:Arial,sans-serif;font-size:12px;color:#c6b6cc;margin-top:2px;">Save your code: 15% off your first pathway when it opens. Valid for 180 days from this result.</div>' + '<div style="display:inline-block;margin-top:10px;padding:6px 12px;background:#3a2847;border-radius:6px;font-family:monospace;font-size:13px;color:#c9a96e;font-weight:700;letter-spacing:1px;">' + PROMO_CODE + '</div>' + '<div style="margin-top:14px;"><a href="' + nextLink + '" style="display:inline-block;padding:9px 16px;background:#c9a96e;color:#2b1b33;border-radius:6px;font-family:Arial,sans-serif;font-size:13px;font-weight:700;text-decoration:none;">' + nextCta + '</a></div>' + '</td></tr>' + '</table>' + '<p style="font-family:Arial,sans-serif;font-size:11px;color:#7d7084;margin-top:24px;">' + verifyLine + '</p>' + '</div>' + '<div style="font-family:Arial,sans-serif;font-size:11px;color:#7d7084;text-align:center;padding:16px;">Ingleslegal &middot; Legal English Proficiency Assessment &middot; ingleslegal.com</div>' + '</div>';
const subject = 'Your ' + data.tier + ' results: ' + data.percent + '% — ' + passText;
const plainText = 'Your ' + data.tier + ' exam results: ' + data.score + '/' + data.total + ' (' + data.percent + '%) — ' + passText + (reportId ? '. Report ID: ' + reportId + ' (verify: ' + verifyUrl + ')' : '. Result ID: ' + resultId) + '. Strongest area: ' + (strongest ? strongest.cat : 'n/a') + '. Growth area: ' + (growth ? growth.cat : 'n/a') + '.';
GmailApp.sendEmail(data.email, subject, plainText, { htmlBody: html, name: 'Ingleslegal Exams', from: 'exams@ingleslegal.com', replyTo: 'exams@ingleslegal.com' });
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
 
function sendVocabResultsEmail(data, resultId) { const vReportId = (Number(data.percent) >= 75 && /^IL-[A-Z0-9]{1,5}-[A-Z2-9]{8}$/.test(String(data.certId || ''))) ? String(data.certId) : '';
  const categoryLabel = String(data.category || '').replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  const variantLabel = data.variant === 'half' ? 'Half Exam' : String(data.variant || '').indexOf('full') !== -1 ? 'Full Exam' : ('Section ' + data.variant);
  const html = '<div style="font-family:Georgia,\'Times New Roman\',serif;max-width:640px;margin:0 auto;color:#241626;background:#f5f1e8;">'
    + '<div style="background:linear-gradient(165deg,#2a1b33,#3a2644);padding:32px 28px;border-radius:12px 12px 0 0;color:#fff;">' + LOGO_IMG
    + '<div style="font-family:Arial,sans-serif;font-size:11px;letter-spacing:1px;text-transform:uppercase;opacity:0.8;">Legal Vocabulary Exam</div>'
    + '<h1 style="font-family:Arial,sans-serif;margin:10px 0 4px;font-size:22px;">' + categoryLabel + '</h1>'
    + '<div style="font-family:Arial,sans-serif;font-size:13px;opacity:0.85;">' + (data.name || 'Candidate') + ' &middot; ' + variantLabel + '</div>'
    + '<div style="font-family:Arial,sans-serif;font-size:42px;font-weight:800;color:#d4b483;margin-top:16px;">' + data.percent + '%</div>'
    + '<div style="font-family:Arial,sans-serif;font-size:13px;opacity:0.85;">' + data.correct + ' of ' + data.total + ' questions correct</div>'
    + '<div style="margin-top:16px;font-family:Arial,sans-serif;font-size:12px;opacity:0.75;">' + (vReportId ? 'Report ID <b>' + vReportId + '</b> &middot; <a href="https://ingleslegal-hub.github.io/ingleslegal-exam/verify.html?id=' + vReportId + '" style="color:#d4b483;">Verify this report</a>' : 'Result ID <b>' + resultId + '</b>') + '</div>'
    + '</div>'
    + '<div style="background:#fbf8f2;padding:28px;border:1px solid #e6ddd0;border-top:none;">'
    + '<p style="font-family:Arial,sans-serif;font-size:13px;line-height:1.6;color:#5b4f63;margin:0;">Thanks for taking the Ingleslegal vocabulary exam. Keep practicing the terms you missed and try a different section or category any time — vocabulary mastery builds the foundation for the Tier proficiency exams.</p>'
    + '<table role="presentation" width="100%" style="border-collapse:collapse;background:#2b1b33;border-radius:8px;margin-top:20px;">'
    + '<tr><td style="padding:16px 18px;">'
    + '<div style="font-family:Arial,sans-serif;font-size:14px;font-weight:700;color:#fff;">Ready for the next step?</div>'
    + '<div style="font-family:Arial,sans-serif;font-size:12px;color:#c6b6cc;margin-top:2px;">Take a Tier exam to receive a shareable Legal English Proficiency Report.</div>'
    + '</td></tr>'
    + '</table>'
    + '</div>'
    + '<div style="font-family:Arial,sans-serif;font-size:11px;color:#7d7084;text-align:center;padding:16px;">Ingleslegal &middot; Legal English Vocabulary &middot; ingleslegal.com</div>'
    + '</div>';
  const subject = 'Your vocabulary exam results: ' + data.percent + '%';
  const plainText = 'Your vocabulary exam results (' + categoryLabel + ', ' + variantLabel + '): ' + data.correct + '/' + data.total + ' (' + data.percent + '%)' + (vReportId ? '. Report ID: ' + vReportId + ' (verify: https://ingleslegal-hub.github.io/ingleslegal-exam/verify.html?id=' + vReportId + ')' : '. Result ID: ' + resultId) + '.';
  GmailApp.sendEmail(data.email, subject, plainText, { htmlBody: html, name: 'Ingleslegal Exams', from: 'exams@ingleslegal.com', replyTo: 'exams@ingleslegal.com' });
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

/* ===== PATHWAYS WAITLIST ===== */
function cellSafe_(v) { v = String(v == null ? '' : v); return /^[=+\-@]/.test(v) ? "'" + v : v; }
function esc_(v) { return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function handleWaitlist_(data) {
  var email = String(data.email || '').trim().slice(0, 200);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json_({ ok: false, error: 'invalid email' });
  var name = String(data.name || '').trim().slice(0, 120);
  var raw = Array.isArray(data.pathways) ? data.pathways : [data.pathways];
  var keys = raw.map(String).filter(function (k) { return k === 'all' || IL_PATHWAYS.hasOwnProperty(k); });
  if (!keys.length || keys.indexOf('all') !== -1) keys = Object.keys(IL_PATHWAYS);
  var source = String(data.source || '').slice(0, 80);
  var consent = data.consent === true || data.consent === 'yes';
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var ss = getSheets().ss;
    var sh = ss.getSheetByName('Waitlist');
    if (!sh) { sh = ss.insertSheet('Waitlist'); sh.appendRow(['Timestamp', 'Name', 'Email', 'Pathways', 'Source', 'Consent']); sh.setFrozenRows(1); }
    sh.appendRow([new Date(), cellSafe_(name), cellSafe_(email), keys.map(function (k) { return IL_PATHWAYS[k].name; }).join(', '), cellSafe_(source), consent ? 'Yes' : '']);
  } finally { lock.releaseLock(); }
  var cache = CacheService.getScriptCache();
  var ck = 'wl_' + Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, email.toLowerCase())).replace(/=/g, '');
  if (!cache.get(ck)) { cache.put(ck, '1', 21600); sendWaitlistEmail_(name, email, keys); }
  return json_({ ok: true });
}

function sendWaitlistEmail_(name, email, keys) {
  var F = 'font-family:Arial,sans-serif;';
  var cards = Object.keys(IL_PATHWAYS).map(function (k) {
    var p = IL_PATHWAYS[k], mine = keys.indexOf(k) !== -1;
    var exam = p.exam ? '<a href="' + IL_EXAM_BASE + p.exam + '" style="color:#7a5a2e;font-weight:700;text-decoration:none;">Take the free exam</a>' : '<span style="color:#7d7084;">Free exam coming soon</span>';
    return '<tr><td style="padding:14px 14px;border:1px solid ' + (mine ? '#c9a96e' : '#e6ddd0') + ';border-left:4px solid ' + (mine ? '#c9a96e' : '#e6ddd0') + ';background:#fff;border-radius:6px;">'
      + '<table role="presentation" width="100%" style="border-collapse:collapse;"><tr>'
      + '<td style="' + F + 'font-size:14px;font-weight:700;color:#241626;">' + esc_(p.name) + (mine ? ' <span style="display:inline-block;margin-left:6px;padding:2px 8px;background:#2b1b33;color:#d4b483;border-radius:10px;font-size:10px;letter-spacing:0.5px;text-transform:uppercase;vertical-align:middle;">On your list</span>' : '') + '</td>'
      + '<td style="' + F + 'font-size:12px;font-weight:700;color:#7a5a2e;text-align:right;white-space:nowrap;">Opens ' + p.month + '</td></tr></table>'
      + '<div style="' + F + 'font-size:12px;line-height:1.5;color:#5b4f63;margin-top:4px;">' + p.desc + '</div>'
      + '<div style="' + F + 'font-size:11px;color:#7d7084;margin-top:6px;">' + p.size + ' &middot; ' + exam + '</div>'
      + '</td></tr><tr><td style="height:8px;line-height:8px;font-size:0;">&nbsp;</td></tr>';
  }).join('');
  var first = name ? esc_(String(name).split(' ')[0]) : '';
  var html = '<div style="font-family:Georgia,\'Times New Roman\',serif;max-width:640px;margin:0 auto;color:#241626;background:#f5f1e8;">'
    + '<div style="background:linear-gradient(165deg,#2a1b33,#3a2644);padding:32px 28px;border-radius:12px 12px 0 0;color:#fff;">' + LOGO_IMG
    + '<div style="' + F + 'font-size:11px;letter-spacing:1px;text-transform:uppercase;opacity:0.8;">Ingleslegal Learning Pathways</div>'
    + '<h1 style="' + F + 'margin:10px 0 6px;font-size:22px;">Six learning pathways are on the way</h1>'
    + '<div style="' + F + 'font-size:13px;line-height:1.5;opacity:0.85;">Step-by-step bilingual training for legal professionals who want to work with U.S. law firms. Each pathway is a complete set of courses for one branch of U.S. law.</div>'
    + '<div style="' + F + 'font-size:42px;font-weight:800;color:#d4b483;margin-top:16px;">2027</div>'
    + '<div style="' + F + 'font-size:13px;opacity:0.85;">Opening January to March</div>'
    + '</div>'
    + '<div style="background:#fbf8f2;padding:28px;border:1px solid #e6ddd0;border-top:none;">'
    + '<h2 style="' + F + 'font-size:16px;margin:0 0 4px;">The upcoming pathways</h2>'
    + '<p style="' + F + 'font-size:12px;color:#7d7084;margin:0 0 12px;">The ones you chose are marked.</p>'
    + '<table role="presentation" width="100%" style="border-collapse:collapse;">' + cards + '</table>'
    + '<table role="presentation" width="100%" style="border-collapse:collapse;margin-top:20px;background:#2b1b33;border-radius:8px;"><tr><td style="padding:20px 18px;">'
    + '<div style="' + F + 'font-size:20px;font-weight:700;color:#fff;">You\'re on the list' + (first ? ', ' + first : '') + '</div>'
    + '<div style="' + F + 'font-size:13px;line-height:1.5;color:#c6b6cc;margin-top:4px;">We\'ll email you the day your pathway opens. Nothing else to do for now.</div>'
    + '</td></tr></table>'
    + '<h2 style="' + F + 'font-size:16px;margin:28px 0 8px;">While you wait</h2>'
    + '<table role="presentation" width="100%" style="border-collapse:collapse;background:#2b1b33;border-radius:8px;">'
    + '<tr><td style="padding:16px 18px;">'
    + '<div style="' + F + 'font-size:14px;font-weight:700;color:#fff;">See where your legal English stands today</div>'
    + '<div style="' + F + 'font-size:12px;color:#c6b6cc;margin-top:2px;">Every exam is free, and your results arrive by email. Finish one to get a 15% code for your first pathway.</div>'
    + '<div style="margin-top:14px;"><a href="' + IL_EXAM_BASE + '" style="display:inline-block;padding:9px 16px;background:#c9a96e;color:#2b1b33;border-radius:6px;' + F + 'font-size:13px;font-weight:700;text-decoration:none;">Choose your free exam</a></div>'
    + '</td></tr></table>'
    + '<p style="' + F + 'font-size:11px;color:#7d7084;margin-top:24px;">You are receiving this because you asked to be notified about Ingleslegal learning pathways. To be removed from the list, reply to this email or write to exams@ingleslegal.com.</p>'
    + '</div>'
    + '<div style="' + F + 'font-size:11px;color:#7d7084;text-align:center;padding:16px;">Ingleslegal &middot; Learning Pathways &middot; ingleslegal.com</div>'
    + '</div>';
  var plain = 'Six Ingleslegal learning pathways open January to March 2027: ' + Object.keys(IL_PATHWAYS).map(function (k) { return IL_PATHWAYS[k].name + ' (' + IL_PATHWAYS[k].month + ')'; }).join(', ') + '.\n\nYou\'re on the list. We\'ll email you the day your pathway opens: ' + keys.map(function (k) { return IL_PATHWAYS[k].name; }).join(', ') + '.\n\nWhile you wait, take a free exam: ' + IL_EXAM_BASE + '\n\nTo be removed, reply to this email.';
  GmailApp.sendEmail(email, 'You\'re on the list: Ingleslegal learning pathways', plain, { htmlBody: html, name: 'Ingleslegal Exams', from: 'exams@ingleslegal.com', replyTo: 'exams@ingleslegal.com' });
}

