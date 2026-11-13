import type {
  InkColor,
  NotebookSettings,
  StudentInfo,
} from '../types/assignment';
import type { PaginatedPage } from '../utils/notebookPagination';
import { getLineHeightPx } from '../utils/notebookPagination';
import { HanddrawnDiagram } from './HanddrawnDiagram';

interface NotebookSheetProps {
  page: PaginatedPage;
  totalPages: number;
  studentInfo: StudentInfo;
  settings: NotebookSettings;
  sheetRef?: (el: HTMLDivElement | null) => void;
}

const INK_STYLES: Record<InkColor, { primary: string; heading: string; question: string; subtle: string }> = {
  'royal-blue': {
    primary: '#1e3a8a',
    heading: '#172554',
    question: '#1d4ed8',
    subtle: '#3b82f6',
  },
  'blue-black': {
    primary: '#1e293b',
    heading: '#0f172a',
    question: '#0f172a',
    subtle: '#475569',
  },
  'carbon-black': {
    primary: '#18181b',
    heading: '#09090b',
    question: '#09090b',
    subtle: '#52525b',
  },
};

function getFontClass(font: NotebookSettings['font']): string {
  switch (font) {
    case 'caveat':
      return 'hw-font-caveat';
    case 'patrick':
      return 'hw-font-patrick';
    case 'indie':
      return 'hw-font-indie';
    default:
      return 'hw-font-kalam';
  }
}

export function NotebookSheet({
  page,
  totalPages,
  studentInfo,
  settings,
  sheetRef,
}: NotebookSheetProps) {
  const ink = INK_STYLES[settings.inkColor];
  const lineH = getLineHeightPx(settings.paperStyle);
  const fontClass = getFontClass(settings.font);

  const paperBgClass = !settings.showRuledLines
    ? 'paper-ivory-margin'
    : settings.paperStyle === 'narrow-ruled'
    ? 'paper-narrow-ruled'
    : settings.paperStyle === 'ivory-margin'
    ? 'paper-ivory-margin'
    : 'paper-college-ruled';

  // Padding left leaves clean space for the vertical crimson notebook margin line at ~68px
  const leftMarginPx = settings.showMarginLine ? 84 : 44;

  return (
    <div
      ref={sheetRef}
      className={`a4-sheet ${paperBgClass} ${fontClass} shadow-md border border-slate-300/80 select-text`}
      style={{
        color: ink.primary,
        fontSize: `${settings.fontSize}px`,
        lineHeight: `${lineH}px`,
        paddingTop: '28px',
        paddingBottom: '48px',
        paddingRight: '34px',
        paddingLeft: `${leftMarginPx}px`,
      }}
    >
      {/* Classic Notebook Double Vertical Margin Line */}
      {settings.showMarginLine && (
        <div
          aria-hidden="true"
          className="absolute top-0 bottom-0 pointer-events-none"
          style={{
            left: '64px',
            width: '4px',
            borderLeft: '1px solid rgba(225, 29, 72, 0.45)',
            borderRight: '1px solid rgba(225, 29, 72, 0.25)',
          }}
        />
      )}

      {/* Top Horizontal Double Header Rule */}
      <div
        aria-hidden="true"
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: '22px',
          height: '3px',
          borderTop: '1px solid rgba(225, 29, 72, 0.35)',
        }}
      />

      {/* Page 1 Student Assignment Header Block */}
      {page.hasCoverHeader && (
        <div
          className="mb-4 pb-2.5 border-b"
          style={{
            borderColor: `${ink.primary}35`,
          }}
        >
          <div className="flex items-baseline justify-between gap-4 mb-1">
            <h1
              className="font-bold tracking-normal"
              style={{
                color: ink.heading,
                fontSize: `${Math.min(22, settings.fontSize + 5)}px`,
                lineHeight: `${lineH}px`,
              }}
            >
              {studentInfo.assignmentTitle || studentInfo.subject || 'Academic Assignment'}
            </h1>
            {studentInfo.submissionDate && (
              <span
                className="shrink-0 text-right"
                style={{
                  color: ink.subtle,
                  fontSize: `${Math.max(12, settings.fontSize - 2)}px`,
                }}
              >
                Date: {studentInfo.submissionDate}
              </span>
            )}
          </div>

          <div
            className="grid grid-cols-2 gap-x-6 gap-y-0.5"
            style={{
              fontSize: `${Math.max(12.5, settings.fontSize - 1.5)}px`,
              lineHeight: `${Math.max(22, lineH - 4)}px`,
              color: ink.primary,
            }}
          >
            {studentInfo.studentName && (
              <div>
                <span style={{ opacity: 0.75 }}>Name: </span>
                <span className="font-bold">{studentInfo.studentName}</span>
              </div>
            )}
            {studentInfo.rollNumber && (
              <div>
                <span style={{ opacity: 0.75 }}>Roll No: </span>
                <span className="font-bold">{studentInfo.rollNumber}</span>
              </div>
            )}
            {studentInfo.collegeName && (
              <div className="col-span-2 truncate">
                <span style={{ opacity: 0.75 }}>Institution: </span>
                <span>{studentInfo.collegeName}</span>
              </div>
            )}
            {(studentInfo.course || studentInfo.semester) && (
              <div>
                <span style={{ opacity: 0.75 }}>Course / Sem: </span>
                <span>
                  {[studentInfo.course, studentInfo.semester].filter(Boolean).join(' · ')}
                </span>
              </div>
            )}
            {studentInfo.subject && (
              <div>
                <span style={{ opacity: 0.75 }}>Subject: </span>
                <span>{studentInfo.subject}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paginated Content Blocks */}
      <div className="relative z-10">
        {page.blocks.map((block, idx) => {
          const microTilt =
            settings.organicVariation && idx % 3 === 1
              ? 'rotate-[-0.12deg]'
              : settings.organicVariation && idx % 3 === 2
              ? 'rotate-[0.1deg]'
              : '';

          if (block.kind === 'question-header') {
            return (
              <div
                key={block.key}
                className={`relative mt-1 mb-1 ${microTilt}`}
                style={{ color: ink.question }}
              >
                {/* Margin Question Number Marker */}
                {settings.showMarginLine && (
                  <span
                    className="absolute font-bold text-right pr-2"
                    style={{
                      left: '-68px',
                      width: '56px',
                      color: '#be123c',
                      fontSize: `${settings.fontSize}px`,
                    }}
                  >
                    {block.questionNumber}
                  </span>
                )}
                <div className="font-bold" style={{ lineHeight: `${lineH}px` }}>
                  {!settings.showMarginLine && (
                    <span className="mr-1.5" style={{ color: '#be123c' }}>
                      {block.questionNumber}.
                    </span>
                  )}
                  <span>{block.questionText}</span>
                  {block.marksHint && (
                    <span
                      className="ml-2 font-normal"
                      style={{
                        fontSize: `${Math.max(12, settings.fontSize - 2)}px`,
                        opacity: 0.75,
                      }}
                    >
                      ({block.marksHint})
                    </span>
                  )}
                </div>
              </div>
            );
          }

          if (block.kind === 'section-heading') {
            return (
              <div
                key={block.key}
                className={`font-bold mt-1 ${microTilt}`}
                style={{
                  color: ink.heading,
                  lineHeight: `${lineH}px`,
                  textDecoration: 'underline',
                  textUnderlineOffset: '3px',
                  textDecorationThickness: '1px',
                }}
              >
                {block.heading}
              </div>
            );
          }

          if (block.kind === 'paragraph') {
            return (
              <p
                key={block.key}
                className={`mb-0.5 ${microTilt}`}
                style={{ lineHeight: `${lineH}px` }}
              >
                {block.text}
              </p>
            );
          }

          if (block.kind === 'bullet') {
            return (
              <div
                key={block.key}
                className={`flex items-start gap-2 pl-2 ${microTilt}`}
                style={{ lineHeight: `${lineH}px` }}
              >
                <span aria-hidden="true" className="font-bold shrink-0">
                  →
                </span>
                <span>{block.text}</span>
              </div>
            );
          }

          if (block.kind === 'example') {
            return (
              <div
                key={block.key}
                className={`my-1 px-2.5 py-1 rounded border ${microTilt}`}
                style={{
                  borderColor: `${ink.primary}30`,
                  backgroundColor: 'rgba(255, 255, 255, 0.45)',
                  lineHeight: `${lineH}px`,
                }}
              >
                <span className="font-bold" style={{ color: ink.heading }}>
                  Example:{' '}
                </span>
                <span>{block.text}</span>
              </div>
            );
          }

          if (block.kind === 'table') {
            return (
              <div key={block.key} className="my-2">
                {block.table.caption && (
                  <div
                    className="font-bold mb-1"
                    style={{
                      color: ink.heading,
                      fontSize: `${Math.max(13, settings.fontSize - 1)}px`,
                    }}
                  >
                    {block.table.caption}
                  </div>
                )}
                <table
                  className="w-full border-collapse"
                  style={{
                    fontSize: `${Math.max(12.5, settings.fontSize - 1.5)}px`,
                    lineHeight: '20px',
                    backgroundColor: 'rgba(255, 255, 255, 0.55)',
                  }}
                >
                  <thead>
                    <tr>
                      {block.table.headers.map((h, hIdx) => (
                        <th
                          key={hIdx}
                          className="text-left font-bold px-2 py-1 border"
                          style={{
                            borderColor: `${ink.primary}65`,
                            color: ink.heading,
                            backgroundColor: `${ink.primary}0d`,
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.table.rows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="px-2 py-1 border align-top"
                            style={{
                              borderColor: `${ink.primary}45`,
                            }}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          }

          if (block.kind === 'diagram') {
            return (
              <HanddrawnDiagram
                key={block.key}
                diagram={block.diagram}
                inkColor={settings.inkColor}
                font={settings.font}
              />
            );
          }

          return <div key={block.key} style={{ height: `${Math.round(lineH * 0.65)}px` }} />;
        })}
      </div>

      {/* Honest Digital Disclosure & Page Numbering Footer */}
      <div
        className="absolute left-0 right-0 bottom-0 px-8 py-2.5 flex items-center justify-between border-t"
        style={{
          paddingLeft: `${leftMarginPx}px`,
          borderColor: `${ink.primary}20`,
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: '9.5px',
          lineHeight: '14px',
          color: '#64748b',
          backgroundColor: 'rgba(252, 251, 247, 0.85)',
        }}
      >
        <span>
          Digitally generated study sheet · AI Assignment Studio (Not an original handwritten submission)
        </span>
        {settings.showPageNumbers && (
          <span className="font-mono-tabular font-medium shrink-0 ml-4" style={{ color: ink.subtle }}>
            Page {page.pageNumber} of {totalPages}
          </span>
        )}
      </div>
    </div>
  );
}
