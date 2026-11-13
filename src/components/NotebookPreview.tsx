import { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Download,
  Loader2,
  PenLine,
  Printer,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import type {
  HandwritingFont,
  InkColor,
  NotebookSettings,
  PaperStyle,
  QuestionAnswerItem,
  StudentInfo,
} from '../types/assignment';
import { paginateAssignment } from '../utils/notebookPagination';
import { exportNotebookToPdf } from '../utils/pdfExport';
import { NotebookSheet } from './NotebookSheet';

interface NotebookPreviewProps {
  items: QuestionAnswerItem[];
  studentInfo: StudentInfo;
  settings: NotebookSettings;
  onUpdateSettings: (patch: Partial<NotebookSettings>) => void;
  onGoToEditor: () => void;
  onGoToUpload: () => void;
}

export function NotebookPreview({
  items,
  studentInfo,
  settings,
  onUpdateSettings,
  onGoToEditor,
  onGoToUpload,
}: NotebookPreviewProps) {
  const [zoom, setZoom] = useState<number>(0.78);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>('');
  const [exportError, setExportError] = useState<string | null>(null);
  const sheetRefs = useRef<Array<HTMLDivElement | null>>([]);

  const pages = useMemo(
    () => paginateAssignment(items, settings),
    [items, settings]
  );

  const handleDownloadPdf = async () => {
    setExportError(null);
    setIsExporting(true);
    try {
      const elements = sheetRefs.current
        .slice(0, pages.length)
        .filter((el): el is HTMLDivElement => el !== null);

      const title =
        studentInfo.assignmentTitle || studentInfo.subject || 'Assignment_Notebook';

      await exportNotebookToPdf(elements, title, (curr, total) => {
        setExportProgress(`Rendering page ${curr} of ${total}…`);
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PDF export failed.';
      setExportError(msg);
    } finally {
      setIsExporting(false);
      setExportProgress('');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (items.length === 0) {
    return (
      <div className="no-print max-w-2xl mx-auto my-12 p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
          Nothing to Preview Yet
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Upload a question paper or generate answers first to preview your handwriting-style A4 notebook.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onGoToUpload}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          >
            Upload Assignment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Screen Toolbar & Layout */}
      <div className="no-print grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Customization Controls (4 cols on xl) */}
        <aside className="xl:col-span-4 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5 xl:sticky xl:top-20">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3.5">
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-slate-100">
                Notebook Style
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
                A4 Portrait · {pages.length} {pages.length === 1 ? 'Page' : 'Pages'}
              </p>
            </div>
            <button
              type="button"
              onClick={onGoToEditor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <PenLine className="w-3.5 h-3.5" />
              <span>Edit Text</span>
            </button>
          </div>

          {/* Handwriting Font */}
          <div className="space-y-2">
            <label
              htmlFor="hw-font-select"
              className="block text-xs font-medium text-slate-700 dark:text-slate-300"
            >
              Handwriting Font
            </label>
            <select
              id="hw-font-select"
              value={settings.font}
              onChange={(e) =>
                onUpdateSettings({ font: e.target.value as HandwritingFont })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100"
            >
              <option value="kalam">Kalam (Supports English &amp; Hindi)</option>
              <option value="caveat">Caveat (Natural Flowing Cursive)</option>
              <option value="patrick">Patrick Hand (Neat Student Print)</option>
              <option value="indie">Indie Flower (Relaxed Notebook Script)</option>
            </select>
          </div>

          {/* Ink Color */}
          <div className="space-y-2">
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Pen Ink Color
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'royal-blue', label: 'Royal Blue', swatch: '#1e3a8a' },
                  { id: 'blue-black', label: 'Blue-Black', swatch: '#1e293b' },
                  { id: 'carbon-black', label: 'Carbon Black', swatch: '#18181b' },
                ] as const
              ).map((ink) => {
                const active = settings.inkColor === ink.id;
                return (
                  <button
                    key={ink.id}
                    type="button"
                    onClick={() => onUpdateSettings({ inkColor: ink.id as InkColor })}
                    className={`flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: ink.swatch }}
                    />
                    <span className="truncate">{ink.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Paper Background */}
          <div className="space-y-2">
            <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">
              Paper Layout
            </span>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'college-ruled', label: 'College Ruled' },
                  { id: 'narrow-ruled', label: 'Narrow Ruled' },
                  { id: 'ivory-margin', label: 'Clean Ivory' },
                ] as const
              ).map((p) => {
                const active = settings.paperStyle === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => onUpdateSettings({ paperStyle: p.id as PaperStyle })}
                    className={`px-2 py-2 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-200 dark:border-blue-500'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="hw-font-size"
                className="font-medium text-slate-700 dark:text-slate-300"
              >
                Handwriting Size
              </label>
              <span className="font-mono-tabular font-semibold text-slate-900 dark:text-slate-100">
                {settings.fontSize}px
              </span>
            </div>
            <input
              id="hw-font-size"
              type="range"
              min={13}
              max={18}
              step={1}
              value={settings.fontSize}
              onChange={(e) =>
                onUpdateSettings({ fontSize: Number(e.target.value) })
              }
              className="w-full accent-blue-600 cursor-pointer"
            />
          </div>

          {/* Page Detail Toggles */}
          <div className="space-y-2.5 pt-2 border-t border-slate-200 dark:border-slate-800">
            {[
              { key: 'showRuledLines', label: 'Show ruled horizontal lines' },
              { key: 'showMarginLine', label: 'Show crimson left margin line' },
              { key: 'showHeaderBlock', label: 'Show student info header on Page 1' },
              { key: 'showPageNumbers', label: 'Show page numbering (Page X of Y)' },
              { key: 'organicVariation', label: 'Natural handwriting micro-tilt' },
            ].map((toggle) => (
              <label
                key={toggle.key}
                className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                <span>{toggle.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(settings[toggle.key as keyof NotebookSettings])}
                  onChange={(e) =>
                    onUpdateSettings({ [toggle.key]: e.target.checked })
                  }
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            ))}
          </div>

          {/* Error Display */}
          {exportError && (
            <div
              role="alert"
              className="p-3 rounded-lg border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-xs text-red-700 dark:text-red-300 flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{exportError}</span>
            </div>
          )}

          {/* Export Actions */}
          <div className="pt-2 space-y-2.5">
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-60"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>{exportProgress || 'Exporting PDF…'}</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 shrink-0" />
                  <span>Download A4 PDF</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={isExporting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-60"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Print Directly (A4)</span>
            </button>

            <p className="text-[11px] leading-normal text-slate-500 dark:text-slate-400">
              Output pages carry a clear footer notice identifying them as digitally generated study sheets.
            </p>
          </div>
        </aside>

        {/* Right A4 Stage (8 cols on xl) */}
        <div className="xl:col-span-8 space-y-4">
          {/* Preview Zoom Bar */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300 font-mono-tabular">
              A4 Preview (210mm × 297mm) · {pages.length} {pages.length === 1 ? 'Sheet' : 'Sheets'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setZoom((z) => Math.max(0.45, Number((z - 0.1).toFixed(2))))}
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Zoom out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="font-mono-tabular text-xs font-semibold text-slate-800 dark:text-slate-200 w-12 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((z) => Math.min(1.15, Number((z + 0.1).toFixed(2))))}
                className="p-1.5 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                aria-label="Zoom in"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Scaled Sheet Viewport */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-200/70 dark:bg-slate-950 p-4 sm:p-6 overflow-x-auto">
            <div className="flex flex-col items-center gap-6">
              {pages.map((page, idx) => (
                <div
                  key={page.pageNumber}
                  style={{
                    width: `calc(210mm * ${zoom})`,
                    height: `calc(297mm * ${zoom})`,
                  }}
                  className="shrink-0 relative"
                >
                  <div
                    style={{
                      transform: `scale(${zoom})`,
                      transformOrigin: 'top left',
                    }}
                  >
                    <NotebookSheet
                      page={page}
                      totalPages={pages.length}
                      studentInfo={studentInfo}
                      settings={settings}
                      sheetRef={(el) => {
                        sheetRefs.current[idx] = el;
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Print-Only Unscaled A4 Container */}
      <div className="hidden print:block print-only-container">
        {pages.map((page) => (
          <NotebookSheet
            key={`print-${page.pageNumber}`}
            page={page}
            totalPages={pages.length}
            studentInfo={studentInfo}
            settings={settings}
          />
        ))}
      </div>
    </div>
  );
}
