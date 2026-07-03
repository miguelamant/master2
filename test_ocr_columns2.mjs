// Test: Tesseract.js OCR → column clustering on menu photos
import { createWorker, OEM, PSM } from "tesseract.js";
import path from "path";

const PHOTO_DIR = "C:\\Users\\migue\\OneDrive\\Documents\\FOODBASE\\WILLY_TIALGO\\WILLY\\MENU_PHOTOS";

async function ocrAndCluster(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n${"═".repeat(70)}`);
  console.log(`Processing: ${fileName}`);
  console.log("═".repeat(70));

  const worker = await createWorker("eng+nld", OEM.DEFAULT, { logger: () => {} });
  await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });
  const result = await worker.recognize(filePath, {}, { blocks: true });
  await worker.terminate();

  // Collect all words with bounding boxes
  const allWords = [];
  for (const block of (result.data.blocks || [])) {
    for (const para of (block.paragraphs || [])) {
      for (const line of (para.lines || [])) {
        for (const word of (line.words || [])) {
          if (word.text.trim().length > 0 && word.confidence > 30) {
            allWords.push({
              text: word.text.trim(),
              xCenter: (word.bbox.x0 + word.bbox.x1) / 2,
              yCenter: (word.bbox.y0 + word.bbox.y1) / 2,
              x0: word.bbox.x0,
              x1: word.bbox.x1,
              y0: word.bbox.y0,
              y1: word.bbox.y1,
              confidence: word.confidence,
            });
          }
        }
      }
    }
  }

  if (allWords.length === 0) {
    console.log("  No words detected");
    return;
  }

  const pageWidth = Math.max(...allWords.map(w => w.x1)) + 10;
  console.log(`  Page width: ~${pageWidth}px, Words: ${allWords.length}`);

  // Sort by x-center and find large gaps
  const sortedByX = [...allWords].sort((a, b) => a.xCenter - b.xCenter);
  const xCenters = sortedByX.map(w => w.xCenter);

  const gaps = [];
  for (let i = 1; i < xCenters.length; i++) {
    gaps.push({ index: i, gap: xCenters[i] - xCenters[i - 1], xPos: (xCenters[i] + xCenters[i - 1]) / 2 });
  }
  gaps.sort((a, b) => b.gap - a.gap);

  // Show top gaps
  console.log("  Top 5 x-gaps:");
  for (let i = 0; i < Math.min(5, gaps.length); i++) {
    const g = gaps[i];
    const pct = ((g.xPos / pageWidth) * 100).toFixed(1);
    console.log(`    ${pct}% — gap: ${g.gap.toFixed(0)}px`);
  }

  // Use threshold: > 8% of page width
  const threshold = pageWidth * 0.08;
  const significantGaps = gaps
    .filter(g => g.gap > threshold)
    .sort((a, b) => a.xPos - b.xPos);

  const splitPoints = significantGaps.map(g => g.xPos);
  const boundaries = [0, ...splitPoints, pageWidth];
  const columnCount = boundaries.length - 1;

  console.log(`\n  Columns detected: ${columnCount}`);
  console.log(`  Split at: ${splitPoints.map(x => `${((x / pageWidth) * 100).toFixed(1)}%`).join(", ") || "(none)"}`);

  // Assign words to columns and show per-column content
  for (let c = 0; c < columnCount; c++) {
    const colWords = allWords
      .filter(w => w.xCenter >= boundaries[c] && w.xCenter < boundaries[c + 1])
      .sort((a, b) => a.yCenter - b.yCenter);

    if (colWords.length === 0) continue;

    // Group into lines
    const lines = [];
    let currentLine = [colWords[0]];
    for (let i = 1; i < colWords.length; i++) {
      const lastY = currentLine[currentLine.length - 1].yCenter;
      if (Math.abs(colWords[i].yCenter - lastY) < 18) {
        currentLine.push(colWords[i]);
      } else {
        lines.push(currentLine);
        currentLine = [colWords[i]];
      }
    }
    lines.push(currentLine);

    console.log(`\n  ── Column ${c + 1} (${((boundaries[c] / pageWidth) * 100).toFixed(0)}-${((boundaries[c + 1] / pageWidth) * 100).toFixed(0)}%, ${colWords.length} words, ${lines.length} lines) ──`);
    for (let l = 0; l < Math.min(lines.length, 12); l++) {
      const lineText = lines[l]
        .sort((a, b) => a.x0 - b.x0)
        .map(w => w.text)
        .join(" ");
      console.log(`    ${lineText}`);
    }
    if (lines.length > 12) console.log(`    ... (${lines.length - 12} more lines)`);
  }
}

async function main() {
  const testFiles = ["WEERELT_1.jpeg", "LOVANIUM_X.jpeg", "SCHUUR_X.jpeg"];
  for (const file of testFiles) {
    await ocrAndCluster(path.join(PHOTO_DIR, file));
  }
  console.log("\n" + "═".repeat(70) + "\nDone");
}

main().catch(console.error);
