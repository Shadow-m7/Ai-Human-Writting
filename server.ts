import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import mammoth from 'mammoth';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  extractQuestionsFromInputs,
  generateAnswerForQuestion,
  type UploadedInputFile,
} from './server/gemini.ts';
import {
  listProjects,
  getProjectById,
  saveProject,
  deleteProjectById,
} from './server/storage.ts';
import type { AssignmentProject } from './src/types/assignment.ts';

const PORT = Number(process.env.PORT || 3000);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB per file
    files: 10,
  },
});

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      hasGeminiKey: Boolean(
        process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'
      ),
    });
  });

  // Extract questions from uploaded PDF, JPG, PNG, DOCX files and/or pasted text
  app.post('/api/extract', upload.array('files', 10), async (req, res) => {
    try {
      const uploadedFiles = (req.files as Express.Multer.File[] | undefined) || [];
      const pastedText = typeof req.body?.pastedText === 'string' ? req.body.pastedText : '';

      if (uploadedFiles.length === 0 && !pastedText.trim()) {
        return res.status(400).json({
          error: 'Please upload at least one file (PDF, JPG, PNG, DOCX) or paste assignment text.',
        });
      }

      const processedInputs: UploadedInputFile[] = [];
      const rawTextSegments: string[] = [];

      for (const file of uploadedFiles) {
        const lowerName = file.originalname.toLowerCase();
        const isDocx =
          file.mimetype ===
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
          lowerName.endsWith('.docx');
        const isPlainText =
          file.mimetype.startsWith('text/') || lowerName.endsWith('.txt');

        if (isDocx) {
          const result = await mammoth.extractRawText({ buffer: file.buffer });
          const text = result.value?.trim() || '';
          processedInputs.push({
            originalname: file.originalname,
            mimetype: file.mimetype,
            buffer: file.buffer,
            extractedText: text,
          });
          if (text) rawTextSegments.push(`[${file.originalname}]\n${text}`);
        } else if (isPlainText) {
          const text = file.buffer.toString('utf-8').trim();
          processedInputs.push({
            originalname: file.originalname,
            mimetype: file.mimetype,
            buffer: file.buffer,
            extractedText: text,
          });
          if (text) rawTextSegments.push(`[${file.originalname}]\n${text}`);
        } else if (
          file.mimetype === 'application/pdf' ||
          file.mimetype === 'image/jpeg' ||
          file.mimetype === 'image/jpg' ||
          file.mimetype === 'image/png' ||
          file.mimetype === 'image/webp' ||
          lowerName.endsWith('.pdf') ||
          lowerName.endsWith('.jpg') ||
          lowerName.endsWith('.jpeg') ||
          lowerName.endsWith('.png')
        ) {
          let normalizedMime = file.mimetype;
          if (!normalizedMime || normalizedMime === 'application/octet-stream') {
            if (lowerName.endsWith('.pdf')) normalizedMime = 'application/pdf';
            else if (lowerName.endsWith('.png')) normalizedMime = 'image/png';
            else normalizedMime = 'image/jpeg';
          } else if (normalizedMime === 'image/jpg') {
            normalizedMime = 'image/jpeg';
          }
          processedInputs.push({
            originalname: file.originalname,
            mimetype: normalizedMime,
            buffer: file.buffer,
          });
        } else {
          return res.status(400).json({
            error: `Unsupported file format: "${file.originalname}". Supported formats are PDF, JPG, PNG, and DOCX.`,
          });
        }
      }

      if (pastedText.trim()) {
        rawTextSegments.push(`[Pasted Text]\n${pastedText.trim()}`);
      }

      const extraction = await extractQuestionsFromInputs(processedInputs, pastedText);
      const combinedRawText =
        rawTextSegments.length > 0 ? rawTextSegments.join('\n\n') : extraction.rawSummary;

      res.json({
        ...extraction,
        rawText: combinedRawText,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to process assignment files.';
      console.error('Extraction error:', error);
      res.status(500).json({ error: msg });
    }
  });

  // Generate structured answers for one or more questions
  app.post('/api/generate-answers', async (req, res) => {
    try {
      const { questions, language, length, subject, course } = req.body as {
        questions?: Array<{ id: string; questionText: string }>;
        language?: 'english' | 'hindi' | 'bilingual';
        length?: 'short' | 'medium' | 'detailed';
        subject?: string;
        course?: string;
      };

      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({ error: 'At least one question is required.' });
      }

      const results = [];
      for (const q of questions) {
        const answer = await generateAnswerForQuestion(q.id, q.questionText, {
          language: language || 'english',
          length: length || 'medium',
          subject,
          course,
        });
        results.push(answer);
      }

      res.json({ answers: results });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to generate answers.';
      console.error('Generate answers error:', error);
      res.status(500).json({ error: msg });
    }
  });

  // Regenerate or refine a single question answer
  app.post('/api/regenerate-answer', async (req, res) => {
    try {
      const { questionId, questionText, instruction, language, length, subject, course } =
        req.body as {
          questionId?: string;
          questionText?: string;
          instruction?: string;
          language?: 'english' | 'hindi' | 'bilingual';
          length?: 'short' | 'medium' | 'detailed';
          subject?: string;
          course?: string;
        };

      if (!questionId || !questionText?.trim()) {
        return res.status(400).json({ error: 'questionId and questionText are required.' });
      }

      const answer = await generateAnswerForQuestion(
        questionId,
        questionText,
        {
          language: language || 'english',
          length: length || 'medium',
          subject,
          course,
        },
        instruction
      );

      res.json({ answer });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to regenerate answer.';
      console.error('Regenerate error:', error);
      res.status(500).json({ error: msg });
    }
  });

  // Project Persistence Endpoints
  app.get('/api/projects', async (_req, res) => {
    try {
      const projects = await listProjects();
      res.json({ projects });
    } catch (error) {
      console.error('List projects error:', error);
      res.status(500).json({ error: 'Failed to load saved projects.' });
    }
  });

  app.get('/api/projects/:id', async (req, res) => {
    try {
      const project = await getProjectById(req.params.id);
      if (!project) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      res.json({ project });
    } catch (error) {
      console.error('Get project error:', error);
      res.status(500).json({ error: 'Failed to load project.' });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const project = req.body?.project as AssignmentProject | undefined;
      if (!project || !project.id) {
        return res.status(400).json({ error: 'Valid project payload is required.' });
      }
      const saved = await saveProject(project);
      res.json({ project: saved });
    } catch (error) {
      console.error('Save project error:', error);
      res.status(500).json({ error: 'Failed to save project.' });
    }
  });

  app.delete('/api/projects/:id', async (req, res) => {
    try {
      const deleted = await deleteProjectById(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Project not found.' });
      }
      res.json({ ok: true });
    } catch (error) {
      console.error('Delete project error:', error);
      res.status(500).json({ error: 'Failed to delete project.' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AI Assignment Studio running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
