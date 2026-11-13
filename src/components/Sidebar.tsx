import {
  BookOpen,
  FilePlus2,
  FileText,
  FolderOpen,
  HelpCircle,
  Moon,
  PenLine,
  Sun,
  Upload,
  X,
} from 'lucide-react';

export type WorkspaceTab = 'upload' | 'editor' | 'preview' | 'projects';

interface SidebarProps {
  activeTab: WorkspaceTab;
  onSelectTab: (tab: WorkspaceTab) => void;
  questionCount: number;
  answeredCount: number;
  savedCount: number;
  isDark: boolean;
  onToggleTheme: () => void;
  onNewProject: () => void;
  onOpenDocs: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({
  activeTab,
  onSelectTab,
  questionCount,
  answeredCount,
  savedCount,
  isDark,
  onToggleTheme,
  onNewProject,
  onOpenDocs,
  isOpenMobile,
  onCloseMobile,
}: SidebarProps) {
  const navItems: Array<{
    id: WorkspaceTab;
    label: string;
    meta?: string;
    icon: typeof Upload;
  }> = [
    {
      id: 'upload',
      label: 'Upload & Setup',
      meta: questionCount > 0 ? `${questionCount} Qs` : undefined,
      icon: Upload,
    },
    {
      id: 'editor',
      label: 'Answer Editor',
      meta: questionCount > 0 ? `${answeredCount}/${questionCount}` : undefined,
      icon: PenLine,
    },
    {
      id: 'preview',
      label: 'Notebook Preview',
      meta: answeredCount > 0 ? 'A4 Ready' : undefined,
      icon: FileText,
    },
    {
      id: 'projects',
      label: 'Saved Projects',
      meta: savedCount > 0 ? `${savedCount}` : undefined,
      icon: FolderOpen,
    },
  ];

  const content = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 w-[260px]">
      {/* Brand Mark */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <span className="font-display font-bold text-base tracking-tight text-slate-900 dark:text-slate-100 truncate">
            Assignment Studio
          </span>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Close navigation menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Primary Action: New Assignment */}
      <div className="p-4">
        <button
          type="button"
          onClick={() => {
            onNewProject();
            onCloseMobile();
          }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold bg-slate-900 text-white hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <FilePlus2 className="w-4 h-4 shrink-0" />
          <span>New Assignment</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto" aria-label="Workspace sections">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelectTab(item.id);
                onCloseMobile();
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                active
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/70'
              }`}
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.meta && (
                <span className="font-mono-tabular text-xs text-slate-500 dark:text-slate-400 shrink-0 ml-2">
                  {item.meta}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Theme & Docs Controls */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
        <button
          type="button"
          onClick={onToggleTheme}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
        >
          <span className="flex items-center gap-2.5">
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            onOpenDocs();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap cursor-pointer"
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          <span>Setup &amp; Env Guide</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="no-print hidden lg:block shrink-0 h-screen sticky top-0">
        {content}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isOpenMobile && (
        <div className="no-print fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 h-full">{content}</div>
        </div>
      )}
    </>
  );
}
