import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

export async function exportNotebookToPdf(
  sheetElements: HTMLElement[],
  filename: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  if (!sheetElements.length) {
    throw new Error('No notebook pages available to export.');
  }

  // Ensure all Google Fonts (handwriting + Devanagari) are fully loaded
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const total = sheetElements.length;

  for (let i = 0; i < total; i++) {
    onProgress?.(i + 1, total);
    const el = sheetElements[i];

    // Temporarily ensure element is rendered at natural A4 scale without CSS preview transforms
    const dataUrl = await toPng(el, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: '#fcfbf7',
      style: {
        transform: 'none',
        margin: '0',
      },
    });

    if (i > 0) {
      pdf.addPage('a4', 'portrait');
    }

    // Exact A4 dimensions: 210mm x 297mm
    pdf.addImage(dataUrl, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
  }

  const safeName = filename.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim() || 'Assignment_Notebook';
  pdf.save(`${safeName}.pdf`);
}
