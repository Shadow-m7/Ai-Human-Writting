export type AnswerLanguage = 'english' | 'hindi' | 'bilingual';
export type AnswerLength = 'short' | 'medium' | 'detailed';
export type HandwritingFont = 'kalam' | 'caveat' | 'patrick' | 'indie';
export type InkColor = 'royal-blue' | 'blue-black' | 'carbon-black';
export type PaperStyle = 'college-ruled' | 'narrow-ruled' | 'ivory-margin';

export interface StudentInfo {
  studentName: string;
  collegeName: string;
  course: string;
  semester: string;
  subject: string;
  rollNumber: string;
  assignmentTitle: string;
  submissionDate: string;
}

export interface DiagramNode {
  id: string;
  label: string;
  sublabel?: string;
}

export interface DiagramEdge {
  from: string;
  to: string;
  label?: string;
}

export interface DiagramSpec {
  title: string;
  type: 'flowchart' | 'cycle' | 'hierarchy' | 'comparison';
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

export interface AnswerTable {
  caption: string;
  headers: string[];
  rows: string[][];
}

export interface AnswerSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bulletPoints: string[];
  example?: string;
}

export interface QuestionAnswerItem {
  id: string;
  questionNumber: string;
  questionText: string;
  marksHint?: string;
  topic?: string;
  sections: AnswerSection[];
  table?: AnswerTable | null;
  diagram?: DiagramSpec | null;
  includeTable: boolean;
  includeDiagram: boolean;
  isGenerating?: boolean;
  error?: string;
}

export interface NotebookSettings {
  font: HandwritingFont;
  inkColor: InkColor;
  paperStyle: PaperStyle;
  fontSize: number; // 13 to 18 px
  showRuledLines: boolean;
  showMarginLine: boolean;
  showPageNumbers: boolean;
  showHeaderBlock: boolean;
  organicVariation: boolean;
}

export interface UploadedFileMeta {
  id: string;
  name: string;
  size: number;
  mimeType: string;
}

export interface AssignmentProject {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  language: AnswerLanguage;
  answerLength: AnswerLength;
  studentInfo: StudentInfo;
  notebookSettings: NotebookSettings;
  sourceFiles: UploadedFileMeta[];
  extractedRawText: string;
  items: QuestionAnswerItem[];
}

export function createDefaultStudentInfo(): StudentInfo {
  const today = new Date().toISOString().split('T')[0];
  return {
    studentName: '',
    collegeName: '',
    course: '',
    semester: '',
    subject: '',
    rollNumber: '',
    assignmentTitle: 'Academic Assignment',
    submissionDate: today,
  };
}

export function createDefaultNotebookSettings(): NotebookSettings {
  return {
    font: 'kalam',
    inkColor: 'royal-blue',
    paperStyle: 'college-ruled',
    fontSize: 15,
    showRuledLines: true,
    showMarginLine: true,
    showPageNumbers: true,
    showHeaderBlock: true,
    organicVariation: true,
  };
}

export function createNewProject(): AssignmentProject {
  const now = new Date().toISOString();
  return {
    id: `proj_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: 'Untitled Assignment',
    createdAt: now,
    updatedAt: now,
    language: 'english',
    answerLength: 'medium',
    studentInfo: createDefaultStudentInfo(),
    notebookSettings: createDefaultNotebookSettings(),
    sourceFiles: [],
    extractedRawText: '',
    items: [],
  };
}
