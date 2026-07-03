// Test: Tesseract.js OCR → column clustering on menu photos
import Tesseract from "tesseract.js";
import { readFile } from "fs/promises";
import path from "path";

const PHOTO_DIR = "C:\\Users\\migue\\OneDrive\\Documents\\FOODBASE\\WILLY_TIALGO\\WILLY\\MENU_PHOTOS";

async function ocrAndCluster(filePath) {
  const fileName = path.basename(filePath);
  console.log(`\n${"═".repeat(70)}`);
  console.log(`Processing: ${fileName}`);
  console.log("═".repeat(70));

  // Run OCR
  const { data } = await Tesseract.recognize(filePath, "nld+eng", {
    logger: () => {}, // silence progress logs
  });

  const words = data.words || [];
  if (words.length === 0) {
    console.log("  No words detected");
    return;
  }

  const pageWidth = data.width || Math.max(...words.map(w => w.bbox.x1));
  const pageHeight = data.height || Math.max(...words.map(w => w.bbox.y1));
  console.log(`  Page: ${pageWidth}x${pageHeight}, Words detected: ${words.length}`);

  // Compute x-center for each word
  const wordData = words
    .filter(w => w.text.trim().length > 0 && w.confidence > 30)
    .map(w => ({
      text: w.text.trim(),
      xCenter: (w.bbox.x0 + w.bbox.x1) / 2,
      yCenter: (w.bbox.y0 + w.bbox.y1) / 2,
      x0: w.bbox.x0,
      x1: w.bbox.x1,
      y0: w.bbox.y0,
      y1: w.bbox.y1,
      confidence: w.confidence,
    }));

  // Cluster into columns by finding large x-gaps
  const sortedByX = [...wordData].sort((a, b) => a.xCenter - b.xCenter);
  const xCenters = sortedByX.map(w => w.xCenter);

  // Find gaps
  const gaps = [];
  for (let i = 1; i < xCenters.length; i++) {
    gaps.push({ index: i, gap: xCenters[i] - xCenters[i - 1] });
  }
  gaps.sort((a, b) => b.gap - a.gap);

  // Use gap threshold: > 10% of page width
  const threshold = pageWidth * 0.10;
  const significantGaps = gaps.filter(g => g.gap > threshold);

  // Determine column boundaries
  const splitXValues = significantGaps
    .slice(0, 5) // max 5 columns
    .map(g => (xCenters[g.index - 1] + xCenters[g.index]) / 2)
    .sort((a, b) => a - b);

  const boundaries = [0, ...splitXValues, pageWidth];
  const columnCount = boundaries.length - 1;

  console.log(`  Columns detected: ${columnCount}`);
  console.log(`  Split positions: ${splitXValues.map(x => `${((x / pageWidth) * 100).toFixed(1)}%`).join(", ") || "(none)"}`);

  // Assign words to columns
  const columns = Array.from({ length: columnCount }, () => []);
  for (const w of wordData) {
    for (let c = 0; c < columnCount; c++) {
      if (w.xCenter >= boundaries[c] && w.xCenter < boundaries[c + 1]) {
        columns[c].push(w);
        break;
      }
    }
  }

  // Group words into lines within each column
  for (let c = 0; c < columnCount; c++) {
    const colWords = columns[c].sort((a, b) => a.yCenter - b.yCenter);
    if (colWords.length === 0) continue;

    // Group by y-proximity
    const lineHeight = Math.median ? 20 : 20; // fallback
    const lines = [];
    let currentLine = [colWords[0]];

    for (let i = 1; i < colWords.length; i++) {
      if (colWords[i].yCenter - currentLine[0].yCenter < 15) {
        currentLine.push(colWords[i]);
      } else {
        lines.push(currentLine);
        currentLine = [colWords[i]];
      }
    }
    lines.push(currentLine);

    console.log(`\n  Column ${c + 1} (${boundaries[c].toFixed(0)}-${boundaries[c + 1].toFixed(0)}px, ${colWords.length} words, ${lines.length} lines):`);

    // Show first 10 lines
    for (let l = 0; l < Math.min(lines.length, 10); l++) {
      const lineText = lines[l]
        .sort((a, b) => a.x0 - b.x0)
        .map(w => w.text)
        .join(" ");
      console.log(`    ${lineText}`);
    }
    if (lines.length > 10) {
      console.log(`    ... (${lines.length - 10} more lines)`);
    }
  }
}

async function main() {
  // Test on a few representative photos
  const testFiles = ["WEERELT_1.jpeg", "LOVANIUM_X.jpeg", "SCHUUR_X.jpeg"];

  for (const file of testFiles) {
    await ocrAndCluster(path.join(PHOTO_DIR, file));
  }

  console.log("\n" + "═".repeat(70));
  console.log("Done");
}

main().catch(console.error);
