# Ingles Legal Examination System

Free practice exams for legal English learners. Two systems:

## 1. Tier Exams (Certification)

Three self-assessment exams matching your certification levels:

- **Tier 1 Exam** (`tier-1-exam.html`) — Foundation level
- **Tier 2 Exam** (`tier-2-exam.html`) — Intermediate level  
- **Tier 3 Exam** (`tier-3-exam.html`) — Advanced level

These are published on www.ingleslegal.com/cert-exams/ as Claude Artifacts.

---

## 2. Vocabulary Exams (Free Public Practice)

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
├── tier-1-exam.html           (Tier 1 certification exam)
├── tier-2-exam.html           (Tier 2 certification exam)
├── tier-3-exam.html           (Tier 3 certification exam)
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
- Certification assessment
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

- **Quality Checks**:
  - No length bias (correct answer isn't always longer/shorter)
  - No position bias (correct answer random in options 1-4)
  - Distractors from actual exam bank, not invented
  - Explanations for every answer

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

**Last Updated:** September 29, 2026  
**Status:** Ready for production
