# ₹ TaxSakhi — Smart Tax Planning for Salaried Indians

> FY 2025-26 (AY 2026-27) · Updated for Union Budget 2025

**Live Demo:** [https://babubl.github.io/taxsakhi](https://babubl.github.io/taxsakhi)

---

## What is TaxSakhi?

TaxSakhi is a **free, privacy-first tax planning tool** built for Indian salaried employees. It compares Old vs New tax regime in real-time and tells you exactly how much tax you can save.

### Features

- **Live Tax Calculation** — tax updates as you type, no buttons needed
- **Old vs New Regime Comparison** — side-by-side with slab-by-slab visual breakdown
- **Smart Guided Flow** — only shows sections relevant to you (rent, investments, home loan, etc.)
- **EPF Auto-Calculation** — 12% of Basic auto-counted in Section 80C
- **Quick Salary Presets** — one-click to get started (₹5L to ₹25L)
- **Complete Deduction Coverage** — 80C, 80CCD(1B), 80CCD(2), 80D, 24(b), 80E, 80G, 80TTA, HRA, LTA, Professional Tax
- **HRA Calculator** — metro/non-metro with 3-way minimum formula breakdown
- **Section 87A Rebate** — Old (₹12,500 up to ₹5L) & New (₹60,000 up to ₹12L)
- **Tax Saving Suggestions** — identifies gaps with actual savings based on your marginal tax rate
- **Other Income** — FD interest, rental income, savings account interest
- **Mobile-First Design** — works perfectly on phones
- **Sticky Live Banner** — always see your take-home, best regime, and tax at a glance

### Tax Rules Covered

| Feature | Details |
|---------|---------|
| New Regime Slabs | ₹0-4L (NIL), ₹4-8L (5%), ₹8-12L (10%), ₹12-16L (15%), ₹16-20L (20%), ₹20-24L (25%), 24L+ (30%) |
| Old Regime Slabs | ₹0-2.5L (NIL), ₹2.5-5L (5%), ₹5-10L (20%), 10L+ (30%) |
| Standard Deduction | ₹75,000 (New) / ₹50,000 (Old) |
| 87A Rebate | ₹60,000 up to ₹12L taxable (New) / ₹12,500 up to ₹5L (Old) |
| Surcharge | 10-37% based on income and regime |
| Cess | 4% Health & Education Cess |

---

## Getting Started

### Prerequisites
- Node.js 18+ installed
- npm or yarn

### Local Development

```bash
# Clone the repo
git clone https://github.com/babubl/taxsakhi.git
cd taxsakhi

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Output goes to `dist/` folder.

---

## Deployment

### GitHub Pages (Automatic)

This repo includes a GitHub Actions workflow that auto-deploys to GitHub Pages on every push to `main`.

**One-time setup:**
1. Go to your repo → Settings → Pages
2. Under "Source", select **GitHub Actions**
3. Push to `main` — it auto-deploys!

Your site will be live at: `https://babubl.github.io/taxsakhi`

### Manual Deploy

```bash
npm run deploy
```

This builds and pushes to the `gh-pages` branch.

---

## Tech Stack

- **React 18** — UI framework
- **Vite** — build tool (fast HMR, optimized builds)
- **Vanilla CSS** — no external CSS dependencies, zero bloat
- **GitHub Pages** — free hosting with CI/CD

---

## Privacy

TaxSakhi runs **100% in your browser**. No data is sent to any server. No cookies, no tracking, no analytics. Your salary and tax information never leaves your device.

---

## Disclaimer

TaxSakhi provides estimates based on FY 2025-26 rules (Income Tax Act 1961, Finance Act 2025). This is **not professional tax advice**. The tool doesn't cover all edge cases (marginal relief at surcharge thresholds, capital gains, Section 10 exemptions). Always consult a qualified Chartered Accountant before filing your ITR.

---

## Roadmap

- [ ] Form 16 PDF upload with OCR auto-fill
- [ ] AI Tax Q&A Assistant
- [ ] Capital Gains module (STCG/LTCG for MF & stocks)
- [ ] WhatsApp bot version
- [ ] Vernacular support (Hindi, Tamil, Telugu)
- [ ] Print/PDF export of tax summary
- [ ] Year-round tax planning with monthly nudges

---

## License

MIT

---

Built with ❤️ for Indian taxpayers
