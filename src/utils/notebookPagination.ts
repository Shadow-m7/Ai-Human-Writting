import type {
  AnswerSection,
  AnswerTable,
  DiagramSpec,
  NotebookSettings,
  QuestionAnswerItem,
} from '../types/assignment';

export type PageBlock =
  | {
      kind: 'question-header';
      key: string;
      questionNumber: string;
      questionText: string;
      marksHint?: string;
    }
  | {
      kind: 'section-heading';
      key: string;
      heading: string;
    }
  | {
      kind: 'paragraph';
      key: string;
      text: string;
    }
  | {
      kind: 'bullet';
      key: string;
      text: string;
    }
  | {
      kind: 'example';
      key: string;
      text: string;
    }
  | {
      kind: 'table';
      key: string;
      table: AnswerTable;
    }
  | {
      kind: 'diagram';
      key: string;
      diagram: DiagramSpec;
    }
  | {
      kind: 'spacer';
      key: string;
    };

export interface PaginatedPage {
  pageNumber: number;
  hasCoverHeader: boolean;
  blocks: PageBlock[];
}

export function getLineHeightPx(paperStyle: NotebookSettings['paperStyle']): number {
  return paperStyle === 'narrow-ruled' ? 24 : 30;
}

function estimateWrappedLines(text: string, charsPerLine: number): number {
  if (!text) return 0;
  const paragraphs = text.split('\n');
  let lines = 0;
  for (const p of paragraphs) {
    const trimmed = p.trim();
    if (!trimmed) {
      lines += 1;
    } else {
      lines += Math.max(1, Math.ceil(trimmed.length / charsPerLine));
    }
  }
  return lines;
}

function estimateBlockHeight(
  block: PageBlock,
  settings: NotebookSettings
): number {
  const lineH = getLineHeightPx(settings.paperStyle);
  // Adjust character density based on fontSize (15px baseline ~ 64 chars across A4 content width)
  const scaleFactor = 15 / Math.max(12, settings.fontSize);
  const charsPerLine = Math.round(62 * scaleFactor);

  switch (block.kind) {
    case 'question-header': {
      const lines = estimateWrappedLines(block.questionText, Math.round(charsPerLine * 0.92));
      return lines * lineH + lineH * 0.55;
    }
    case 'section-heading':
      return lineH * 1.25;
    case 'paragraph': {
      const lines = estimateWrappedLines(block.text, charsPerLine);
      return lines * lineH + 4;
    }
    case 'bullet': {
      const lines = estimateWrappedLines(block.text, Math.round(charsPerLine * 0.9));
      return lines * lineH + 2;
    }
    case 'example': {
      const lines = estimateWrappedLines(`Example: ${block.text}`, Math.round(charsPerLine * 0.92));
      return lines * lineH + 14;
    }
    case 'table': {
      const rows = block.table.rows.length;
      const headerHeight = 34;
      const rowHeight = 32;
      const captionHeight = block.table.caption ? 26 : 0;
      return captionHeight + headerHeight + rows * rowHeight + 22;
    }
    case 'diagram':
      return 236;
    case 'spacer':
      return lineH * 0.7;
  }
}

export function paginateAssignment(
  items: QuestionAnswerItem[],
  settings: NotebookSettings
): PaginatedPage[] {
  const allBlocks: PageBlock[] = [];

  items.forEach((item, qIdx) => {
    allBlocks.push({
      kind: 'question-header',
      key: `${item.id}-qhead`,
      questionNumber: item.questionNumber || `Q${qIdx + 1}`,
      questionText: item.questionText,
      marksHint: item.marksHint,
    });

    item.sections.forEach((sec: AnswerSection, sIdx: number) => {
      if (sec.heading.trim()) {
        allBlocks.push({
          kind: 'section-heading',
          key: `${item.id}-sec-${sIdx}-head`,
          heading: sec.heading.trim(),
        });
      }
      sec.paragraphs.forEach((p, pIdx) => {
        if (p.trim()) {
          allBlocks.push({
            kind: 'paragraph',
            key: `${item.id}-sec-${sIdx}-p-${pIdx}`,
            text: p.trim(),
          });
        }
      });
      sec.bulletPoints.forEach((b, bIdx) => {
        if (b.trim()) {
          allBlocks.push({
            kind: 'bullet',
            key: `${item.id}-sec-${sIdx}-b-${bIdx}`,
            text: b.trim(),
          });
        }
      });
      if (sec.example && sec.example.trim()) {
        allBlocks.push({
          kind: 'example',
          key: `${item.id}-sec-${sIdx}-ex`,
          text: sec.example.trim(),
        });
      }
    });

    if (item.includeTable && item.table && item.table.headers.length > 0) {
      allBlocks.push({
        kind: 'table',
        key: `${item.id}-table`,
        table: item.table,
      });
    }

    if (item.includeDiagram && item.diagram && item.diagram.nodes.length > 0) {
      allBlocks.push({
        kind: 'diagram',
        key: `${item.id}-diagram`,
        diagram: item.diagram,
      });
    }

    if (qIdx < items.length - 1) {
      allBlocks.push({
        kind: 'spacer',
        key: `${item.id}-spacer`,
      });
    }
  });

  // A4 at 96dpi is ~1122px tall.
  // Top padding: 36px, Bottom footer: 50px -> ~1036px max. Keep safety margin -> 960px.
  const FIRST_PAGE_BUDGET = settings.showHeaderBlock ? 800 : 960;
  const CONTINUATION_BUDGET = 960;

  const pages: PaginatedPage[] = [];
  let currentBlocks: PageBlock[] = [];
  let currentHeight = 0;
  let pageIdx = 0;

  const pushPage = () => {
    pages.push({
      pageNumber: pageIdx + 1,
      hasCoverHeader: pageIdx === 0 && settings.showHeaderBlock,
      blocks: currentBlocks,
    });
    pageIdx += 1;
    currentBlocks = [];
    currentHeight = 0;
  };

  for (let i = 0; i < allBlocks.length; i++) {
    const block = allBlocks[i];
    const blockHeight = estimateBlockHeight(block, settings);
    const budget = pageIdx === 0 ? FIRST_PAGE_BUDGET : CONTINUATION_BUDGET;

    // Prevent orphan question-header or section-heading at very bottom of a page
    const nextBlock = allBlocks[i + 1];
    const isHeadingLike = block.kind === 'question-header' || block.kind === 'section-heading';
    const nextHeight = nextBlock ? estimateBlockHeight(nextBlock, settings) : 0;
    const lookaheadHeight = isHeadingLike ? blockHeight + Math.min(nextHeight, 90) : blockHeight;

    if (currentBlocks.length > 0 && currentHeight + lookaheadHeight > budget) {
      // Skip trailing spacer at page boundary
      if (block.kind === 'spacer') {
        continue;
      }
      pushPage();
    }

    if (block.kind === 'spacer' && currentBlocks.length === 0) {
      continue;
    }

    currentBlocks.push(block);
    currentHeight += blockHeight;
  }

  if (currentBlocks.length > 0 || pages.length === 0) {
    pushPage();
  }

  return pages;
}
