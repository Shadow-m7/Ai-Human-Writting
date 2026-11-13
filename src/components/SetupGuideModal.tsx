import { Terminal, X } from 'lucide-react';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SetupGuideModal({ isOpen, onClose }: SetupGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="setup-guide-title"
    >
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <Terminal className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2
              id="setup-guide-title"
              className="font-display font-semibold text-lg text-slate-900 dark:text-slate-100"
            >
              Setup, Architecture &amp; Environment Guide
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          <section>
            <h3 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">
              1. Installation &amp; Local Run
            </h3>
            <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
{`# Install dependencies
npm install

# Configure environment variables
cp .env.example .env

# Run full-stack Express + Vite server on port 3000
npm run dev

# Build for production & start
npm run build && npm run start`}
            </pre>
          </section>

          <section>
            <h3 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">
              2. Environment Variables (.env.example)
            </h3>
            <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-100 font-mono text-xs overflow-x-auto">
{`GEMINI_API_KEY="YOUR_GOOGLE_GEMINI_API_KEY"
APP_URL="http://localhost:3000"
PORT="3000"`}
            </pre>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              All Gemini API calls execute exclusively on the Express backend (<code className="font-mono">/api/extract</code>,{' '}
              <code className="font-mono">/api/generate-answers</code>, <code className="font-mono">/api/regenerate-answer</code>).
              Keys are never bundled into frontend code.
            </p>
          </section>

          <section>
            <h3 className="font-display font-semibold text-base text-slate-900 dark:text-slate-100 mb-2">
              3. Pipeline Overview
            </h3>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Multi-Format Ingestion:</strong> Supports PDF, JPG, PNG (multimodal OCR via Gemini) and DOCX
                (server-side text extraction via Mammoth).
              </li>
              <li>
                <strong>Structured Answer Synthesis:</strong> Generates student-level answers in English, Hindi (Devanagari),
                or Bilingual mode with headings, bullets, examples, comparison tables, and hand-drawn SVG diagrams.
              </li>
              <li>
                <strong>A4 Notebook Engine:</strong> Paginates content onto exact 210mm × 297mm ruled sheets with selectable
                handwriting fonts, ink shades, and direct PDF download or browser print.
              </li>
            </ul>
          </section>
        </div>

        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-blue-600 hover:opacity-90 cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
