"""Usage: python3 tools/make-share-banners.py . path/to/SourceSans3[wght].ttf

Builds the 1200x627 link-preview banners (og:image) for each exam page from the real logo,
and points each page's og:image tag at its banner. Run from the repository root."""
import math
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(sys.argv[1])
LIVE = "https://ingleslegal-hub.github.io/ingleslegal-exam/"
FONT = sys.argv[2] if len(sys.argv) > 2 else "SourceSans3[wght].ttf"  # Source Sans 3 variable font (Google Fonts)
W, H = 1200, 627
BG, GOLD, CREAM, MUTED, PURPLE, COPPER, INK = "#2A1A32", "#C9A96E", "#F1EBDE", "#CFC2D6", "#6E5A79", "#A9713F", "#2A1A32"
OLD_OG = f'<meta property="og:image" content="{LIVE}vocabulary/logo.png">'

TIER = {1: "Intermediate", 2: "Advanced", 3: "Expert"}
PATHS = {
    "immigration": "Immigration Support Specialist",
    "personal-injury": "Personal Injury Case Specialist",
    "workers-comp": "Workers' Compensation Case Manager",
    "family-law": "Family Law Paralegal",
    "criminal-defense": "Criminal Defense Legal Assistant",
}
LEVELS = {"basico": "Básico: términos", "intermedio": "Intermedio: frases", "avanzado": "Avanzado: oraciones"}

BANNERS = {"index.html": ("exams", "FREE LEGAL ENGLISH EXAMS", "Find your level of legal English",
                          "Proficiency tiers, career pathways, legal translation and vocabulary tests", "Take a free exam"),
           "pathways/index.html": ("pathways", "FREE CAREER PATHWAY EXAMS", "Ready for a U.S. law firm role?",
                                   "Immigration, personal injury, workers' compensation, family law and criminal defense", "Take it free"),
           "vocabulary/quiz-standalone.html": ("vocabulary", "FREE VOCABULARY TESTS", "Legal English vocabulary",
                                               "12 topics, from contract law to Spanish-English translation", "Take it free")}
for n, lvl in TIER.items():
    BANNERS[f"tier-{n}-exam.html"] = (f"tier-{n}", "FREE PROFICIENCY EXAM", f"Tier {n}: {lvl} legal English",
                                      "Your score by topic, and a Proficiency Report when you pass", "Take it free")
for key, name in PATHS.items():
    BANNERS[f"pathways/{key}-exam.html"] = (f"pathway-{key}", "FREE CAREER PATHWAY EXAM", name,
                                            "100 questions across 8 courses, and a Proficiency Report when you pass", "Take it free")
for key, name in LEVELS.items():
    BANNERS[f"translation/{key}-exam.html"] = (f"translation-{key}", "EXAMEN GRATUITO DE TRADUCCIÓN JURÍDICA",
                                               f"Nivel {name}",
                                               "Del español al inglés. Vea su puntaje por área y reciba un Proficiency Report si aprueba.", "Preséntelo gratis")


def font(size, weight):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([weight])
    return f


def wrap(d, text, f, width, max_lines):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= width:
            cur = t
        else:
            lines.append(cur); cur = w
    lines.append(cur)
    return lines if len(lines) <= max_lines else None


def spaced(d, xy, text, f, fill, spacing):
    x, y = xy
    for ch in text:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + spacing


def banner(eyebrow, headline, sub, cta, out):
    im = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(im)
    # The logo's waves, large, on the right: the brand mark as a backdrop.
    cx, cy = 1105, 330
    for r, col, w in ((300, PURPLE, 7), (225, COPPER, 12), (150, GOLD, 18)):
        d.arc((cx - r, cy - r, cx + r, cy + r), 128, 232, fill=col, width=w)
    d.ellipse((cx - 34, cy - 34, cx + 34, cy + 34), fill=CREAM)
    logo = Image.open(ROOT / "vocabulary/logo.png").convert("RGB")
    lw = 440
    im.paste(logo.resize((lw, round(logo.height * lw / logo.width)), Image.LANCZOS), (44, 40))
    text_w = 720
    y = 206
    spaced(d, (64, y), eyebrow, font(24, 650), GOLD, 3)
    y += 48
    for size in (62, 56, 50, 46):
        hf = font(size, 650)
        lines = wrap(d, headline, hf, text_w, 2)
        if lines:
            break
    for ln in lines:
        d.text((64, y), ln, font=hf, fill=CREAM); y += round(size * 1.12)
    y += 14
    sf = font(29, 400)
    for ln in wrap(d, sub, sf, text_w, 3) or [sub]:
        d.text((64, y), ln, font=sf, fill=MUTED); y += 38
    cf = font(28, 650)
    cw = d.textlength(cta, font=cf) + 56
    top = H - 92
    d.rounded_rectangle((64, top, 64 + cw, top + 56), radius=28, fill=GOLD)
    d.text((64 + 28, top + 28), cta, font=cf, fill=INK, anchor="lm")
    d.text((64 + cw + 26, top + 28), "ingleslegal.com", font=font(28, 500), fill=CREAM, anchor="lm")
    (ROOT / "share-images").mkdir(exist_ok=True)
    im.save(ROOT / "share-images" / out, optimize=True)


for page, (name, eyebrow, headline, sub, cta) in BANNERS.items():
    banner(eyebrow, headline, sub, cta, name + ".png")
    p = ROOT / page
    t = p.read_text(encoding="utf-8")
    new = (f'<meta property="og:image" content="{LIVE}share-images/{name}.png">\n'
           f'<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="627">\n'
           f'<meta name="twitter:card" content="summary_large_image">')
    if f"share-images/{name}.png" in t:
        continue  # tag already points at this banner
    if t.count(OLD_OG) != 1:
        sys.exit(f"{page}: og:image tag not found once")
    p.write_text(t.replace(OLD_OG, new), encoding="utf-8")
print(len(BANNERS), "banners")
