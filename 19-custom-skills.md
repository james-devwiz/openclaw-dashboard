# Phase 19: Custom Managed Skills

> Adds 6 custom OpenClaw skills adapted from the Anthropic skills repository for document generation, MCP development guidance, and web application testing.

---

## What You Get

- **PDF skill** — Read, create, merge, split, OCR, watermark, and encrypt PDFs using pypdf, pdfplumber, reportlab, qpdf, and tesseract
- **DOCX skill** — Create and edit Word documents using docx (npm), pandoc, and LibreOffice
- **XLSX skill** — Create and edit spreadsheets with formulas using openpyxl, pandas, and LibreOffice recalculation
- **PPTX skill** — Create and edit presentations using PptxGenJS, markitdown, and LibreOffice
- **MCP-Builder skill** — Comprehensive guide for building MCP servers (TypeScript/Python) with OpenClaw integration
- **Webapp-Testing skill** — Browser automation and testing with headless Playwright/Chromium

## Prerequisites

- Phase 1-17 completed (OpenClaw running, dashboard deployed)
- SSH access to VPS

## What Gets Installed on VPS

### System packages (apt)
- `poppler-utils` (pdftotext, pdftoppm)
- `qpdf` (PDF manipulation)
- `tesseract-ocr` (OCR for scanned PDFs)
- `pandoc` (document conversion)
- `libreoffice-calc`, `libreoffice-writer`, `libreoffice-impress`

### Python packages (uv)
- pypdf, pdfplumber, reportlab, Pillow, pytesseract
- openpyxl, pandas
- markitdown[pptx]
- playwright (+ Chromium browser)

### npm packages (global)
- docx, pptxgenjs

### Estimated disk usage: ~800MB

## Deployment

```bash
./deploy.sh 7
```

This:
1. Syncs `skills/` to `/root/.openclaw/skills/` on VPS
2. Makes all Python scripts executable
3. Creates output directories (`/tmp/openclaw-output/`, `/tmp/openclaw-screenshots/`)
4. Verifies skills are detected
5. Restarts the gateway

## Files

| Location | Description |
|----------|-------------|
| `skills/pdf/` | SKILL.md, reference.md, forms.md, scripts/ |
| `skills/docx/` | SKILL.md, scripts/ (accept_changes, comment, office utils) |
| `skills/xlsx/` | SKILL.md, scripts/ (recalc.py, office utils) |
| `skills/pptx/` | SKILL.md, editing.md, pptxgenjs.md, scripts/ (thumbnail, office utils) |
| `skills/mcp-builder/` | SKILL.md, reference/ (4 docs) |
| `skills/webapp-testing/` | SKILL.md, scripts/, examples/ (3 example scripts) |

## Dashboard Changes

- `app/api/architecture/skills/[name]/install/route.ts` — Added `case "uv"` handler for Python package installation via uv

## Verification Checklist

- [ ] `openclaw skills list` shows all 6 new skills as "ready"
- [ ] Command Centre Architecture > Skills tab shows new skills with detail panels
- [ ] PDF: `python3 -c "from pypdf import PdfReader; print('OK')"` on VPS
- [ ] DOCX: `pandoc --version && node -e "require('/usr/lib/node_modules/docx')"` on VPS
- [ ] XLSX: `python3 -c "import openpyxl, pandas; print('OK')"` on VPS
- [ ] PPTX: `node -e "require('/usr/lib/node_modules/pptxgenjs')"` on VPS
- [ ] Webapp-Testing: `playwright install --dry-run chromium` shows installed
- [ ] Dashboard install route handles `uv` kind without error
- [ ] `deploy.sh 7` transfers skills to VPS successfully
