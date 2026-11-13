import { useState } from 'react';
import {
  Eye,
  Loader2,
  Plus,
  RefreshCw,
  Table2,
  Trash2,
  Workflow,
} from 'lucide-react';
import type {
  AnswerLanguage,
  AnswerLength,
  AnswerSection,
  DiagramSpec,
  QuestionAnswerItem,
} from '../types/assignment';
import { HanddrawnDiagram } from './HanddrawnDiagram';

interface AnswerEditorProps {
  items: QuestionAnswerItem[];
  language: AnswerLanguage;
  answerLength: AnswerLength;
  isRegeneratingAll: boolean;
  onUpdateItems: (items: QuestionAnswerItem[]) => void;
  onRegenerateOne: (questionId: string, instruction?: string) => Promise<void>;
  onRegenerateAll: () => Promise<void>;
  onChangeLanguage: (lang: AnswerLanguage) => void;
  onChangeLength: (len: AnswerLength) => void;
  onGoToUpload: () => void;
  onGoToPreview: () => void;
}

export function AnswerEditor({
  items,
  language,
  answerLength,
  isRegeneratingAll,
  onUpdateItems,
  onRegenerateOne,
  onRegenerateAll,
  onChangeLanguage,
  onChangeLength,
  onGoToUpload,
  onGoToPreview,
}: AnswerEditorProps) {
  const [customPrompts, setCustomPrompts] = useState<Record<string, string>>({});

  const updateItem = (id: string, patch: Partial<QuestionAnswerItem>) => {
    onUpdateItems(
      items.map((it) => (it.id === id ? { ...it, ...patch } : it))
    );
  };

  const removeItem = (id: string) => {
    onUpdateItems(items.filter((it) => it.id !== id));
  };

  const addQuestion = () => {
    const nextNum = items.length + 1;
    const newItem: QuestionAnswerItem = {
      id: `q_${Date.now()}`,
      questionNumber: `Q${nextNum}`,
      questionText: '',
      marksHint: '',
      topic: 'Custom Question',
      sections: [
        {
          id: `sec_${Date.now()}`,
          heading: 'Overview',
          paragraphs: [''],
          bulletPoints: [],
          example: '',
        },
      ],
      table: null,
      diagram: null,
      includeTable: false,
      includeDiagram: false,
    };
    onUpdateItems([...items, newItem]);
  };

  const updateSection = (
    itemId: string,
    secIndex: number,
    patch: Partial<AnswerSection>
  ) => {
    const target = items.find((it) => it.id === itemId);
    if (!target) return;
    const nextSections = target.sections.map((sec, idx) =>
      idx === secIndex ? { ...sec, ...patch } : sec
    );
    updateItem(itemId, { sections: nextSections });
  };

  const addSection = (itemId: string) => {
    const target = items.find((it) => it.id === itemId);
    if (!target) return;
    const nextSections: AnswerSection[] = [
      ...target.sections,
      {
        id: `sec_${Date.now()}`,
        heading: 'Key Points',
        paragraphs: [''],
        bulletPoints: [''],
        example: '',
      },
    ];
    updateItem(itemId, { sections: nextSections });
  };

  const removeSection = (itemId: string, secIndex: number) => {
    const target = items.find((it) => it.id === itemId);
    if (!target) return;
    updateItem(itemId, {
      sections: target.sections.filter((_, idx) => idx !== secIndex),
    });
  };

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-12 p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-4">
        <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-100">
          No Questions Loaded Yet
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Upload a question paper (PDF, JPG, PNG, DOCX), paste assignment questions, or add a question manually to begin editing answers.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={onGoToUpload}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
          >
            Go to Upload &amp; Setup
          </button>
          <button
            type="button"
            onClick={addQuestion}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            Add Question Manually
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Sticky Control Bar */}
      <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-lg font-bold text-slate-900 dark:text-slate-100">
            Review &amp; Edit Answers
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono-tabular">
            {items.length} {items.length === 1 ? 'Question' : 'Questions'} ·{' '}
            {language === 'english' ? 'English' : language === 'hindi' ? 'Hindi' : 'Bilingual'} ·{' '}
            {answerLength.charAt(0).toUpperCase() + answerLength.slice(1)} depth
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Answer language"
            value={language}
            onChange={(e) => onChangeLanguage(e.target.value as AnswerLanguage)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="english">English</option>
            <option value="hindi">Hindi (हिन्दी)</option>
            <option value="bilingual">Bilingual</option>
          </select>

          <select
            aria-label="Answer length"
            value={answerLength}
            onChange={(e) => onChangeLength(e.target.value as AnswerLength)}
            className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 px-2.5 py-2 text-xs font-medium text-slate-800 dark:text-slate-200"
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="detailed">Detailed</option>
          </select>

          <button
            type="button"
            onClick={onRegenerateAll}
            disabled={isRegeneratingAll}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingAll ? 'animate-spin' : ''}`} />
            <span>{isRegeneratingAll ? 'Regenerating…' : 'Regenerate All'}</span>
          </button>

          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Question</span>
          </button>

          <button
            type="button"
            onClick={onGoToPreview}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview A4 Notebook</span>
          </button>
        </div>
      </div>

      {/* Question Cards */}
      <div className="space-y-6">
        {items.map((item, qIndex) => (
          <article
            key={item.id}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden"
          >
            {/* Question Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="text"
                    value={item.questionNumber}
                    onChange={(e) => updateItem(item.id, { questionNumber: e.target.value })}
                    aria-label="Question number"
                    className="w-20 font-mono-tabular text-xs font-bold rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-blue-700 dark:text-blue-400"
                  />
                  <input
                    type="text"
                    value={item.marksHint || ''}
                    onChange={(e) => updateItem(item.id, { marksHint: e.target.value })}
                    placeholder="Marks (optional)"
                    aria-label="Marks hint"
                    className="w-32 text-xs rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-slate-600 dark:text-slate-300"
                  />
                  {item.topic && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Topic: {item.topic}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                  aria-label={`Delete question ${qIndex + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <textarea
                rows={2}
                value={item.questionText}
                onChange={(e) => updateItem(item.id, { questionText: e.target.value })}
                placeholder="Enter question statement..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-sm font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />

              {/* Per-Question AI Refinement Controls */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customPrompts[item.id] || ''}
                  onChange={(e) =>
                    setCustomPrompts((prev) => ({ ...prev, [item.id]: e.target.value }))
                  }
                  placeholder="Optional refinement (e.g. 'Explain simpler', 'Add real-world example', 'Translate to Hindi')"
                  className="flex-1 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <button
                    type="button"
                    disabled={item.isGenerating || !item.questionText.trim()}
                    onClick={() =>
                      onRegenerateOne(
                        item.id,
                        'Simplify language for easier student understanding and include a short concrete example.'
                      )
                    }
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-45"
                  >
                    Simplify
                  </button>
                  <button
                    type="button"
                    disabled={item.isGenerating || !item.questionText.trim()}
                    onClick={() =>
                      onRegenerateOne(
                        item.id,
                        'Include a clear comparison table and an educational flowchart/diagram if appropriate.'
                      )
                    }
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer disabled:opacity-45"
                  >
                    + Visuals
                  </button>
                  <button
                    type="button"
                    disabled={item.isGenerating || !item.questionText.trim()}
                    onClick={() => onRegenerateOne(item.id, customPrompts[item.id])}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-slate-900 text-white dark:bg-blue-600 hover:opacity-90 cursor-pointer disabled:opacity-45"
                  >
                    {item.isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    <span>{item.isGenerating ? 'Writing…' : 'Generate'}</span>
                  </button>
                </div>
              </div>

              {item.error && (
                <p className="text-xs text-red-600 dark:text-red-400">{item.error}</p>
              )}
            </div>

            {/* Answer Sections Editor */}
            <div className="p-5 space-y-5">
              {item.sections.map((sec, sIdx) => (
                <div
                  key={sec.id || sIdx}
                  className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/30 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <input
                      type="text"
                      value={sec.heading}
                      onChange={(e) =>
                        updateSection(item.id, sIdx, { heading: e.target.value })
                      }
                      placeholder="Section Heading"
                      className="flex-1 font-display font-semibold text-sm bg-transparent border-b border-slate-300 dark:border-slate-700 pb-1 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-blue-500"
                    />
                    {item.sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(item.id, sIdx)}
                        className="text-xs text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                      >
                        Remove Section
                      </button>
                    )}
                  </div>

                  {/* Paragraphs */}
                  <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                      Explanation Paragraphs
                    </label>
                    <textarea
                      rows={3}
                      value={sec.paragraphs.join('\n\n')}
                      onChange={(e) =>
                        updateSection(item.id, sIdx, {
                          paragraphs: e.target.value.split(/\n\n+/),
                        })
                      }
                      placeholder="Write or refine explanation paragraphs (separate paragraphs with a blank line)..."
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Bullet Points */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Bullet Points
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          updateSection(item.id, sIdx, {
                            bulletPoints: [...sec.bulletPoints, ''],
                          })
                        }
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        + Add Bullet
                      </button>
                    </div>
                    {sec.bulletPoints.map((bp, bIdx) => (
                      <div key={bIdx} className="flex items-center gap-2">
                        <span className="text-slate-400 text-xs font-mono">→</span>
                        <input
                          type="text"
                          value={bp}
                          onChange={(e) => {
                            const next = [...sec.bulletPoints];
                            next[bIdx] = e.target.value;
                            updateSection(item.id, sIdx, { bulletPoints: next });
                          }}
                          placeholder="Key point..."
                          className="flex-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            updateSection(item.id, sIdx, {
                              bulletPoints: sec.bulletPoints.filter((_, i) => i !== bIdx),
                            });
                          }}
                          className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                          aria-label="Remove bullet"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Example */}
                  <div className="space-y-1">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400">
                      Illustrative Example (Optional)
                    </label>
                    <input
                      type="text"
                      value={sec.example || ''}
                      onChange={(e) =>
                        updateSection(item.id, sIdx, { example: e.target.value })
                      }
                      placeholder="Concrete example or real-world illustration..."
                      className="w-full rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-sm text-slate-800 dark:text-slate-200"
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => addSection(item.id)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                + Add Answer Section
              </button>

              {/* Table & Diagram Toggles + Inline Editors */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Structured Table Panel */}
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Table2 className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Summary Table
                      </span>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.includeTable && Boolean(item.table)}
                        onChange={(e) => {
                          if (e.target.checked && !item.table) {
                            updateItem(item.id, {
                              includeTable: true,
                              table: {
                                caption: 'Key Comparison',
                                headers: ['Aspect', 'Description'],
                                rows: [
                                  ['Concept', 'Core definition'],
                                  ['Use Case', 'Practical application'],
                                ],
                              },
                            });
                          } else {
                            updateItem(item.id, { includeTable: e.target.checked });
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Show in Notebook</span>
                    </label>
                  </div>

                  {item.includeTable && item.table ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={item.table.caption}
                        onChange={(e) =>
                          updateItem(item.id, {
                            table: { ...item.table!, caption: e.target.value },
                          })
                        }
                        className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200"
                        placeholder="Table caption"
                      />
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr>
                              {item.table.headers.map((h, hIdx) => (
                                <th key={hIdx} className="p-1 border border-slate-200 dark:border-slate-700">
                                  <input
                                    type="text"
                                    value={h}
                                    onChange={(e) => {
                                      const headers = [...item.table!.headers];
                                      headers[hIdx] = e.target.value;
                                      updateItem(item.id, {
                                        table: { ...item.table!, headers },
                                      });
                                    }}
                                    className="w-full bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none"
                                  />
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {item.table.rows.map((row, rIdx) => (
                              <tr key={rIdx}>
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="p-1 border border-slate-200 dark:border-slate-700">
                                    <input
                                      type="text"
                                      value={cell}
                                      onChange={(e) => {
                                        const rows = item.table!.rows.map((r, ri) =>
                                          ri === rIdx
                                            ? r.map((c, ci) => (ci === cIdx ? e.target.value : c))
                                            : r
                                        );
                                        updateItem(item.id, {
                                          table: { ...item.table!, rows },
                                        });
                                      }}
                                      className="w-full bg-transparent text-slate-700 dark:text-slate-300 focus:outline-none"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const emptyRow = item.table!.headers.map(() => '');
                          updateItem(item.id, {
                            table: {
                              ...item.table!,
                              rows: [...item.table!.rows, emptyRow],
                            },
                          });
                        }}
                        className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        + Add Row
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enable to include or edit a comparison table for this answer.
                    </p>
                  )}
                </div>

                {/* Educational Diagram Panel */}
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Workflow className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        Hand-Drawn Diagram
                      </span>
                    </div>
                    <label className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.includeDiagram && Boolean(item.diagram)}
                        onChange={(e) => {
                          if (e.target.checked && !item.diagram) {
                            const fallbackDiagram: DiagramSpec = {
                              title: item.topic || 'Concept Flow',
                              type: 'flowchart',
                              nodes: [
                                { id: 'n1', label: 'Input / Cause', sublabel: 'Initial state' },
                                { id: 'n2', label: 'Core Process', sublabel: 'Mechanism' },
                                { id: 'n3', label: 'Outcome', sublabel: 'Final result' },
                              ],
                              edges: [
                                { from: 'n1', to: 'n2' },
                                { from: 'n2', to: 'n3' },
                              ],
                            };
                            updateItem(item.id, {
                              includeDiagram: true,
                              diagram: fallbackDiagram,
                            });
                          } else {
                            updateItem(item.id, { includeDiagram: e.target.checked });
                          }
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span>Show in Notebook</span>
                    </label>
                  </div>

                  {item.includeDiagram && item.diagram ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={item.diagram.title}
                          onChange={(e) =>
                            updateItem(item.id, {
                              diagram: { ...item.diagram!, title: e.target.value },
                            })
                          }
                          className="flex-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2.5 py-1 text-xs font-medium text-slate-800 dark:text-slate-200"
                        />
                        <select
                          value={item.diagram.type}
                          onChange={(e) =>
                            updateItem(item.id, {
                              diagram: {
                                ...item.diagram!,
                                type: e.target.value as DiagramSpec['type'],
                              },
                            })
                          }
                          className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-700 dark:text-slate-200"
                        >
                          <option value="flowchart">Flowchart</option>
                          <option value="cycle">Cycle</option>
                          <option value="hierarchy">Hierarchy</option>
                          <option value="comparison">Comparison</option>
                        </select>
                      </div>

                      <div className="rounded-lg overflow-hidden bg-[#fcfbf7] border border-slate-200">
                        <HanddrawnDiagram
                          diagram={item.diagram}
                          inkColor="royal-blue"
                          font="kalam"
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Enable to render a hand-drawn ink diagram alongside this answer.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
