// Test Tesseract word-level bounding boxes with hOCR output
import { createWorker, OEM, PSM } from "tesseract.js";

const file = "C:\\Users\\migue\\OneDrive\\Documents\\FOODBASE\\WILLY_TIALGO\\WILLY\\MENU_PHOTOS\\WEERELT_1.jpeg";

console.log("Starting OCR...");
const worker = await createWorker("eng", OEM.DEFAULT, {
  logger: () => {},
});

// Set page segmentation mode to auto
await worker.setParameters({ tessedit_pageseg_mode: PSM.AUTO });

const result = await worker.recognize(file, {}, { text: true, blocks: true, hocr: false, tsv: false });

console.log("Keys in data:", Object.keys(result.data));
console.log("Text length:", result.data.text?.length);

if (result.data.blocks) {
  console.log("Blocks:", result.data.blocks.length);
  let wordCount = 0;
  for (const block of result.data.blocks) {
    for (const para of (block.paragraphs || [])) {
      for (const line of (para.lines || [])) {
        for (const word of (line.words || [])) {
          wordCount++;
        }
        if (wordCount <= 10 && line.words) {
          const lineText = line.words.map(w => w.text).join(" ");
          const firstWord = line.words[0];
          console.log(`  "${lineText}" | bbox: x0=${firstWord.bbox.x0} y0=${firstWord.bbox.y0}`);
        }
      }
    }
  }
  console.log("Total words:", wordCount);
}

await worker.terminate();
