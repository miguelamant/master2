// Simple Tesseract test
import Tesseract from "tesseract.js";

const file = "C:\\Users\\migue\\OneDrive\\Documents\\FOODBASE\\WILLY_TIALGO\\WILLY\\MENU_PHOTOS\\WEERELT_1.jpeg";

console.log("Starting OCR...");
const result = await Tesseract.recognize(file, "eng", {
  logger: m => { if (m.status === "recognizing text") process.stdout.write("."); },
});

console.log("\n\nFull text length:", result.data.text.length);
console.log("Words count:", result.data.words?.length || 0);
console.log("Confidence:", result.data.confidence);
console.log("\nFirst 500 chars of text:");
console.log(result.data.text.slice(0, 500));
