import { useCallback, useEffect, useState } from 'react';
import { AnswerEditor } from './components/AnswerEditor';
import { NotebookPreview } from './components/NotebookPreview';
import { SavedProjects } from './components/SavedProjects';
import { SetupGuideModal } from './components/SetupGuideModal';
import { Sidebar, type WorkspaceTab } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { UploadStudio, type ProcessingStage } from './components/UploadStudio';
import {
  createNewProject,
  type AnswerLanguage,
  type AnswerLength,
  type AssignmentProject,
  type NotebookSettings,
  type QuestionAnswerItem,
  type StudentInfo,
} from './types/assignment';

const LOCAL_PROJECTS_KEY = 'ai_assignment_studio_projects_v1';
const THEME_KEY = 'ai_assignment_studio_theme';

interface ApiGeneratedAnswer {
  questionId: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bulletPoints: string[];
    example?: string;
  }>;
  table?: QuestionAnswerItem['table'];
  diagram?: QuestionAnswerItem['diagram'];
}

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('upload');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);

  const [project, setProject] = useState<AssignmentProject>(() => createNewProject());
  const [pastedText, setPastedText] = useState<string>('');
  const [savedProjects, setSavedProjects] = useState<AssignmentProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);

  const [stage, setStage] = useState<ProcessingStage>('idle');
  const [stageMessage, setStageMessage] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isRegeneratingAll, setIsRegeneratingAll] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
    } catch {
      // Ignore storage quota issues
    }
  }, [isDark]);

  // Load saved projects from backend (fallback to localStorage cache)
  const loadSavedProjects = useCallback(async () => {
    setIsLoadingProjects(true);
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = (await res.json()) as { projects?: AssignmentProject[] };
        const list = Array.isArray(data.projects) ? data.projects : [];
        setSavedProjects(list);
        try {
          localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(list));
        } catch {
          // ignore
        }
        return;
      }
    } catch {
      // Fallback below
    }
    try {
      const cached = localStorage.getItem(LOCAL_PROJECTS_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) setSavedProjects(parsed);
      }
    } catch {
      // ignore
    } finally {
      setIsLoadingProjects(false);
    }
  }, []);

  useEffect(() => {
    void loadSavedProjects();
  }, [loadSavedProjects]);

  const persistProject = useCallback(async (target: AssignmentProject) => {
    setIsSaving(true);
    const derivedTitle =
      target.studentInfo.assignmentTitle.trim() ||
      target.studentInfo.subject.trim() ||
      target.title ||
      'Untitled Assignment';

    const payload: AssignmentProject = {
      ...target,
      title: derivedTitle,
      updatedAt: new Date().toISOString(),
    };

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: payload }),
      });

      if (res.ok) {
        const data = (await res.json()) as { project: AssignmentProject };
        setProject(data.project);
        setSavedProjects((prev) => {
          const rest = prev.filter((p) => p.id !== data.project.id);
          const next = [data.project, ...rest];
          try {
            localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(next));
          } catch {
            // ignore
          }
          return next;
        });
        setHasUnsavedChanges(false);
      }
    } catch (err) {
      console.error('Failed to save project:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  const updateProjectState = (
    updater: (prev: AssignmentProject) => AssignmentProject
  ) => {
    setProject((prev) => updater(prev));
    setHasUnsavedChanges(true);
  };

  const handleUpdateStudentInfo = (patch: Partial<StudentInfo>) => {
    updateProjectState((prev) => ({
      ...prev,
      studentInfo: { ...prev.studentInfo, ...patch },
      title:
        patch.assignmentTitle ??
        patch.subject ??
        prev.title,
    }));
  };

  const handleUpdateSettings = (patch: Partial<NotebookSettings>) => {
    updateProjectState((prev) => ({
      ...prev,
      notebookSettings: { ...prev.notebookSettings, ...patch },
    }));
  };

  const handleChangeLanguage = (lang: AnswerLanguage) => {
    updateProjectState((prev) => ({
      ...prev,
      language: lang,
      // Auto-select Kalam when Hindi/Bilingual is picked so Devanagari renders cleanly
      notebookSettings:
        lang !== 'english'
          ? { ...prev.notebookSettings, font: 'kalam' }
          : prev.notebookSettings,
    }));
  };

  const handleChangeLength = (len: AnswerLength) => {
    updateProjectState((prev) => ({ ...prev, answerLength: len }));
  };

  const handleProcessAssignment = async (files: File[], textInput: string) => {
    setErrorMessage(null);
    setStage('uploading');
    setStageMessage('Uploading documents and reading text…');

    try {
      const formData = new FormData();
      for (const f of files) {
        formData.append('files', f);
      }
      formData.append('pastedText', textInput);

      setStage('extracting');
      setStageMessage('Running OCR and identifying individual questions…');

      const extractRes = await fetch('/api/extract', {
        method: 'POST',
        body: formData,
      });

      const extractData = await extractRes.json();
      if (!extractRes.ok) {
        throw new Error(extractData?.error || 'Failed to extract questions from input.');
      }

      const extractedQuestions = Array.isArray(extractData.questions)
        ? extractData.questions
        : [];

      if (extractedQuestions.length === 0) {
        throw new Error(
          'No questions could be identified from the uploaded content. Try pasting the questions or uploading a clearer image/PDF.'
        );
      }

      const initialItems: QuestionAnswerItem[] = extractedQuestions.map(
        (
          q: {
            questionNumber?: string;
            questionText: string;
            marksHint?: string;
            topic?: string;
          },
          idx: number
        ) => ({
          id: `q_${Date.now()}_${idx}`,
          questionNumber: q.questionNumber || `Q${idx + 1}`,
          questionText: q.questionText,
          marksHint: q.marksHint || '',
          topic: q.topic || '',
          sections: [],
          table: null,
          diagram: null,
          includeTable: false,
          includeDiagram: false,
        })
      );

      setStage('generating');
      setStageMessage(
        `Generating structured ${project.answerLength} answers for ${initialItems.length} questions…`
      );

      const genRes = await fetch('/api/generate-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: initialItems.map((q) => ({
            id: q.id,
            questionText: q.questionText,
          })),
          language: project.language,
          length: project.answerLength,
          subject: project.studentInfo.subject || extractData.suggestedSubject,
          course: project.studentInfo.course,
        }),
      });

      const genData = await genRes.json();
      if (!genRes.ok) {
        throw new Error(genData?.error || 'Failed to generate answers.');
      }

      const answerMap = new Map<string, ApiGeneratedAnswer>(
        ((genData.answers as ApiGeneratedAnswer[]) || []).map((a) => [a.questionId, a])
      );

      const completedItems: QuestionAnswerItem[] = initialItems.map((item) => {
        const ans = answerMap.get(item.id);
        return {
          ...item,
          sections: (ans?.sections || []).map((s, sIdx) => ({
            id: `${item.id}_s_${sIdx}`,
            heading: s.heading || 'Answer',
            paragraphs: Array.isArray(s.paragraphs) ? s.paragraphs : [],
            bulletPoints: Array.isArray(s.bulletPoints) ? s.bulletPoints : [],
            example: s.example || '',
          })),
          table: ans?.table ?? null,
          diagram: ans?.diagram ?? null,
          includeTable: Boolean(ans?.table),
          includeDiagram: Boolean(ans?.diagram),
        };
      });

      const suggestedSub =
        project.studentInfo.subject || extractData.suggestedSubject || '';

      const updatedProject: AssignmentProject = {
        ...project,
        title:
          project.studentInfo.assignmentTitle ||
          suggestedSub ||
          'Processed Assignment',
        studentInfo: {
          ...project.studentInfo,
          subject: suggestedSub,
        },
        sourceFiles:
          files.length > 0
            ? files.map((f, i) => ({
                id: `f_${Date.now()}_${i}`,
                name: f.name,
                size: f.size,
                mimeType: f.type,
              }))
            : project.sourceFiles,
        extractedRawText: extractData.rawText || '',
        items: completedItems,
      };

      setProject(updatedProject);
      setStage('complete');
      setStageMessage('Questions extracted and answers generated.');
      await persistProject(updatedProject);
      setActiveTab('editor');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unexpected error during processing.';
      setStage('error');
      setErrorMessage(msg);
    }
  };

  const handleRegenerateOne = async (questionId: string, instruction?: string) => {
    const target = project.items.find((it) => it.id === questionId);
    if (!target) return;

    updateProjectState((prev) => ({
      ...prev,
      items: prev.items.map((it) =>
        it.id === questionId ? { ...it, isGenerating: true, error: undefined } : it
      ),
    }));

    try {
      const res = await fetch('/api/regenerate-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          questionText: target.questionText,
          instruction,
          language: project.language,
          length: project.answerLength,
          subject: project.studentInfo.subject,
          course: project.studentInfo.course,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to regenerate answer.');
      }

      const ans = data.answer as ApiGeneratedAnswer;
      updateProjectState((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === questionId
            ? {
                ...it,
                isGenerating: false,
                error: undefined,
                sections: (ans.sections || []).map((s, sIdx) => ({
                  id: `${questionId}_s_${Date.now()}_${sIdx}`,
                  heading: s.heading || 'Answer',
                  paragraphs: Array.isArray(s.paragraphs) ? s.paragraphs : [],
                  bulletPoints: Array.isArray(s.bulletPoints) ? s.bulletPoints : [],
                  example: s.example || '',
                })),
                table: ans.table ?? it.table,
                diagram: ans.diagram ?? it.diagram,
                includeTable: Boolean(ans.table),
                includeDiagram: Boolean(ans.diagram),
              }
            : it
        ),
      }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Regeneration failed.';
      updateProjectState((prev) => ({
        ...prev,
        items: prev.items.map((it) =>
          it.id === questionId ? { ...it, isGenerating: false, error: msg } : it
        ),
      }));
    }
  };

  const handleRegenerateAll = async () => {
    if (project.items.length === 0) return;
    setIsRegeneratingAll(true);
    try {
      const res = await fetch('/api/generate-answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questions: project.items.map((q) => ({
            id: q.id,
            questionText: q.questionText,
          })),
          language: project.language,
          length: project.answerLength,
          subject: project.studentInfo.subject,
          course: project.studentInfo.course,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to regenerate all answers.');
      }

      const map = new Map<string, ApiGeneratedAnswer>(
        ((data.answers as ApiGeneratedAnswer[]) || []).map((a) => [a.questionId, a])
      );

      updateProjectState((prev) => ({
        ...prev,
        items: prev.items.map((it) => {
          const ans = map.get(it.id);
          if (!ans) return it;
          return {
            ...it,
            sections: (ans.sections || []).map((s, sIdx) => ({
              id: `${it.id}_s_${Date.now()}_${sIdx}`,
              heading: s.heading || 'Answer',
              paragraphs: Array.isArray(s.paragraphs) ? s.paragraphs : [],
              bulletPoints: Array.isArray(s.bulletPoints) ? s.bulletPoints : [],
              example: s.example || '',
            })),
            table: ans.table ?? null,
            diagram: ans.diagram ?? null,
            includeTable: Boolean(ans.table),
            includeDiagram: Boolean(ans.diagram),
          };
        }),
      }));
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Regenerate all failed.');
    } finally {
      setIsRegeneratingAll(false);
    }
  };

  const handleLoadSamplePaper = () => {
    setErrorMessage(null);
    setStage('idle');
    setPastedText(
      `Q1. Explain the difference between Process and Thread in Operating Systems with a neat comparison table. (5 Marks)\nQ2. Describe the Process Life Cycle states (New, Ready, Running, Waiting, Terminated) with a state transition diagram. (5 Marks)\nQ3. What is Deadlock? State the four necessary Coffman conditions for deadlock to occur with a real-life analogy. (5 Marks)`
    );
    handleUpdateStudentInfo({
      assignmentTitle: 'Operating Systems — Unit 2 Assignment',
      studentName: 'Aarav Sharma',
      collegeName: 'National Institute of Technology',
      course: 'B.Tech Computer Science',
      semester: 'Semester IV',
      subject: 'Operating Systems (CS-402)',
      rollNumber: '24CS108',
    });
  };

  const handleNewProject = () => {
    setProject(createNewProject());
    setPastedText('');
    setStage('idle');
    setErrorMessage(null);
    setHasUnsavedChanges(false);
    setActiveTab('upload');
  };

  const handleOpenProject = (proj: AssignmentProject) => {
    setProject(proj);
    setPastedText(proj.extractedRawText || '');
    setStage('idle');
    setErrorMessage(null);
    setHasUnsavedChanges(false);
    setActiveTab(proj.items.length > 0 ? 'preview' : 'upload');
  };

  const handleDuplicateProject = async (proj: AssignmentProject) => {
    const copy: AssignmentProject = {
      ...proj,
      id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title: `${proj.title} (Copy)`,
      studentInfo: {
        ...proj.studentInfo,
        assignmentTitle: `${proj.studentInfo.assignmentTitle || proj.title} (Copy)`,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await persistProject(copy);
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await fetch(`/api/projects/${encodeURIComponent(id)}`, { method: 'DELETE' });
      setSavedProjects((prev) => {
        const next = prev.filter((p) => p.id !== id);
        try {
          localStorage.setItem(LOCAL_PROJECTS_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    } catch (err) {
      console.error('Delete project failed:', err);
    }
  };

  const answeredCount = project.items.filter((i) => i.sections.length > 0).length;

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        questionCount={project.items.length}
        answeredCount={answeredCount}
        savedCount={savedProjects.length}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        onNewProject={handleNewProject}
        onOpenDocs={() => setIsDocsOpen(true)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <TopBar
          projectTitle={project.studentInfo.assignmentTitle || project.title}
          activeTab={activeTab}
          isSaving={isSaving}
          hasUnsavedChanges={hasUnsavedChanges}
          canExport={project.items.length > 0}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onSaveProject={() => void persistProject(project)}
          onGoToExport={() => setActiveTab('preview')}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0">
          {activeTab === 'upload' && (
            <UploadStudio
              studentInfo={project.studentInfo}
              language={project.language}
              answerLength={project.answerLength}
              pastedText={pastedText}
              existingFiles={project.sourceFiles}
              stage={stage}
              stageMessage={stageMessage}
              errorMessage={errorMessage}
              onUpdateStudentInfo={handleUpdateStudentInfo}
              onChangeLanguage={handleChangeLanguage}
              onChangeLength={handleChangeLength}
              onChangePastedText={setPastedText}
              onProcessAssignment={handleProcessAssignment}
              onLoadSamplePaper={handleLoadSamplePaper}
            />
          )}

          {activeTab === 'editor' && (
            <AnswerEditor
              items={project.items}
              language={project.language}
              answerLength={project.answerLength}
              isRegeneratingAll={isRegeneratingAll}
              onUpdateItems={(items) => updateProjectState((prev) => ({ ...prev, items }))}
              onRegenerateOne={handleRegenerateOne}
              onRegenerateAll={handleRegenerateAll}
              onChangeLanguage={handleChangeLanguage}
              onChangeLength={handleChangeLength}
              onGoToUpload={() => setActiveTab('upload')}
              onGoToPreview={() => setActiveTab('preview')}
            />
          )}

          {activeTab === 'preview' && (
            <NotebookPreview
              items={project.items}
              studentInfo={project.studentInfo}
              settings={project.notebookSettings}
              onUpdateSettings={handleUpdateSettings}
              onGoToEditor={() => setActiveTab('editor')}
              onGoToUpload={() => setActiveTab('upload')}
            />
          )}

          {activeTab === 'projects' && (
            <SavedProjects
              projects={savedProjects}
              currentProjectId={project.id}
              isLoading={isLoadingProjects}
              onOpenProject={handleOpenProject}
              onDuplicateProject={handleDuplicateProject}
              onDeleteProject={handleDeleteProject}
              onNewProject={handleNewProject}
            />
          )}
        </main>
      </div>

      <SetupGuideModal
        isOpen={isDocsOpen}
        onClose={() => setIsDocsOpen(false)}
      />
    </div>
  );
}
