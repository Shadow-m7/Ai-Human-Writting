import { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Loader2,
  Sparkles,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import type {
  AnswerLanguage,
  AnswerLength,
  StudentInfo,
  UploadedFileMeta,
} from '../types/assignment';

export type ProcessingStage =
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'generating'
  | 'complete'
  | 'error';

interface UploadStudioProps {
  studentInfo: StudentInfo;
  language: AnswerLanguage;
  answerLength: AnswerLength;
  pastedText: string;
  existingFiles: UploadedFileMeta[];
  stage: ProcessingStage;
  stageMessage: string;
  errorMessage: string | null;
  onUpdateStudentInfo: (patch: Partial<StudentInfo>) => void;
  onChangeLanguage: (lang: AnswerLanguage) => void;
  onChangeLength: (len: AnswerLength) => void;
  onChangePastedText: (text: string) => void;
  onProcessAssignment: (files: File[], pastedText: string) => Promise<void>;
  onLoadSamplePaper: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function UploadStudio({
  studentInfo,
  language,
  answerLength,
  pastedText,
  existingFiles,
  stage,
  stageMessage,
  errorMessage,
  onUpdateStudentInfo,
  onChangeLanguage,
  onChangeLength,
  onChangePastedText,
  onProcessAssignment,
  onLoadSamplePaper,
}: UploadStudioProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [queuedFiles, setQueuedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const isBusy = stage === 'uploading' || stage === 'extracting' || stage === 'generating';

  const handleFilesSelected = (incoming: FileList | null) => {
    if (!incoming) return;
    const valid: File[] = [];
    for (let i = 0; i < incoming.length; i++) {
      const f = incoming[i];
      const lower = f.name.toLowerCase();
      if (
        f.type === 'application/pdf' ||
        f.type.startsWith('image/') ||
        f.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        f.type.startsWith('text/') ||
        lower.endsWith('.pdf') ||
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.docx') ||
        lower.endsWith('.txt')
      ) {
        valid.push(f);
      }
    }
    if (valid.length > 0) {
      setQueuedFiles((prev) => [...prev, ...valid]);
    }
  };

  const removeQueuedFile = (index: number) => {
    setQueuedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onProcessAssignment(queuedFiles, pastedText);
  };

  const progressSteps = [
    { id: 'uploading', label: 'Uploading Documents' },
    { id: 'extracting', label: 'OCR & Question Parsing' },
    { id: 'generating', label: 'Generating Answers' },
    { id: 'complete', label: 'Ready to Edit & Export' },
  ];

  const activeStepIndex =
    stage === 'uploading'
      ? 0
      : stage === 'extracting'
      ? 1
      : stage === 'generating'
      ? 2
      : stage === 'complete'
      ? 3
      : -1;

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-6">
      {/* Intro Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Create &amp; Format Assignment
          </h1>
          <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
            Upload question papers in PDF, JPG, PNG, or DOCX format, or paste your questions below.
            Gemini extracts each question, writes structured student answers, and formats them onto ruled A4 sheets.
          </p>
        </div>

        <button
          type="button"
          onClick={onLoadSamplePaper}
          disabled={isBusy}
          className="px-4 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto cursor-pointer disabled:opacity-50"
        >
          Load Sample Paper
        </button>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div
          role="alert"
          className="p-4 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-200 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
          <div className="text-sm">
            <p className="font-semibold">Processing Error</p>
            <p className="mt-0.5 text-red-700 dark:text-red-300">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Multi-Stage Progress Indicator */}
      {stage !== 'idle' && stage !== 'error' && (
        <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2.5">
              {stage === 'complete' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin shrink-0" />
              )}
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {stageMessage}
              </span>
            </div>
            <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400">
              Step {Math.max(1, activeStepIndex + 1)} of {progressSteps.length}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {progressSteps.map((step, idx) => {
              const done = idx < activeStepIndex || stage === 'complete';
              const active = idx === activeStepIndex && stage !== 'complete';
              return (
                <div key={step.id} className="space-y-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-colors ${
                      done
                        ? 'bg-emerald-600 dark:bg-emerald-500'
                        : active
                        ? 'bg-blue-600 dark:bg-blue-500'
                        : 'bg-slate-200 dark:bg-slate-800'
                    }`}
                  />
                  <p
                    className={`text-xs font-medium ${
                      done || active
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {idx + 1}. {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main 2-Column Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): File Upload & Question Paste */}
        <div className="lg:col-span-7 space-y-6">
          <section className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                01. Upload Question Paper
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                PDF · JPG · PNG · DOCX (Multiple files allowed)
              </span>
            </div>

            {/* Drag & Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFilesSelected(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={`border-2 border-dashed rounded-xl p-7 text-center transition-colors cursor-pointer ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30'
                  : 'border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 bg-slate-50/60 dark:bg-slate-950/40'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.webp,.docx,.txt,application/pdf,image/jpeg,image/png,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  handleFilesSelected(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />
              <UploadCloud className="w-9 h-9 mx-auto text-blue-600 dark:text-blue-400 mb-3" />
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Drop question papers here or browse files
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Supports scanned PDFs, smartphone photos of printed sheets, and Word documents up to 20 MB each
              </p>
            </div>

            {/* Queued Files List */}
            {queuedFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                  <span>Selected Files ({queuedFiles.length})</span>
                  <button
                    type="button"
                    onClick={() => setQueuedFiles([])}
                    className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>

                <ul className="divide-y divide-slate-200 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  {queuedFiles.map((file, idx) => {
                    const isImg = file.type.startsWith('image/');
                    return (
                      <li
                        key={`${file.name}-${idx}`}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 bg-slate-50/50 dark:bg-slate-950/40"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {isImg ? (
                            <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                          <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">
                            {file.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400">
                            {formatBytes(file.size)}
                          </span>
                          <button
                            type="button"
                            onClick={() => removeQueuedFile(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                            aria-label={`Remove ${file.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}

            {/* Previously Attached Files in Saved Project */}
            {queuedFiles.length === 0 && existingFiles.length > 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400">
                Previously processed sources:{' '}
                {existingFiles.map((f) => f.name).join(' · ')}
              </div>
            )}

            {/* Or Paste Questions Directly */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <label
                htmlFor="paste-questions"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Or paste / type questions directly
              </label>
              <textarea
                id="paste-questions"
                rows={5}
                value={pastedText}
                onChange={(e) => onChangePastedText(e.target.value)}
                placeholder="Paste your assignment questions here (English or Hindi)..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3.5 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </section>

          {/* AI Generation Options */}
          <section className="p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-5">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              02. Answer Language &amp; Depth
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Language Selector */}
              <div className="space-y-2">
                <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Answer Language
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {(
                    [
                      { id: 'english', label: 'English' },
                      { id: 'hindi', label: 'Hindi' },
                      { id: 'bilingual', label: 'Bilingual' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeLanguage(opt.id)}
                      className={`py-2 px-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        language === opt.id
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Answer Length Selector */}
              <div className="space-y-2">
                <span className="block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Answer Depth
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  {(
                    [
                      { id: 'short', label: 'Short' },
                      { id: 'medium', label: 'Medium' },
                      { id: 'detailed', label: 'Detailed' },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => onChangeLength(opt.id)}
                      className={`py-2 px-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                        answerLength === opt.id
                          ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Includes structured headings, bullet points, examples, plus tables &amp; diagrams where helpful.
              </p>

              <button
                type="submit"
                disabled={isBusy || (queuedFiles.length === 0 && !pastedText.trim())}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                    <span>Processing…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>Extract &amp; Generate Answers</span>
                  </>
                )}
              </button>
            </div>
          </section>
        </div>

        {/* Right Column (5 cols): Student Cover Information */}
        <section className="lg:col-span-5 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              03. Student Notebook Header
            </h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Printed neatly in the cover block at the top of Page 1.
            </p>
          </div>

          <div className="space-y-3.5">
            <div>
              <label
                htmlFor="assignment-title"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                Assignment Title
              </label>
              <input
                id="assignment-title"
                type="text"
                value={studentInfo.assignmentTitle}
                onChange={(e) => onUpdateStudentInfo({ assignmentTitle: e.target.value })}
                placeholder="e.g. Operating Systems — Unit 2 Assignment"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="student-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Student Name
                </label>
                <input
                  id="student-name"
                  type="text"
                  value={studentInfo.studentName}
                  onChange={(e) => onUpdateStudentInfo({ studentName: e.target.value })}
                  placeholder="Aarav Sharma"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="roll-number"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Roll Number
                </label>
                <input
                  id="roll-number"
                  type="text"
                  value={studentInfo.rollNumber}
                  onChange={(e) => onUpdateStudentInfo({ rollNumber: e.target.value })}
                  placeholder="24CS108"
                  className="w-full font-mono-tabular rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="college-name"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
              >
                College / Institution Name
              </label>
              <input
                id="college-name"
                type="text"
                value={studentInfo.collegeName}
                onChange={(e) => onUpdateStudentInfo({ collegeName: e.target.value })}
                placeholder="National Institute of Technology"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="course-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Course
                </label>
                <input
                  id="course-name"
                  type="text"
                  value={studentInfo.course}
                  onChange={(e) => onUpdateStudentInfo({ course: e.target.value })}
                  placeholder="B.Tech CSE"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="semester-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Semester
                </label>
                <input
                  id="semester-name"
                  type="text"
                  value={studentInfo.semester}
                  onChange={(e) => onUpdateStudentInfo({ semester: e.target.value })}
                  placeholder="Semester IV"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="subject-name"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Subject
                </label>
                <input
                  id="subject-name"
                  type="text"
                  value={studentInfo.subject}
                  onChange={(e) => onUpdateStudentInfo({ subject: e.target.value })}
                  placeholder="Operating Systems"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label
                  htmlFor="submission-date"
                  className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1"
                >
                  Submission Date
                </label>
                <input
                  id="submission-date"
                  type="date"
                  value={studentInfo.submissionDate}
                  onChange={(e) => onUpdateStudentInfo({ submissionDate: e.target.value })}
                  className="w-full font-mono-tabular rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 px-3 py-2 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </form>
  );
}
