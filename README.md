# AI Assignment Studio

An interactive full-stack web application that extracts assignment questions from **PDF**, **JPG**, **PNG**, and **DOCX** files, synthesizes structured educational answers in **English**, **Hindi**, or **Bilingual** modes via **Google Gemini (`@google/genai`)**, and renders them onto printable **A4 handwriting-style ruled notebook pages**.

## Features

- **Multi-Format Question Ingestion**: Upload multiple PDF, JPG, PNG, or DOCX files (or paste text directly). DOCX files are parsed via `mammoth` and PDFs/images are processed via Gemini multimodal OCR.
- **Structured Answer Generator**: Produces student-level answers organized into clear headings, paragraphs, bullet points, illustrative examples, comparison tables, and hand-drawn SVG educational diagrams (`flowchart`, `cycle`, `hierarchy`, `comparison`).
- **Inline Answer Review & Editing**: Edit every question, section, bullet, table cell, or diagram node, and regenerate individual answers with custom instructions.
- **Handwriting-Style A4 Notebook Studio**:
  - Exact `210mm × 297mm` A4 sheets with deterministic pagination
  - Multiple handwriting fonts (`Kalam` for English & Hindi Devanagari, `Caveat`, `Patrick Hand`, `Indie Flower`)
  - Selectable ink shades (`Royal Blue`, `Blue-Black`, `Carbon Black`) and ruled backgrounds (`College Ruled`, `Narrow Ruled`, `Clean Ivory`)
  - Student header cover block (Name, College, Course, Semester, Subject, Roll Number, Date)
  - Clear footer notice identifying sheets as digitally generated study material
- **Direct A4 PDF Export & Print**: High-DPI multi-page PDF download (`html-to-image` + `jsPDF`) and `@media print` A4 direct printing.
- **Project Persistence**: Save, search, filter, duplicate, and reopen assignment projects via the Express backend (`data/projects.json`).

## Installation & Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Copy `.env.example` to `.env` and set your `GEMINI_API_KEY`:
   ```bash
   cp .env.example .env
   ```
   ```env
   GEMINI_API_KEY="MY_GEMINI_API_KEY"
   APP_URL="http://localhost:3000"
   PORT="3000"
   ```

3. **Run development server** (Express backend + Vite frontend on port `3000`):
   ```bash
   npm run dev
   ```

4. **Build and run in production**:
   ```bash
   npm run build
   npm run start
   ```
