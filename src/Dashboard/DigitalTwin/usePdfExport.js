import { useCallback, useState } from 'react';

export function usePdfExport() {
  const [exporting, setExporting] = useState(false);

  const exportPdf = useCallback(async (containerSelector = '.flat-preview__cards', filename = 'menu.pdf') => {
    setExporting(true);
    try {
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import('html2canvas'),
        import('jspdf'),
      ]);

      const el = document.querySelector(containerSelector);
      if (!el) throw new Error('Preview container not found');

      // Temporarily reset scale for clean capture
      const prev = el.style.transform;
      el.style.transform = 'none';

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });

      // Restore
      el.style.transform = prev;

      const imgData = canvas.toDataURL('image/png');
      const imgW = canvas.width;
      const imgH = canvas.height;

      // Fit to A4 landscape or portrait based on aspect ratio
      const isLandscape = imgW > imgH;
      const pdf = new jsPDF({
        orientation: isLandscape ? 'landscape' : 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availW = pageW - margin * 2;
      const availH = pageH - margin * 2;

      const ratio = Math.min(availW / imgW, availH / imgH);
      const w = imgW * ratio;
      const h = imgH * ratio;
      const x = margin + (availW - w) / 2;
      const y = margin + (availH - h) / 2;

      pdf.addImage(imgData, 'PNG', x, y, w, h);
      pdf.save(filename);
    } catch (err) {
      console.error('[PDF export]', err);
      alert('PDF export failed: ' + err.message);
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportPdf, exporting };
}
