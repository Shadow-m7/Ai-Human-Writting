import { GoogleGenAI, Type } from '@google/genai';
import type { GenerateContentResponse } from '@google/genai';

export interface ExtractedQuestionDTO {
  questionNumber: string;
  questionText: string;
  marksHint?: string;
  topic?: string;
}

export interface ExtractionResultDTO {
  detectedLanguage: string;
  suggestedSubject: string;
  rawSummary: string;
  questions: ExtractedQuestionDTO[];
}

export interface UploadedInputFile {
  originalname: string;
  mimetype: string;
  buffer: Buffer;
  extractedText?: string;
}

export interface AnswerGenerationOptions {
  language: 'english' | 'hindi' | 'bilingual';
  length: 'short' | 'medium' | 'detailed';
  subject?: string;
  course?: string;
}

export interface GeneratedAnswerDTO {
  questionId: string;
  sections: Array<{
    heading: string;
    paragraphs: string[];
    bulletPoints: string[];
    example?: string;
  }>;
  table?: {
    caption: string;
    headers: string[];
    rows: string[][];
  } | null;
  diagram?: {
    title: string;
    type: 'flowchart' | 'cycle' | 'hierarchy' | 'comparison';
    nodes: Array<{ id: string; label: string; sublabel?: string }>;
    edges: Array<{ from: string; to: string; label?: string }>;
  } | null;
}

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in Settings > Secrets.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;
      const msg = err instanceof Error ? err.message : String(err);
      const isTransient =
        msg.includes('429') ||
        msg.includes('503') ||
        msg.includes('500') ||
        msg.includes('UNAVAILABLE') ||
        msg.includes('timeout');
      if (!isTransient || attempt === maxRetries) {
        break;
      }
      const delayMs = 800 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastError;
}

function mapGeminiError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (message.includes('API_KEY_INVALID') || message.includes('400')) {
    return new Error(
      'Invalid Gemini API key or malformed request. Check GEMINI_API_KEY in Settings > Secrets.'
    );
  }
  if (message.includes('PERMISSION_DENIED') || message.includes('403')) {
    return new Error(
      'Permission denied by Gemini API. Verify your GEMINI_API_KEY in Settings > Secrets.'
    );
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
    return new Error(
      'Gemini API rate limit reached. Please wait a moment and try again.'
    );
  }
  return new Error(message || 'Failed to communicate with Gemini AI.');
}

export async function extractQuestionsFromInputs(
  files: UploadedInputFile[],
  pastedText: string
): Promise<ExtractionResultDTO> {
  const ai = getGeminiClient();

  const parts: Array<
    | { text: string }
    | { inlineData: { mimeType: string; data: string } }
  > = [];

  parts.push({
    text: `You are an expert academic OCR and question-paper parser.
Analyze all provided uploaded documents (PDFs, images, DOCX text) and/or pasted assignment text.
1. Perform complete OCR if any file is an image or scanned PDF (supporting both English and Hindi/Devanagari scripts accurately).
2. Identify every individual assignment question in exact order, preserving sub-parts where they belong to the same question or splitting distinct numbered questions cleanly.
3. Ignore administrative noise like page footers, university watermarks, or generic instructions like "Attempt any 5" unless part of a question.
4. Detect the primary language and suggest the subject title if visible.`,
  });

  for (const file of files) {
    if (file.extractedText) {
      parts.push({
        text: `--- Extracted content from DOCX/Text file "${file.originalname}" ---\n${file.extractedText}\n--- End of "${file.originalname}" ---`,
      });
    } else if (
      file.mimetype === 'application/pdf' ||
      file.mimetype.startsWith('image/')
    ) {
      parts.push({
        text: `Uploaded document "${file.originalname}" (${file.mimetype}):`,
      });
      parts.push({
        inlineData: {
          mimeType: file.mimetype,
          data: file.buffer.toString('base64'),
        },
      });
    }
  }

  if (pastedText.trim()) {
    parts.push({
      text: `--- Student Pasted Question Text ---\n${pastedText.trim()}\n--- End of Pasted Text ---`,
    });
  }

  try {
    const response: GenerateContentResponse = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              detectedLanguage: {
                type: Type.STRING,
                description: 'Detected language e.g. English, Hindi, or Bilingual',
              },
              suggestedSubject: {
                type: Type.STRING,
                description: 'Academic subject inferred from the paper, or General Studies',
              },
              rawSummary: {
                type: Type.STRING,
                description: 'Brief clean transcription summary of the uploaded paper',
              },
              questions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    questionNumber: {
                      type: Type.STRING,
                      description: 'e.g. Q1, Q2, 1(a)',
                    },
                    questionText: {
                      type: Type.STRING,
                      description: 'Full clear question statement',
                    },
                    marksHint: {
                      type: Type.STRING,
                      description: 'Marks weightage if mentioned, e.g. 5 marks, or empty string',
                    },
                    topic: {
                      type: Type.STRING,
                      description: 'Short 2-4 word topic label',
                    },
                  },
                  required: ['questionNumber', 'questionText', 'topic'],
                },
              },
            },
            required: ['detectedLanguage', 'suggestedSubject', 'rawSummary', 'questions'],
          },
        },
      })
    );

    const jsonText = (response.text ?? '{}').trim();
    const parsed = JSON.parse(jsonText) as ExtractionResultDTO;
    return {
      detectedLanguage: parsed.detectedLanguage || 'English',
      suggestedSubject: parsed.suggestedSubject || '',
      rawSummary: parsed.rawSummary || '',
      questions: Array.isArray(parsed.questions) ? parsed.questions : [],
    };
  } catch (err) {
    throw mapGeminiError(err);
  }
}

const answerResponseSchema = {
  type: Type.OBJECT,
  properties: {
    sections: {
      type: Type.ARRAY,
      description: 'Logical sections of the student answer (1-4 sections depending on length)',
      items: {
        type: Type.OBJECT,
        properties: {
          heading: {
            type: Type.STRING,
            description: 'Clear educational subheading (e.g. Introduction, Core Mechanism, Key Applications)',
          },
          paragraphs: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Clear student-friendly explanation paragraphs (no markdown asterisks)',
          },
          bulletPoints: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Concise key points (plain text, no markdown bolding **)',
          },
          example: {
            type: Type.STRING,
            description: 'Optional illustrative example if relevant, otherwise empty string',
          },
        },
        required: ['heading', 'paragraphs', 'bulletPoints'],
      },
    },
    includeTable: {
      type: Type.BOOLEAN,
      description: 'True only if a structured comparison or summary table genuinely clarifies the answer',
    },
    table: {
      type: Type.OBJECT,
      description: 'Structured table when includeTable is true',
      properties: {
        caption: { type: Type.STRING },
        headers: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
        },
        rows: {
          type: Type.ARRAY,
          items: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
      },
      required: ['caption', 'headers', 'rows'],
    },
    includeDiagram: {
      type: Type.BOOLEAN,
      description: 'True when a conceptual flowchart, cycle, hierarchy, or comparison diagram helps explain the concept',
    },
    diagram: {
      type: Type.OBJECT,
      description: 'Compact educational diagram specification (3 to 6 nodes max) when includeDiagram is true',
      properties: {
        title: { type: Type.STRING },
        type: {
          type: Type.STRING,
          description: 'One of: flowchart, cycle, hierarchy, comparison',
        },
        nodes: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              label: { type: Type.STRING, description: 'Short node label (2-5 words)' },
              sublabel: { type: Type.STRING, description: 'Very brief 2-4 word detail' },
            },
            required: ['id', 'label'],
          },
        },
        edges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              from: { type: Type.STRING },
              to: { type: Type.STRING },
              label: { type: Type.STRING },
            },
            required: ['from', 'to'],
          },
        },
      },
      required: ['title', 'type', 'nodes', 'edges'],
    },
  },
  required: ['sections', 'includeTable', 'includeDiagram'],
};

function buildLanguageInstruction(language: AnswerGenerationOptions['language']): string {
  if (language === 'hindi') {
    return 'Write ALL headings, explanations, bullet points, examples, table text, and diagram labels in natural, academically accurate Hindi (Devanagari script, e.g., शुद्ध एवं सरल शैक्षणिक हिंदी). Standard technical terms may appear in parentheses where helpful.';
  }
  if (language === 'bilingual') {
    return 'Write primarily in clear English while providing key Hindi (Devanagari) technical terms or brief bilingual explanations where helpful for Indian university/school students.';
  }
  return 'Write in clear, well-structured academic English suitable for a diligent college/high-school student.';
}

function buildLengthInstruction(length: AnswerGenerationOptions['length']): string {
  if (length === 'short') {
    return 'Keep the answer concise and exam-focused (around 90-130 words total): 1-2 short sections, 3-4 crisp bullet points, and a quick example if applicable.';
  }
  if (length === 'detailed') {
    return 'Provide a thorough, well-organized, high-scoring assignment answer (around 300-420 words total): 3-4 structured sections (Introduction/Definition, Detailed Mechanism or Core Analysis, Real-World Example, Conclusion), clear bullet points, and include a table or educational diagram whenever appropriate.';
  }
  return 'Provide a balanced, medium-length student assignment answer (around 180-240 words total): 2-3 clear sections with concise paragraphs, bullet points, and an illustrative example. Include a table or diagram when it genuinely adds clarity.';
}

export async function generateAnswerForQuestion(
  questionId: string,
  questionText: string,
  options: AnswerGenerationOptions,
  customInstruction?: string
): Promise<GeneratedAnswerDTO> {
  const ai = getGeminiClient();

  const systemInstruction = `You are an expert university tutor helping a student draft clear, accurate, original study answers for their assignment notebook.
- ${buildLanguageInstruction(options.language)}
- ${buildLengthInstruction(options.length)}
- Context: Subject is "${options.subject || 'General Academic'}", Course is "${options.course || 'Undergraduate'}".
- IMPORTANT formatting rule: Output plain clean prose inside JSON fields. Do NOT include markdown syntax like **bold**, ## headings, or backticks inside strings because the notebook renderer styles headings and handwriting natively.
- For diagrams: keep node labels short (2-5 words) and limit diagrams to 3-6 nodes so they look clean when drawn as hand-drawn notebook diagrams.
- For tables: keep columns to 2-4 and rows to 3-5 with concise cell text.`;

  const prompt = customInstruction
    ? `Question: ${questionText}\n\nStudent Refinement Instruction: ${customInstruction}`
    : `Question: ${questionText}\n\nGenerate a structured, student-level educational answer.`;

  try {
    const response: GenerateContentResponse = await withRetry(() =>
      ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema: answerResponseSchema,
        },
      })
    );

    const raw = (response.text ?? '{}').trim();
    const parsed = JSON.parse(raw) as {
      sections?: GeneratedAnswerDTO['sections'];
      includeTable?: boolean;
      table?: GeneratedAnswerDTO['table'];
      includeDiagram?: boolean;
      diagram?: GeneratedAnswerDTO['diagram'];
    };

    const validDiagramType = (t?: string): 'flowchart' | 'cycle' | 'hierarchy' | 'comparison' => {
      if (t === 'cycle' || t === 'hierarchy' || t === 'comparison') return t;
      return 'flowchart';
    };

    return {
      questionId,
      sections: Array.isArray(parsed.sections) ? parsed.sections : [],
      table:
        parsed.includeTable && parsed.table && parsed.table.headers?.length
          ? parsed.table
          : null,
      diagram:
        parsed.includeDiagram && parsed.diagram && parsed.diagram.nodes?.length
          ? {
              ...parsed.diagram,
              type: validDiagramType(parsed.diagram.type),
            }
          : null,
    };
  } catch (err) {
    throw mapGeminiError(err);
  }
}
