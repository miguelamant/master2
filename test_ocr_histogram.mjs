// Test: histogram of word x0 positions to find column starts
import { createWorker, OEM, PSM } from "tesseract.js";
import path from "path";

const PHOTO_DIR = "C:\\Users\\migue\\OneDrive\\Documents\\FOODBASE\\WILLY_TIALGO\\WILLY\\MENU_PHOTOS";

async function analyzeColumns(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n${"═".repeat(70)}`);
  console.log(`Processing: ${fileName}`);
  console.log("═".repeat(70));

  const worker = await createWorker("eng+nld", OEM.DEFAULT, { logger: () => {} });
  await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
  const result = await worker.recognize(filePath, {}, { blocks: true });
  await worker.terminate();

  const allWords = [];
  for (const block of (result.data.blocks || [])) {
    for (const para of (block.paragraphs || [])) {
      for (const line of (para.lines || [])) {
        for (const word of (line.words || [])) {
          if (word.text.trim().length > 0 && word.confidence > 30) {
            allWords.push({
              text: word.text.trim(),
              x0: word.bbox.x0,
              x1: word.bbox.x1,
              y0: word.bbox.y0,
              y1: word.bbox.y1,
            });
          }
        }
      }
    }
  }

  if (allWords.length === 0) { console.log("  No words"); return; }

  const pageWidth = Math.max(...allWords.map(w => w.x1)) + 10;
  console.log(`  Words: ${allWords.length}, Page width: ~${pageWidth}px`);

  // Build histogram of x0 positions (where words START)
  // Use bins of 2% page width
  const binSize = Math.round(pageWidth * 0.02);
  const bins = {};
  for (const w of allWords) {
    const bin = Math.floor(w.x0 / binSize) * binSize;
    bins[bin] = (bins[bin] || 0) + 1;
  }

  // Find peaks in histogram — these are column start positions
  const sortedBins = Object.entries(bins)
    .map(([x, count]) => ({ x: parseInt(x), count, pct: ((parseInt(x) / pageWidth) * 100).toFixed(1) }))
    .sort((a, b) => b.count - a.count);

  console.log("\n  Top 10 word-start positions (x0 histogram, 2% bins):");
  for (let i = 0; i < Math.min(10, sortedBins.length); i++) {
    const b = sortedBins[i];
    const bar = "█".repeat(Math.min(40, b.count));
    console.log(`    ${b.pct.padStart(5)}%  (${b.count.toString().padStart(3)} words)  ${bar}`);
  }

  // Find column starts: peaks that are far apart and have high counts
  // A "column start" is a bin with significantly more words than its neighbors
  const peakThreshold = allWords.length * 0.05; // at least 5% of words start here
  const peaks = sortedBins
    .filter(b => b.count >= peakThreshold)
    .sort((a, b) => a.x - b.x);

  // Merge nearby peaks (within 5% of page width)
  const mergeThreshold = pageWidth * 0.05;
  const mergedPeaks = [];
  for (const peak of peaks) {
    const existing = mergedPeaks.find(p => Math.abs(p.x - peak.x) < mergeThreshold);
    if (existing) {
      if (peak.count > existing.count) {
        existing.x = peak.x;
        existing.count = peak.count;
        existing.pct = peak.pct;
      }
    } else {
      mergedPeaks.push({ ...peak });
    }
  }

  console.log(`\n  Column start candidates (>${peakThreshold.toFixed(0)} words):`);
  for (const p of mergedPeaks) {
    console.log(`    ${p.pct}% — ${p.count} words start here`);
  }
  console.log(`  → ${mergedPeaks.length} columns detected`);
}

async function main() {
  const testFiles = ["WEERELT_1.jpeg", "LOVANIUM_X.jpeg", "SCHUUR_X.jpeg"];
  for (const file of testFiles) {
    await analyzeColumns(path.join(PHOTO_DIR, file));
  }
  console.log("\nDone");
}

main().catch(console.error);
