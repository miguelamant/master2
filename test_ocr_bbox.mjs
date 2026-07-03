// Test Tesseract word-level bounding boxes
import { createWorker } from "tesseract.js";

const file = "C:\\Users\\migue\\OneDrive\\Documents\\FOODBASE\\WILLY_TIALGO\\WILLY\\MENU_PHOTOS\\WEERELT_1.jpeg";

console.log("Starting OCR with word-level output...");
const worker = await createWorker("eng");
const { data } = await worker.recognize(file);

console.log("Text length:", data.text.length);
console.log("Words:", data.words?.length);
console.log("Lines:", data.lines?.length);

// Check lines — they have words inside them
if (data.lines && data.lines.length > 0) {
  console.log("\nFirst 5 lines with bounding boxes:");
  for (let i = 0; i < Math.min(5, data.lines.length); i++) {
    const line = data.lines[i];
    console.log(`  Line ${i}: "${line.text.trim()}" bbox: ${JSON.stringify(line.bbox)} conf: ${line.confidence.toFixed(0)}`);
    if (line.words) {
      for (const w of line.words.slice(0, 5)) {
        console.log(`    Word: "${w.text}" bbox: ${JSON.stringify(w.bbox)} conf: ${w.confidence.toFixed(0)}`);
      }
    }
  }
}

await worker.terminate();
