# Standalone Quiz Deployment Guide

## The Fix

The original solution used Claude Artifacts, which required users to have Claude access to take the exams. This defeated the goal of truly **free, public exams**.

**Solution:** `quiz-standalone.html` is a complete, self-hosted quiz application that works independently on your website with **zero external dependencies**.

---

## Files You Have

1. **`quiz-standalone.html`** — The complete quiz engine (email gate, one question at a time, scoring, answer review)
2. **`master.json`** — The 1,220-question vocabulary bank (all 12 categories)
3. **`embed-standalone.html`** — The "Take Our Vocabulary Test" button + dropdown to add to your /talent page

---

## Deployment Steps

### Step 1: Upload Files to Your Server

Create a `/exams` directory on your website (e.g., `www.ingleslegal.com/exams/`) and upload:

- `quiz-standalone.html`
- `master.json`

Both files **must be in the same directory**.

```
www.ingleslegal.com/
├── exams/
│   ├── quiz-standalone.html
│   └── master.json
└── talent/
    └── index.html
```

### Step 2: Add the Button to Your /Talent Page

1. Open LearnWorlds Site Builder → **Talent** page
2. Add a new **Embed** section (or use the existing empty one)
3. Click the section → open code editor (`</>` icon)
4. Paste the entire contents of **`embed-standalone.html`** into the "Embeddable script" box
5. Click **Update** → **Save** → **Publish**

The button will appear with a dropdown listing all 12 categories and exam variants.

---

## How It Works

### For Users (Your Students)

1. Click "Take Our Vocabulary Test"
2. Dropdown opens showing all categories
3. Click a category link (e.g., "Contract Law → Full exam")
4. Quiz loads and prompts for name/email (optional)
5. One question per screen
6. After submitting, shows score + full answer review

### For You (Lead Capture)

Currently: Names/emails are stored in the **user's browser session only** (soft opt-in speed bump).

To capture to a CRM/mailing list, see **Step 3** below.

---

## Step 3: Wire Email Capture to Your Backend (Optional)

The quiz currently stores opt-in data client-side:
```javascript
sessionStorage.setItem('examUser', JSON.stringify({ 
  name, email, category, timestamp 
}));
```

### Option A: LearnWorlds Native

If using LearnWorlds:

1. Inside `quiz-standalone.html`, find this line (~line 380):
   ```javascript
   if (name || email) {
     sessionStorage.setItem('examUser', JSON.stringify({ name, email, category, timestamp: new Date().toISOString() }));
   }
   ```

2. Replace it with:
   ```javascript
   if (name || email) {
     sessionStorage.setItem('examUser', JSON.stringify({ name, email, category, timestamp: new Date().toISOString() }));
     // Send to LearnWorlds
     fetch('/api/leads', {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ name, email, source: 'vocabulary_exam', category })
     }).catch(err => console.log('Lead capture:', err));
   }
   ```

3. Set up the `/api/leads` endpoint in your LearnWorlds backend to store the data.

### Option B: Zapier/Make

1. Create a Zap that listens for HTTP POST webhooks
2. Get your webhook URL from Zapier
3. In `quiz-standalone.html`, replace the fetch URL with your Zapier webhook:
   ```javascript
   fetch('https://hooks.zapier.com/hooks/catch/YOUR_ZAPIER_ID/...', {
     method: 'POST',
     body: JSON.stringify({ name, email, source: 'vocabulary_exam', category })
   }).catch(err => console.log('Lead sent to Zapier'));
   ```

### Option C: Mailchimp

1. Get your Mailchimp API key
2. Use Mailchimp's API to subscribe users:
   ```javascript
   if (name || email) {
     fetch('https://server.mailchimp.com/3.0/lists/YOUR_LIST_ID/members', {
       method: 'POST',
       headers: {
         'Authorization': 'Basic ' + btoa('anystring:YOUR_MAILCHIMP_API_KEY'),
         'Content-Type': 'application/json'
       },
       body: JSON.stringify({
         email_address: email,
         status: 'subscribed',
         merge_fields: { FNAME: name.split(' ')[0] || '', CATEGORY: category }
       })
     }).catch(err => console.log('Added to Mailchimp'));
   }
   ```

---

## Configuration Notes

### Categories & Variants

The quiz automatically handles:

- **11 Regular Categories** (use `&variant=half|full`):
  - translation, common_expressions, civil_law, contract_law, criminal_law, immigration_law, personal_injury, family_law, labor_law, commercial_law, other_branches

- **General Legal English** (special: split into 4 sections):
  - Use `&quarter=1|2|3|4` instead of variant
  - Each section is ~50 questions (200+ total)

### Customizing the Quiz

To modify the quiz look/feel:

1. Edit colors in the `:root` CSS variables at the top of `quiz-standalone.html`
2. Change fonts, spacing, button text as needed
3. Dark theme is built in; to switch to light, change the `:root` values

---

## Testing

1. Visit `www.ingleslegal.com/exams/quiz-standalone.html` directly
2. Select a category → length → start exam
3. Verify questions load, scoring works, review shows answers
4. Check mobile on phone (fully responsive)

---

## Question Bank

The `master.json` contains:

- **1,220 total questions** across 12 legal categories
- **3 difficulty tiers** (basic, intermediate, advanced) — currently shuffled randomly
- **4 multiple-choice options** per question
- **Distractor quality screening** (no length bias, no position bias, no obvious wrong answers)

Each question has:
```json
{
  "id": "TRA-0001",
  "category": "translation",
  "tier": "basic",
  "type": "translation",
  "prompt": "Choose the correct Spanish equivalent of...",
  "options": ["choice1", "choice2", "choice3", "choice4"],
  "answer_index": 1,
  "explanation": "Why this answer is correct..."
}
```

---

## Troubleshooting

### "Failed to load question bank"

- Check that `master.json` is in the same directory as `quiz-standalone.html`
- Verify JSON file isn't corrupted (open it in a text editor, should start with `[`)
- Check browser console (F12) for CORS or network errors

### Dropdown button not appearing on /talent page

- Ensure the full contents of `embed-standalone.html` were pasted into the Embed section
- Check that the `<script>` block at the bottom is included
- Clear your browser cache and reload

### Email not being captured

- Open browser developer tools (F12) → Console
- Look for any JavaScript errors
- Verify your backend endpoint is correct (if wiring to a service)

---

## Next Steps

1. ✅ Upload `quiz-standalone.html` and `master.json` to `/exams/` on your server
2. ✅ Add the embed button to the /talent page
3. ⚠️ Test thoroughly before announcing to students
4. (Optional) Wire email capture to your CRM/mailing list

---

## Summary: What Changed

| Aspect | Old (Claude Artifact) | New (Standalone) |
|--------|----------------------|------------------|
| **Access** | Requires Claude account | Fully public, no login needed |
| **Hosting** | Published to claude.ai | Self-hosted on your domain |
| **Cost** | Free (Claude Artifacts) | Free (your server) |
| **Control** | Limited customization | Full code ownership |
| **Performance** | Depends on Claude | Instant local loading |

This is now a **truly free, public exam tool** for your students. 🎉
