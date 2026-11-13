import { Download, Menu, Save } from 'lucide-react';
import type { WorkspaceTab } from './Sidebar';

interface TopBarProps {
  projectTitle: string;
  activeTab: WorkspaceTab;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  canExport: boolean;
  onOpenMobileMenu: () => void;
  onSaveProject: () => void;
  onGoToExport: () => void;
}

const TAB_LABELS: Record<WorkspaceTab, string> = {
  upload: 'Upload & Setup',
  editor: 'Answer Editor',
  preview: 'Notebook Preview',
  projects: 'Saved Projects',
};

export function TopBar({
  projectTitle,
  activeTab,
  isSaving,
  hasUnsavedChanges,
  canExport,
  onOpenMobileMenu,
  onSaveProject,
  onGoToExport,
}: TopBarProps) {
  return (
    <header className="no-print sticky top-0 z-30 h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-8">
      {/* Left: Mobile Menu Trigger + Clean Breadcrumb Trail */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 -ml-1 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <nav className="flex items-center gap-2 text-sm min-w-0" aria-label="Breadcrumb">
          <span className="text-slate-500 dark:text-slate-400 hidden sm:inline whitespace-nowrap shrink-0">
            Projects
          </span>
          <span className="text-slate-400 dark:text-slate-600 hidden sm:inline" aria-hidden="true">
            /
          </span>
          <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[160px] sm:max-w-[260px]">
            {projectTitle || 'Untitled Assignment'}
          </span>
          <span className="text-slate-400 dark:text-slate-600" aria-hidden="true">
            /
          </span>
          <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
            {TAB_LABELS[activeTab]}
          </span>
        </nav>
      </div>

      {/* Right: Primary Workspace Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={onSaveProject}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 disabled:opacity-60 cursor-pointer"
        >
          <Save className="w-3.5 h-3.5 shrink-0" />
          <span>{isSaving ? 'Saving…' : hasUnsavedChanges ? 'Save Project' : 'Saved'}</span>
        </button>

        <button
          type="button"
          onClick={onGoToExport}
          disabled={!canExport}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition-colors whitespace-nowrap shrink-0 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span>Export A4 PDF</span>
        </button>
      </div>
    </header>
  );
}
