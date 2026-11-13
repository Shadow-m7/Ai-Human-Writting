import { useState } from 'react';
import { Copy, FolderOpen, Search, Trash2 } from 'lucide-react';
import type { AnswerLanguage, AssignmentProject } from '../types/assignment';

interface SavedProjectsProps {
  projects: AssignmentProject[];
  currentProjectId: string;
  isLoading: boolean;
  onOpenProject: (project: AssignmentProject) => void;
  onDuplicateProject: (project: AssignmentProject) => void;
  onDeleteProject: (id: string) => void;
  onNewProject: () => void;
}

export function SavedProjects({
  projects,
  currentProjectId,
  isLoading,
  onOpenProject,
  onDuplicateProject,
  onDeleteProject,
  onNewProject,
}: SavedProjectsProps) {
  const [search, setSearch] = useState('');
  const [langFilter, setLangFilter] = useState<'all' | AnswerLanguage>('all');

  const filtered = projects.filter((p) => {
    const matchesLang = langFilter === 'all' || p.language === langFilter;
    const q = search.trim().toLowerCase();
    const matchesQuery =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.studentInfo.subject.toLowerCase().includes(q) ||
      p.studentInfo.studentName.toLowerCase().includes(q);
    return matchesLang && matchesQuery;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-100">
            Saved Assignment Projects
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Reopen, duplicate, or manage previously generated assignments stored on your workspace server.
          </p>
        </div>

        <button
          type="button"
          onClick={onNewProject}
          className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 whitespace-nowrap shrink-0 cursor-pointer"
        >
          New Assignment
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title, subject, or student name..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'english', label: 'English' },
              { id: 'hindi', label: 'Hindi' },
              { id: 'bilingual', label: 'Bilingual' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setLangFilter(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                langFilter === tab.id
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Projects Table / List */}
      {isLoading ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between animate-pulse">
              <div className="space-y-2">
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-3 w-72 bg-slate-100 dark:bg-slate-800/60 rounded" />
              </div>
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-center space-y-3">
          <FolderOpen className="w-8 h-8 mx-auto text-slate-400" />
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            {projects.length === 0 ? 'No Saved Projects Yet' : 'No Matching Projects'}
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {projects.length === 0
              ? 'Save your current assignment from the top bar after generating answers to revisit or reprint it anytime.'
              : 'Try adjusting your search query or language filter.'}
          </p>
          {projects.length === 0 && (
            <button
              type="button"
              onClick={onNewProject}
              className="mt-2 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 cursor-pointer"
            >
              Start First Assignment
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
          {filtered.map((project) => {
            const isCurrent = project.id === currentProjectId;
            const dateStr = new Date(project.updatedAt).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <div
                key={project.id}
                className="p-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display font-semibold text-sm text-slate-900 dark:text-slate-100 truncate">
                      {project.studentInfo.assignmentTitle || project.title}
                    </h3>
                    {isCurrent && (
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 shrink-0">
                        · Active
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                    <span>{project.studentInfo.subject || 'General Subject'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">
                      {project.items.length} {project.items.length === 1 ? 'Question' : 'Questions'}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{project.language}</span>
                    {project.studentInfo.studentName && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span>{project.studentInfo.studentName}</span>
                      </>
                    )}
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular">Updated {dateStr}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenProject(project)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white dark:bg-blue-600 hover:opacity-90 whitespace-nowrap cursor-pointer"
                  >
                    Open
                  </button>
                  <button
                    type="button"
                    onClick={() => onDuplicateProject(project)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                    aria-label="Duplicate project"
                    title="Duplicate project"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteProject(project.id)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 cursor-pointer"
                    aria-label="Delete project"
                    title="Delete project"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
