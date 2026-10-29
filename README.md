# Ingles Legal Examination System

Free practice exams for legal English learners. Three systems:

## 1. Tier Exams (Proficiency)

Three self-assessment exams matching your proficiency levels:

- **Tier 1 Exam** (`tier-1-exam.html`) — Foundation level
- **Tier 2 Exam** (`tier-2-exam.html`) — Intermediate level  
- **Tier 3 Exam** (`tier-3-exam.html`) — Advanced level

These are published on www.ingleslegal.com/cert-exams/ as Claude Artifacts.

Each tier page opens on an entry screen styled like the Career Pathway Exams menu (`pathways/index.html`). There is no exam picker, since the visitor has already chosen the level. The candidate answers three profile questions, all required, then enters their name and email:

| Question | Answers |
|---|---|
| How often do you use legal English in your current role? | Once a week, Twice a week, Every day, I work 100% in English, Does not apply |
| What branch of law are you interested in? | Civil, Commercial, Criminal, Family, International, Immigration, Labor, Personal Injury, Others (opens a text box) |
| What is your level of English? | A1, A2, B1, B2, C1, C2 |

The candidate also picks the length, and can deep-link it with `?length=one|two|full`:

| Length | Questions | Proficiency Report |
|---|---|---|
| One batch | 50, drawn evenly from every topic | Yes, at 75% or higher |
| Two batches | 100, drawn evenly from every topic, in 2 batches of 50 | Yes, at 75% or higher |
| Full exam | All 150, in 3 batches of 50 | Yes, at 75% or higher |

The report and the results email name the length for One and Two batches.

The webhook payloads include `length` (`one`, `two` or `full`), and the final payload's `total` is the number of questions in that length.

The answers are sent with every batch and final webhook payload as `legalEnglishUse`, `branchOfLaw` (`Other: <text>` for Others) and `englishLevel`, appear in the downloaded results, and are logged by `apps-script/Code.gs` in three extra columns (Legal English Use, Branch of Law, English Level) on the Final Results and Batch Progress sheets. Redeploy the Apps Script web app after updating `Code.gs`.

---

## 2. Branch Pathway Exams (100 questions each)

One exam per bilingual branch learning pathway. Each has 100 questions mapped to the 8 courses of its pathway (about 13 per course, plus integrated file-audit scenarios for the capstone), and uses the same engine, look and results as the tier exams: 2 batches of 50, answers and rationale in the final report (not after each question), provisional results after batch 1, EXAM15 (15%, one use, 180 days) offer and share options on the results screen, download, and the results webhook (emailed report with score by category = score by course). The results screen also shows a score for each course and the recommended courses to start with. Pass mark: 75%.

| Pathway | File | Courses |
|---|---|---|
| Immigration Support Specialist | `pathways/immigration-exam.html` | IL-IMM-01 to 08 |
| Personal Injury Case Specialist | `pathways/personal-injury-exam.html` | IL-PI-01 to 08 |
| Workers' Compensation Case Manager | `pathways/workers-comp-exam.html` | IL-WC-01 to 08 |
| Family Law Paralegal | `pathways/family-law-exam.html` | IL-FAM-01 to 08 |
| Criminal Defense Legal Assistant | `pathways/criminal-defense-exam.html` | IL-CRIM-01 to 08 |

Live at `https://ingleslegal-hub.github.io/ingleslegal-exam/pathways/<file>`.

### Pathway exam menu

`pathways/index.html` is a single start page, styled like the vocabulary quiz, where the candidate picks:

1. the exam (the five pathways above),
2. the length (**Half** or **Full**), and
3. enters their name and email.

Live at `https://ingleslegal-hub.github.io/ingleslegal-exam/pathways/index.html`. Optional deep links preselect the dropdowns: `index.html?exam=family-law&length=half` (exam keys: `immigration`, `personal-injury`, `workers-comp`, `family-law`, `criminal-defense`).

The menu hands the name and email to the exam page through `sessionStorage` (never in the URL), and the exam starts straight on question 1. If an exam page is opened directly, it shows its own start screen with the same fields.

| Length | Questions | Proficiency Report |
|---|---|---|
| Full | 100, in 2 batches of 50 | Yes, at 75% or higher |
| Half | 50, drawn at random and evenly from the 8 courses (6 or 7 per course), in 1 batch | No (the results screen invites the candidate to take the Full exam) |

**/talent page section:** paste the entire contents of `pathways/embed-pathways.html` into a LearnWorlds **Embed** section (same steps as `vocabulary/embed-standalone.html`). It shows a heading, the five pathway names and one "Take Our Pathway Exam" button that opens the menu.

The question screen follows the vocabulary quiz layout: logo, progress bar, question count with the course name, one question per screen, and Previous / Next buttons. Previous works within a batch; a finished batch has already been reported, so it cannot be reopened. The results webhook payloads include `length` (`half` or `full`) and `total`; `tier` is unchanged.

---

## 3. Vocabulary Exams (Free Public Practice)

A **completely standalone, self-hosted vocabulary practice system** with **1,220 questions** across 12 legal categories. No Claude login required.

### Files

Located in `/vocabulary/`:

- **`quiz-standalone.html`** (17 KB) — The complete quiz engine
  - Email gate (soft opt-in for lead capture)
  - One question per screen
  - Real-time scoring & results
  - Full answer review with explanations
  - 12 categories, half/full exams per category
  - General Legal English split into 4 sections
  - Dark theme, mobile-responsive

- **`master.json`** (764 KB) — Question bank
  - 1,220 total questions across 12 legal categories
  - 3 difficulty tiers (basic, intermediate, advanced)
  - Quality-screened distractors
  - All categories: translation, common expressions, civil law, contract law, criminal law, immigration law, personal injury, family law, labor law, commercial law, other branches

- **`embed-standalone.html`** (8.5 KB) — "Take Our Vocabulary Test" button
  - Paste into your LearnWorlds /talent page
  - Dropdown with all 26 exam variants
  - Styled to match dark/gold palette

### Deployment

**To deploy vocabulary exams on www.ingleslegal.com:**

1. Create `/exams/vocabulary/` directory on your web server
2. Upload `quiz-standalone.html` + `master.json` (both in same folder)
3. Add `embed-standalone.html` to LearnWorlds /talent page (Embed section)
4. Test: visit `www.ingleslegal.com/exams/vocabulary/quiz-standalone.html`

**Wire email capture to backend (optional):**

Edit the `startExam()` function in `quiz-standalone.html` (line ~380) to send leads to LearnWorlds, Zapier, or Mailchimp. See `DEPLOYMENT.md` in `/vocabulary/` for examples.

---

## Repository Structure

```
ingleslegal-exam/
├── tier-1-exam.html           (Tier 1 proficiency exam)
├── tier-2-exam.html           (Tier 2 proficiency exam)
├── tier-3-exam.html           (Tier 3 proficiency exam)
├── pathways/                  (Branch pathway exams, 5 × 100 questions)
│   ├── index.html             (Menu: exam, Half/Full, name, email)
│   ├── embed-pathways.html    ("Free Career Pathway Exams" section for the /talent page)
│   └── *-exam.html            (The five pathway exams)
├── vocabulary/                (Free public vocabulary exams)
│   ├── quiz-standalone.html   (Quiz engine)
│   ├── master.json            (1,220 question bank)
│   ├── embed-standalone.html  (Button for /talent page)
│   └── DEPLOYMENT.md          (Detailed deployment guide)
└── README.md                  (This file)
```

---

## Key Features

### Tier Exams
- Proficiency assessment
- Published as Claude Artifacts
- Links from www.ingleslegal.com/cert-exams/

### Vocabulary Exams
- **Completely free** — no paywalls
- **No login required** — students don't need Claude accounts
- **Self-hosted** — runs on your server, not external platform
- **Email opt-in** — soft gate captures leads for your CRM
- **One question per screen** — reduces cognitive overload
- **Instant feedback** — scoring + full answer review
- **12 categories** — covers all major legal branches
- **Mobile responsive** — works on phones and tablets

---

## Getting Started

### For Local Development

```bash
# Clone this repo
git clone https://github.com/ingleslegal-hub/ingleslegal-exam.git
cd ingleslegal-exam

# Navigate to vocabulary exams
cd vocabulary

# Test locally (requires HTTP server)
# Option 1: Python
python3 -m http.server 8000

# Option 2: Node (if installed)
npx http-server

# Then visit: http://localhost:8000/quiz-standalone.html
```

### For Production Deployment

See `/vocabulary/DEPLOYMENT.md` for full instructions on:
- Server upload steps
- LearnWorlds page integration
- Email capture backend wiring
- Troubleshooting

---

## Question Bank Details

**1,220 questions** organized by:

- **Categories** (12 total):
  - General Legal English (200+ questions)
  - Translation (EN ↔ ES)
  - Most Common Legal Expressions
  - Civil Law
  - Contract Law
  - Criminal Law
  - Immigration Law
  - Personal Injury
  - Family Law
  - Labor Law
  - Commercial Law
  - Other Branches

- **Difficulty Tiers**:
  - Basic (~33% of questions)
  - Intermediate (~33%)
  - Advanced (~33%)

- **Question formats** (rebuilt Oct 2026): term → definition, definition → term,
  fill-in-the-blank sentences, and English ↔ Spanish equivalents
- **Quality Checks**:
  - Distractors are look-alike terms from the same sub-topic (e.g. void / voidable / unenforceable),
    with true synonyms excluded so only one option is correct
  - No length bias (correct option is the longest only ~20–30% of the time)
  - No position bias (answers balanced across options A–D)
  - No giveaway wording (definitions avoid repeating the term being tested)
  - Every explanation gives the definition, a Spanish equivalent, and the difference
    from the most likely wrong answer
  - Half exams draw a random half of the category across all difficulty tiers

---

## Next Steps

1. **Deploy vocabulary exams** → Upload to `/exams/vocabulary/` on your server
2. **Add button to /talent page** → Paste `embed-standalone.html` into LearnWorlds
3. **Set up email capture** → Wire to LearnWorlds, Zapier, or Mailchimp
4. **Announce to students** → Start driving free exam traffic

---

## Support

For deployment help, see `/vocabulary/DEPLOYMENT.md`.

For questions about the system, contact Felipe (felipe.toro.e@gmail.com).

---

**Last Updated:** October 18, 2026  
**Status:** Ready for production

---

## Proficiency Reports and verification

Ingles Legal is not a certifying body, so candidate-facing text never says certificate or certification. Code identifiers (`cert*` functions, the `certificate` webhook type, the `Certificates` sheet) keep their names so stored records and verification keep working.

Every exam issues a vertical **Legal English Proficiency Report** when the candidate passes:

| Exam | When it appears |
|---|---|
| Tier 1, 2, 3 | Completed exam of any length (not stopped early) at 75% or higher |
| Pathway exams (5) | **Full Exam only**, completed at 75% or higher (Half Exam shows a prompt to take the Full Exam) |
| Vocabulary | **Full Exam only**, 75% or higher (Half Exam shows a prompt to take the Full Exam) |

The report shows the strongest skills (golden ribbon), a skills snapshot, windows of opportunity with a recommended pathway, the EXAM15 (15%, one use, 180 days) offer, a report ID and a QR code. Candidates can view it, save it as PDF (print dialog) or download it as a file.

**Verification.** Each report gets an ID like `IL-T2-XXXXXXXX`. The exam posts it (type `certificate`) to the same Apps Script webhook as the results, which stores it in a `Certificates` sheet. `verify.html` looks the ID up and shows the full name, exam, score and date. Setup steps are in `apps-script/certificates.gs` (paste into the existing Apps Script project and redeploy).

The report module is embedded in each exam file (it must work as a standalone file). To change the design, edit it in one exam file and copy the block between the two `<script>` tags at the end of the page into the others.
