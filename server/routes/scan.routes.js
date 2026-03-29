// server/routes/scan.routes.js
// Menu card scanning: upload photos, AI extraction (GPT-4o vision), Excel export, pipeline push
import { Router } from "express";
import multer from "multer";
import { randomUUID } from "crypto";
import { execFile } from "child_process";
import { mkdtemp, rm, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import ExcelJS from "exceljs";
import { supabase } from "../integrations/supabase.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PIPELINE_DIR = path.resolve(__dirname, "..", "pipeline");
const DATA_DIR = path.resolve(PIPELINE_DIR, "data");

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── POST /api/scan/upload ─────────────────────────────────────────────────
// Upload a menu card image to Supabase Storage
router.post("/scan/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });

    const ext = req.file.originalname.split(".").pop() || "jpg";
    const imageId = randomUUID();
    const path = `uploads/${imageId}.${ext}`;

    const { error } = await supabase.storage
      .from("scan-images")
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) return res.status(500).json({ error: "Upload failed", detail: error.message });

    const { data: urlData } = supabase.storage.from("scan-images").getPublicUrl(path);

    res.json({ imageId, imageUrl: urlData.publicUrl, path });
  } catch (e) {
    console.error("[scan/upload]", e);
    res.status(500).json({ error: "Upload failed", detail: e.message });
  }
});

// ── POST /api/scan/extract ────────────────────────────────────────────────
// Send image to GPT-4o vision to extract menu items
router.post("/scan/extract", async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    const prompt = `You are an expert at reading menu cards from bars, restaurants, and cafés.

Analyze this menu card photo carefully. Extract EVERY menu item visible.

IMPORTANT — Column detection:
Menu cards often have multiple VISUAL COLUMNS of items side by side. Each category/section header with its items underneath counts as ONE column. Number columns sequentially left-to-right, top-to-bottom: if the left side has 4 sections stacked vertically, those are columns 1, 2, 3, 4. If the right side then has 4 more sections, those are columns 5, 6, 7, 8. The total column_count is the number of the LAST column.

IMPORTANT — Position within column:
For each item, track its position WITHIN its own column, starting from 1 for each new column.

For each item, return a JSON object with these fields:
- "category_name": the section/heading on the menu (e.g. "Regionale Bieren", "Frisdranken", "Warme Dranken"). Use the exact text from the menu.
- "product_name": the item name exactly as written on the menu. If an ABV/alcohol percentage is shown next to the item (e.g. 7.5%, 9,0%), APPEND it to the product name like "Chimay Blauw 9,0%" or "Wolf 7 7,5%".
- "product_description": any extra description, size info, or notes EXCLUDING the ABV (empty string if none)
- "product_price": the price as an integer in CENTS (e.g. 520 for €5,20 or €5.20). null if not visible.
- "column_number": which column this item belongs to (1, 2, 3, ... cumulative across the entire card)
- "position_in_column": the item's position within its column (resets to 1 for each new column)

Also return:
- "categories": object mapping each category_name to its item count
- "column_count": the total number of columns (= the highest column_number)

Return ONLY valid JSON in this exact format (no markdown, no backticks):
{"items": [...], "categories": {"Cat1": 4, "Cat2": 9}, "column_count": 6}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });

    const raw = completion.choices[0].message.content.trim();
    // Strip markdown fences if present
    const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonStr);

    res.json(parsed);
  } catch (e) {
    console.error("[scan/extract]", e);
    res.status(500).json({ error: "Extraction failed", detail: e.message });
  }
});

// ── POST /api/scan/export ─────────────────────────────────────────────────
// Generate Excel in scan_images format and upload to Supabase Storage
router.post("/scan/export", async (req, res) => {
  try {
    const { location = {}, images = [], items = [] } = req.body;

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");

    // Column headers matching scan_images_small_2.xlsx
    const headers = [
      "supplier.id", "supplier.name", "representative.id", "scan_session.id",
      "scan_session.created_at",
      "location.id", "location.name",
      "location.address.place_id", "location.address.route",
      "location.address.street_number", "location.address.street_box",
      "location.address.postal_code", "location.address.locality",
      "location.address.latitude", "location.address.longitude",
      "location.address.country", "location.address.country_iso",
      "location.address.formatted_address",
      "scan_image.id", "scan_image.image_url",
      "category.name", "product.name", "product.description",
      "product.price", "product.heroproducts",
    ];
    ws.addRow(headers);

    const now = new Date().toISOString();
    const locationId = randomUUID();
    const imageId = images[0]?.imageId || randomUUID();
    const imageUrl = images[0]?.imageUrl || "";

    for (const item of items) {
      ws.addRow([
        "", "", "", "",                      // supplier.id, supplier.name, representative.id, scan_session.id
        now,                                  // scan_session.created_at
        locationId,                           // location.id
        location.name || "",                  // location.name
        location.place_id || "",              // location.address.place_id
        location.route || "",                 // location.address.route
        location.street_number || "",         // location.address.street_number
        "",                                   // location.address.street_box
        location.postal_code || "",           // location.address.postal_code
        location.locality || "",              // location.address.locality
        location.latitude || "",              // location.address.latitude
        location.longitude || "",             // location.address.longitude
        location.country || "",               // location.address.country
        location.country_iso || "",           // location.address.country_iso
        location.formatted_address || "",     // location.address.formatted_address
        item.scan_image_id || imageId,        // scan_image.id
        item.scan_image_url || imageUrl,      // scan_image.image_url
        item.category_name || "",             // category.name
        item.product_name || "",              // product.name
        item.product_description || "",       // product.description
        item.product_price ?? "",             // product.price
        "[]",                                 // product.heroproducts
      ]);
    }

    // Write to buffer
    const buffer = await wb.xlsx.writeBuffer();

    // Upload to Supabase Storage
    const exportId = randomUUID();
    const exportPath = `exports/${exportId}.xlsx`;
    const { error: uploadErr } = await supabase.storage
      .from("scan-exports")
      .upload(exportPath, buffer, {
        contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

    let storageUrl = null;
    if (!uploadErr) {
      const { data: signed } = await supabase.storage
        .from("scan-exports")
        .createSignedUrl(exportPath, 3600); // 1hr link
      storageUrl = signed?.signedUrl || null;
    }

    // Also send buffer as download
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="scan_${exportId}.xlsx"`);
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error("[scan/export]", e);
    res.status(500).json({ error: "Export failed", detail: e.message });
  }
});

// ── POST /api/scan/push-menu ──────────────────────────────────────────────
// Run the Python pipeline to match, validate, and import menu items into Supabase
router.post("/scan/push-menu", async (req, res) => {
  let workdir = null;
  try {
    const { location = {}, images = [], items = [] } = req.body;
    if (!items.length) return res.status(400).json({ error: "No items to process" });

    // 1. Create temp workdir
    workdir = await mkdtemp(path.join(tmpdir(), "pipeline_run_"));

    // 2. Build the input Excel in the format ACTIVE_MATCHED_2_1.PY expects
    //    Columns: scan_session_id, location_id, category_name, product_name,
    //             product_description, product_price, key
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");

    const headers = [
      "scan_session_id", "location_id", "category_name",
      "product_name", "product_description", "product_price", "key",
    ];
    ws.addRow(headers);

    const sessionId = randomUUID();
    const locationId = location.place_id || randomUUID();

    for (const [idx, item] of items.entries()) {
      // Convert price from cents to euros (pipeline expects euro value)
      const priceEur = item.product_price != null ? (item.product_price / 100).toFixed(2) : "";
      ws.addRow([
        sessionId,
        locationId,
        item.category_name || "",
        item.product_name || "",
        item.product_description || "",
        priceEur,
        `${sessionId} - ${item.category_name || ""} - ${item.product_name || ""}`,
      ]);
    }

    const inputFile = "scan_input.xlsx";
    const inputPath = path.join(workdir, inputFile);
    await writeFile(inputPath, Buffer.from(await wb.xlsx.writeBuffer()));

    // 3. Spawn the pipeline
    const pythonCmd = process.platform === "win32" ? "python" : "python3";
    const mainPy = path.join(PIPELINE_DIR, "main.py");

    const result = await new Promise((resolve, reject) => {
      const child = execFile(
        pythonCmd,
        [mainPy, "--workdir", workdir, "--datadir", DATA_DIR, "--input", inputFile],
        {
          cwd: workdir,
          timeout: 5 * 60 * 1000, // 5 minutes
          maxBuffer: 10 * 1024 * 1024, // 10MB stdout
          env: { ...process.env },
        },
        (error, stdout, stderr) => {
          if (error) {
            console.error("[push-menu] Pipeline error:", error.message);
            console.error("[push-menu] stderr:", stderr);
            console.error("[push-menu] stdout:", stdout);
            return reject(new Error(stderr || error.message));
          }

          // Parse PIPELINE_RESULT from stdout
          const lines = stdout.split("\n");
          const resultLine = lines.find(l => l.startsWith("PIPELINE_RESULT:"));
          if (resultLine) {
            try {
              const json = JSON.parse(resultLine.replace("PIPELINE_RESULT:", ""));
              resolve(json);
            } catch {
              resolve({ inserted: -1, skipped_fk: 0, skipped_dup: 0, stdout });
            }
          } else {
            resolve({ inserted: -1, skipped_fk: 0, skipped_dup: 0, stdout });
          }
        }
      );
    });

    res.json({ ok: true, ...result });
  } catch (e) {
    console.error("[scan/push-menu]", e);
    res.status(500).json({ error: "Pipeline failed", detail: e.message });
  } finally {
    // Clean up temp dir
    if (workdir) {
      rm(workdir, { recursive: true, force: true }).catch(() => {});
    }
  }
});

export default router;
