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
import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import ExcelJS from "exceljs";
import { supabase } from "../integrations/supabase.js";
import { isAuthenticated } from "../middleware/auth.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PIPELINE_DIR = path.resolve(__dirname, "..", "pipeline");
const DATA_DIR = path.resolve(PIPELINE_DIR, "data");

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// ── POST /api/scan/upload ─────────────────────────────────────────────────
// Upload a menu card image to Supabase Storage
router.post("/scan/upload", isAuthenticated, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });

    // Normalize EXIF orientation into actual pixels (so coordinates match display)
    // No AI rotation — just bake the EXIF tag into the pixel data
    const buffer = await sharp(req.file.buffer).rotate().toBuffer();

    const imageId = randomUUID();
    const storagePath = `uploads/${imageId}.jpg`;

    const { error } = await supabase.storage
      .from("scan-images")
      .upload(storagePath, buffer, {
        contentType: "image/jpeg",
        upsert: false,
      });

    if (error) return res.status(500).json({ error: "Upload failed", detail: error.message });

    const { data: urlData } = supabase.storage.from("scan-images").getPublicUrl(storagePath);

    res.json({ imageId, imageUrl: urlData.publicUrl, path: storagePath });
  } catch (e) {
    console.error("[scan/upload]", e);
    res.status(500).json({ error: "Upload failed", detail: e.message });
  }
});

// ── POST /api/scan/rotate ─────────────────────────────────────────────────
// Rotate an uploaded image 90° clockwise, re-upload, return new URL
router.post("/scan/rotate", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());

    const rotated = await sharp(imgBuffer).rotate(90).toBuffer();

    const imageId = randomUUID();
    const storagePath = `uploads/${imageId}_rotated.jpg`;

    const { error } = await supabase.storage
      .from("scan-images")
      .upload(storagePath, rotated, { contentType: "image/jpeg", upsert: false });

    if (error) return res.status(500).json({ error: "Upload failed", detail: error.message });

    const { data: urlData } = supabase.storage.from("scan-images").getPublicUrl(storagePath);
    res.json({ imageUrl: urlData.publicUrl });
  } catch (e) {
    console.error("[scan/rotate]", e);
    res.status(500).json({ error: "Rotate failed", detail: e.message });
  }
});

// ── POST /api/scan/check-quality ──────────────────────────────────────────
// Analyze image quality and return warnings + a preprocessed (grayscale, contrast-boosted) version
router.post("/scan/check-quality", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    // Fetch image
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());

    // Get metadata
    const metadata = await sharp(imgBuffer).metadata();
    const { width, height, format } = metadata;

    const warnings = [];
    let quality = "good"; // good | fair | poor

    // Resolution check
    const longSide = Math.max(width, height);
    if (longSide < 1200) {
      warnings.push("Very low resolution — text may be unreadable");
      quality = "poor";
    } else if (longSide < 2000) {
      warnings.push("Low resolution — small text may be hard to read");
      if (quality === "good") quality = "fair";
    }

    // Check for dominant color (colored background detection)
    const stats = await sharp(imgBuffer).stats();
    const channels = stats.channels; // [R, G, B]
    if (channels.length >= 3) {
      const rMean = channels[0].mean;
      const gMean = channels[1].mean;
      const bMean = channels[2].mean;
      // Check if image has a strong color cast (not grayscale-ish)
      const maxDiff = Math.max(
        Math.abs(rMean - gMean),
        Math.abs(rMean - bMean),
        Math.abs(gMean - bMean)
      );
      if (maxDiff > 30) {
        warnings.push("Colored background detected — extraction may improve with preprocessing");
        if (quality === "good") quality = "fair";
      }
      // Check for low contrast (all channels high = washed out, or all low = dark)
      const avgBrightness = (rMean + gMean + bMean) / 3;
      const avgStdDev = (channels[0].stdev + channels[1].stdev + channels[2].stdev) / 3;
      if (avgStdDev < 35) {
        warnings.push("Low contrast — text may blend with background");
        quality = "poor";
      }
      if (avgBrightness < 60) {
        warnings.push("Image is very dark");
        if (quality === "good") quality = "fair";
      }
    }

    // Aspect ratio check (might indicate rotated/sideways photo)
    const ratio = width / height;
    if (ratio > 2.5 || ratio < 0.4) {
      warnings.push("Unusual aspect ratio — image may be rotated or cropped incorrectly");
      if (quality === "good") quality = "fair";
    }

    // Generate preprocessed version: remove color, boost text contrast
    // grayscale removes color cast, normalize stretches contrast,
    // linear boosts contrast (multiplier > 1 widens gap between dark text and light bg),
    // sharpen recovers text edges
    const processed = await sharp(imgBuffer)
      .grayscale()
      .normalize()
      .linear(1.8, -100)                   // contrast boost: darken darks, lighten lights
      .sharpen({ sigma: 1.5 })
      .toBuffer();

    // Upload preprocessed version to Supabase
    const processedId = randomUUID();
    const processedPath = `uploads/${processedId}_processed.jpg`;
    const { error: upError } = await supabase.storage
      .from("scan-images")
      .upload(processedPath, processed, {
        contentType: "image/jpeg",
        upsert: false,
      });

    let processedUrl = null;
    if (!upError) {
      const { data: urlData } = supabase.storage.from("scan-images").getPublicUrl(processedPath);
      processedUrl = urlData.publicUrl;
    }

    res.json({
      quality,
      warnings,
      resolution: { width, height },
      format,
      processedUrl,
    });
  } catch (e) {
    console.error("[scan/check-quality]", e);
    res.status(500).json({ error: "Quality check failed", detail: e.message });
  }
});

// ── POST /api/scan/straighten ─────────────────────────────────────────────
// Rotate image so the menu card is perfectly vertical. Uses GPT-4o to judge skew.
router.post("/scan/straighten", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl, currentRotation } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });
    const totalRotation = currentRotation || 0;

    // Fetch image and normalize EXIF
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const rawBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const imgBuffer = await sharp(rawBuffer).rotate().toBuffer();

    // Apply any accumulated rotation
    const rotatedBuffer = totalRotation !== 0
      ? await sharp(imgBuffer).rotate(totalRotation, { background: "#ffffff" }).toBuffer()
      : imgBuffer;

    const rotatedB64 = rotatedBuffer.toString("base64");

    // Ask GPT-4o if the menu is straight
    const prompt = `Look at this photo of a menu card. Is the menu card perfectly straight/vertical? Look at the text lines and edges of the menu.

If it's already straight, respond: {"straight": true, "adjustment": 0}

If it's slightly skewed/tilted, tell me which direction to rotate and by how much. Use SMALL increments: 0.5 degrees at a time.

- If the top of the menu leans RIGHT, I need to rotate CLOCKWISE (positive degrees)
- If the top of the menu leans LEFT, I need to rotate COUNTER-CLOCKWISE (negative degrees)

Respond with ONLY valid JSON:
{"straight": false, "adjustment": -0.5, "reason": "Top of menu leans slightly left"}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${rotatedB64}`, detail: "high" } },
        ],
      }],
      max_tokens: 150,
      temperature: 0,
    });

    const raw = completion.choices[0].message.content.trim();
    console.log("[scan/straighten] raw:", raw);
    const jsonMatch = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);

    if (parsed.straight) {
      // Already straight — upload the current rotated version and return
      const finalId = randomUUID();
      const finalPath = `uploads/${finalId}_straight.jpg`;
      await supabase.storage.from("scan-images").upload(finalPath, rotatedBuffer, { contentType: "image/jpeg", upsert: false });
      const { data: urlData } = supabase.storage.from("scan-images").getPublicUrl(finalPath);

      res.json({
        straight: true,
        rotation: totalRotation,
        straightened_url: urlData.publicUrl,
        reason: parsed.reason || "Menu is straight",
      });
    } else {
      // Apply the suggested adjustment
      const newRotation = totalRotation + (parsed.adjustment || 0);
      const adjustedBuffer = await sharp(imgBuffer)
        .rotate(newRotation, { background: "#ffffff" })
        .toBuffer();

      // Upload adjusted version
      const adjId = randomUUID();
      const adjPath = `uploads/${adjId}_rotated.jpg`;
      await supabase.storage.from("scan-images").upload(adjPath, adjustedBuffer, { contentType: "image/jpeg", upsert: false });
      const { data: urlData } = supabase.storage.from("scan-images").getPublicUrl(adjPath);

      res.json({
        straight: false,
        rotation: newRotation,
        adjustment: parsed.adjustment,
        straightened_url: urlData.publicUrl,
        reason: parsed.reason || "",
      });
    }
  } catch (e) {
    console.error("[scan/straighten]", e);
    res.status(500).json({ error: "Straighten failed", detail: e.message });
  }
});

// ── POST /api/scan/predict-columns ────────────────────────────────────────
// Lightweight: just ask AI how many columns a menu photo has. No cropping, no gutter detection.
router.post("/scan/predict-columns", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    // Fetch image and convert to base64 for Claude
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const imgB64 = imgBuffer.toString("base64");
    const contentType = imgResponse.headers.get("content-type") || "image/jpeg";

    const prompt = `This is a photo of a menu card from a bar, restaurant, or café.

How many distinct vertical strips do you see? Just look at it the way a human would — how many side-by-side vertical sections are there? If two item boxes are stacked on top of each other in the same vertical space, that's 1 strip. A cover/logo section also counts as its own strip. The photo may be rotated — look at text orientation.

Look for fold creases — if the paper has visible fold lines, each section between folds is a separate strip.

For each strip (left to right as the text reads), list the headings visible in it.

You MUST respond with ONLY a JSON object, no other text before or after:
{"column_count": 3, "columns": [{"column": 1, "categories": ["BIEREN", "KOFFIE"]}, {"column": 2, "categories": ["Cover/logo"]}, {"column": 3, "categories": ["FRISDRANKEN"]}]}`;

    const completion = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: contentType, data: imgB64 } },
            { type: "text", text: prompt },
          ],
        },
        {
          role: "assistant",
          content: "{",
        },
      ],
    });

    const raw = "{" + completion.content[0].text.trim();
    console.log("[scan/predict-columns] raw:", raw);
    // Extract JSON from response in case there's trailing text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);

    res.json(parsed);
  } catch (e) {
    console.error("[scan/predict-columns]", e);
    res.status(500).json({ error: "Column prediction failed", detail: e.message });
  }
});

// ── POST /api/scan/validate-splits ───────────────────────────────────────
// Draw even split lines on the image and ask AI if each line is correctly placed.
router.post("/scan/validate-splits", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl, columnCount, linePositions, rotation } = req.body;
    if (!imageUrl || !columnCount || columnCount < 2) {
      return res.status(400).json({ error: "imageUrl and columnCount (>= 2) required" });
    }

    // Fetch image — normalize EXIF, then apply any accumulated rotation
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const rawBuffer = Buffer.from(await imgResponse.arrayBuffer());
    let imgBuffer = await sharp(rawBuffer).rotate().toBuffer();
    if (rotation) {
      imgBuffer = await sharp(imgBuffer).rotate(rotation, { background: "#ffffff" }).toBuffer();
    }
    const meta = await sharp(imgBuffer).metadata();
    const w = meta.width;
    const h = meta.height;

    // Use custom positions if provided, otherwise even split
    const lines = [];
    if (linePositions && linePositions.length === columnCount - 1) {
      lines.push(...linePositions);
    } else {
      for (let i = 1; i < columnCount; i++) {
        lines.push(Math.round((i / columnCount) * 100));
      }
    }

    // Draw red lines on the image using sharp composite
    const lineOverlays = lines.map(pct => {
      const x = Math.round((pct / 100) * w);
      return {
        input: {
          create: { width: 3, height: h, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 200 } },
        },
        left: Math.min(x, w - 3),
        top: 0,
      };
    });

    // Also add line labels
    const labelOverlays = lines.map((pct, i) => {
      const x = Math.round((pct / 100) * w);
      const labelSvg = Buffer.from(`<svg width="60" height="24"><rect width="60" height="24" rx="4" fill="red"/><text x="30" y="17" text-anchor="middle" font-size="14" font-weight="bold" fill="white">L${i + 1}</text></svg>`);
      return {
        input: labelSvg,
        left: Math.min(Math.max(0, x - 30), w - 60),
        top: 10,
      };
    });

    const annotatedBuffer = await sharp(imgBuffer)
      .composite([...lineOverlays, ...labelOverlays])
      .jpeg({ quality: 85 })
      .toBuffer();

    const annotatedB64 = annotatedBuffer.toString("base64");

    // Upload annotated image so frontend can show it
    const annId = randomUUID();
    const annPath = `uploads/${annId}_annotated.jpg`;
    await supabase.storage.from("scan-images").upload(annPath, annotatedBuffer, { contentType: "image/jpeg", upsert: false });
    const { data: annUrlData } = supabase.storage.from("scan-images").getPublicUrl(annPath);
    const annotatedUrl = annUrlData.publicUrl;

    // Ask GPT-4o to validate lines AND check if image needs rotation
    const lineDescriptions = lines.map((pct, i) => `L${i + 1} at ${pct}%`).join(", ");

    const prompt = `This is a photo of a menu card with red vertical lines drawn on it. The lines are meant to split the menu into ${columnCount} separate columns.

The lines are: ${lineDescriptions}.

Check TWO things:

1. ROTATION: Are the PRINTED TEXT LINES on the menu perfectly horizontal? Pick a long text line (like a product name with a price) and check if it runs perfectly level from left to right. IGNORE the edges/borders of the photo itself — the photo may have white filled corners from previous rotation, that's normal. Only judge by the printed text.
- If text lines slope DOWN to the right → rotate COUNTER-CLOCKWISE (negative degrees)
- If text lines slope UP to the right → rotate CLOCKWISE (positive degrees)
- Use 0.5° increments. If text already looks horizontal, use 0.

2. LINES: For each line, is it in a good position between columns? Be lenient — only flag a line if it clearly cuts through text. If it needs to move, say LEFT or RIGHT with adjustment: 1 (always 1% at a time). Judge line positions independently from rotation — even if rotation is needed, still tell me if a line should move.

Respond with ONLY valid JSON:
{"rotation": 0, "rotation_reason": "Text lines are horizontal", "lines": [{"line": "L1", "position_pct": 50, "correct": true, "adjustment": 0, "direction": "none", "reason": "Line is in the gap"}]}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${annotatedB64}`, detail: "high" } },
        ],
      }],
      max_tokens: 800,
      temperature: 0,
    });

    const raw = completion.choices[0].message.content.trim();
    console.log("[scan/validate-splits] raw:", raw);
    const jsonMatch = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in response");
    const parsed = JSON.parse(jsonMatch[0]);

    // Calculate adjusted line positions
    const adjustedLines = (parsed.lines || []).map(line => {
      let newPct = line.position_pct;
      if (!line.correct && line.adjustment) {
        newPct = line.direction === "left"
          ? line.position_pct - line.adjustment
          : line.position_pct + line.adjustment;
        newPct = Math.max(5, Math.min(95, newPct));
      }
      return { ...line, adjusted_pct: Math.round(newPct) };
    });

    res.json({
      original_lines: lines,
      validation: adjustedLines,
      annotated_url: annotatedUrl,
      column_count: columnCount,
      rotation: parsed.rotation || 0,
      rotation_reason: parsed.rotation_reason || "",
    });
  } catch (e) {
    console.error("[scan/validate-splits]", e);
    res.status(500).json({ error: "Split validation failed", detail: e.message });
  }
});

// ── POST /api/scan/try-splits ────────────────────────────────────────────
// Generate 4 variants (line left, line right, rotate CW, rotate CCW),
// annotate each, ask AI which is the best improvement.
router.post("/scan/try-splits", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl, columnCount, linePositions, rotation } = req.body;
    if (!imageUrl || !columnCount || columnCount < 2) {
      return res.status(400).json({ error: "imageUrl and columnCount (>= 2) required" });
    }

    // Fetch and normalize image
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const rawBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const normalizedBuffer = await sharp(rawBuffer).rotate().toBuffer();

    // Current lines (even split if not provided)
    const currentLines = [];
    if (linePositions && linePositions.length === columnCount - 1) {
      currentLines.push(...linePositions);
    } else {
      for (let i = 1; i < columnCount; i++) {
        currentLines.push(Math.round((i / columnCount) * 100));
      }
    }
    const currentRotation = rotation || 0;

    // Define 4 variants + current as baseline
    const variants = [
      { id: "A", label: "Lines 1% LEFT", rotation: currentRotation, lines: currentLines.map(l => l - 1) },
      { id: "B", label: "Lines 1% RIGHT", rotation: currentRotation, lines: currentLines.map(l => l + 1) },
      { id: "C", label: "Rotate +0.5° (clockwise)", rotation: currentRotation + 0.5, lines: currentLines },
      { id: "D", label: "Rotate -0.5° (counter-clockwise)", rotation: currentRotation - 0.5, lines: currentLines },
    ];

    // Generate annotated image for each variant
    const annotatedImages = [];

    for (const variant of variants) {
      let imgBuffer = normalizedBuffer;
      if (variant.rotation !== 0) {
        imgBuffer = await sharp(normalizedBuffer).rotate(variant.rotation, { background: "#ffffff" }).toBuffer();
      }
      const meta = await sharp(imgBuffer).metadata();
      const w = meta.width;
      const h = meta.height;

      // Draw lines
      const overlays = [];
      for (let i = 0; i < variant.lines.length; i++) {
        const x = Math.round((variant.lines[i] / 100) * w);
        overlays.push({
          input: { create: { width: 3, height: h, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 200 } } },
          left: Math.max(0, Math.min(x, w - 3)),
          top: 0,
        });
      }

      // Add variant label
      const labelSvg = Buffer.from(`<svg width="120" height="30"><rect width="120" height="30" rx="4" fill="red"/><text x="60" y="21" text-anchor="middle" font-size="16" font-weight="bold" fill="white">${variant.id}</text></svg>`);
      overlays.push({ input: labelSvg, left: 10, top: 10 });

      const annotated = await sharp(imgBuffer).composite(overlays).jpeg({ quality: 80 }).toBuffer();
      annotatedImages.push({ ...variant, b64: annotated.toString("base64") });
    }

    // Also generate current state for reference
    let currentBuffer = normalizedBuffer;
    if (currentRotation !== 0) {
      currentBuffer = await sharp(normalizedBuffer).rotate(currentRotation, { background: "#ffffff" }).toBuffer();
    }
    const currentMeta = await sharp(currentBuffer).metadata();
    const cw = currentMeta.width;
    const ch = currentMeta.height;
    const currentOverlays = currentLines.map(pct => ({
      input: { create: { width: 3, height: ch, channels: 4, background: { r: 255, g: 0, b: 0, alpha: 200 } } },
      left: Math.max(0, Math.min(Math.round((pct / 100) * cw), cw - 3)),
      top: 0,
    }));
    const currentLabelSvg = Buffer.from(`<svg width="180" height="30"><rect width="180" height="30" rx="4" fill="blue"/><text x="90" y="21" text-anchor="middle" font-size="14" font-weight="bold" fill="white">CURRENT</text></svg>`);
    currentOverlays.push({ input: currentLabelSvg, left: 10, top: 10 });
    const currentAnnotated = await sharp(currentBuffer).composite(currentOverlays).jpeg({ quality: 80 }).toBuffer();
    const currentB64 = currentAnnotated.toString("base64");

    // Ask GPT-4o to pick the best
    const prompt = `You see 5 images of the same menu card, each with red vertical split lines drawn on them.

- CURRENT (blue label): the current state
- A: lines moved 1% to the left
- B: lines moved 1% to the right
- C: image rotated 0.5° clockwise
- D: image rotated 0.5° counter-clockwise

The goal is for the red lines to fall in a clean gap between columns of menu items WITHOUT cutting through any text. Look especially at the TOP and BOTTOM of the image — the line might be fine at the top but cut through text at the bottom (which means rotation is needed, not line movement).

Which variant is the BEST improvement? If the current state is already good enough (lines don't cut through text anywhere), pick "CURRENT".

Respond with ONLY valid JSON:
{"best": "A", "reason": "Lines moved left avoids cutting through the wine section at the bottom"}`;

    const content = [
      { type: "image_url", image_url: { url: `data:image/jpeg;base64,${currentB64}`, detail: "high" } },
      { type: "text", text: "CURRENT (baseline)" },
    ];
    for (const v of annotatedImages) {
      content.push({ type: "image_url", image_url: { url: `data:image/jpeg;base64,${v.b64}`, detail: "high" } });
      content.push({ type: "text", text: `Variant ${v.id}: ${v.label}` });
    }
    content.push({ type: "text", text: prompt });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content }],
      max_tokens: 200,
      temperature: 0,
    });

    const raw = completion.choices[0].message.content.trim();
    console.log("[scan/try-splits] raw:", raw);
    const jsonMatch = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "").match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    const parsed = JSON.parse(jsonMatch[0]);

    const best = parsed.best || "CURRENT";
    const chosen = best === "CURRENT" ? null : variants.find(v => v.id === best);

    // Upload the winning annotated image
    const winnerB64 = best === "CURRENT" ? currentB64 : annotatedImages.find(v => v.id === best)?.b64;
    let winnerUrl = null;
    if (winnerB64) {
      const winnerId = randomUUID();
      const winnerPath = `uploads/${winnerId}_variant.jpg`;
      const winnerBuffer = Buffer.from(winnerB64, "base64");
      await supabase.storage.from("scan-images").upload(winnerPath, winnerBuffer, { contentType: "image/jpeg", upsert: false });
      const { data: winnerUrlData } = supabase.storage.from("scan-images").getPublicUrl(winnerPath);
      winnerUrl = winnerUrlData.publicUrl;
    }

    res.json({
      best,
      reason: parsed.reason || "",
      done: best === "CURRENT",
      new_lines: chosen ? chosen.lines : currentLines,
      new_rotation: chosen ? chosen.rotation : currentRotation,
      annotated_url: winnerUrl,
    });
  } catch (e) {
    console.error("[scan/try-splits]", e);
    res.status(500).json({ error: "Try-splits failed", detail: e.message });
  }
});

// ── Gutter detection helper ───────────────────────────────────────────────
// Uses sharp to find vertical whitespace gaps between menu columns.
// Works on both white and colored menu backgrounds by using adaptive thresholds.
// Returns array of gutter midpoints as percentages of image width.
async function detectGutters(imageBuffer, { minGutterPct = 2.5 } = {}) {
  const meta = await sharp(imageBuffer).metadata();
  const w = meta.width;
  const h = meta.height;

  // Step A: Get a 1D vertical-projection profile (average brightness per X column).
  // Greyscale → blur to reduce noise → resize to 1px tall (averages each column).
  const { data: row } = await sharp(imageBuffer)
    .greyscale()
    .blur(2)
    .resize({ width: w, height: 1, kernel: "cubic" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Step B: Adaptive threshold — gutters are columns brighter than surrounding text.
  // Compute overall mean and stddev of the brightness profile.
  let sum = 0, sumSq = 0;
  for (let x = 0; x < w; x++) {
    sum += row[x];
    sumSq += row[x] * row[x];
  }
  const mean = sum / w;
  const stddev = Math.sqrt(sumSq / w - mean * mean);

  // A gutter column is significantly brighter than the mean (text pulls the mean down).
  // Use mean + 0.5*stddev as threshold — works for both white and colored backgrounds.
  const threshold = Math.min(250, mean + stddev * 0.5);

  console.log(`[detectGutters] ${w}x${h}, mean=${mean.toFixed(1)}, std=${stddev.toFixed(1)}, threshold=${threshold.toFixed(1)}`);

  // Step C: Find contiguous bright runs (candidate gutters).
  const minGutterW = Math.max(3, Math.round((minGutterPct / 100) * w));
  const gutters = [];
  let runStart = null;

  for (let x = 0; x < w; x++) {
    const bright = row[x] >= threshold;
    if (bright && runStart === null) {
      runStart = x;
    } else if (!bright && runStart !== null) {
      const runW = x - runStart;
      if (runW >= minGutterW) {
        gutters.push({ start: runStart, end: x, mid: Math.round(runStart + runW / 2), width: runW });
      }
      runStart = null;
    }
  }

  // Step D: Filter — only keep interior gutters to ignore margins.
  // A gutter's entire span (start to end) must fall within 12%-88% of the image.
  const interiorGutters = gutters.filter(g => {
    const startPct = (g.start / w) * 100;
    const endPct = (g.end / w) * 100;
    return startPct > 12 && endPct < 88;
  });

  // Step E: If we found many gutters, keep only the most prominent ones.
  // Real column gutters tend to be the widest gaps. If there are >4, keep top 3 by width.
  interiorGutters.sort((a, b) => b.width - a.width);
  const maxGutters = 3;
  const finalGutters = interiorGutters.slice(0, maxGutters);
  // Re-sort by position (left to right)
  finalGutters.sort((a, b) => a.mid - b.mid);

  console.log(`[detectGutters] ${finalGutters.length} gutters found (minW=${minGutterW}px):`,
    finalGutters.map(g => `${((g.mid / w) * 100).toFixed(1)}% (${g.width}px wide)`));

  return { gutters: finalGutters, imageWidth: w, profile: { mean, stddev, threshold } };
}

// ── POST /api/scan/strip-extract ──────────────────────────────────────────
// Split image into 3 horizontal strips with overlap, extract from each, merge & deduplicate.
router.post("/scan/strip-extract", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    // Fetch and normalize orientation
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const rawBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const imgBuffer = await sharp(rawBuffer).rotate().toBuffer();
    const meta = await sharp(imgBuffer).metadata();
    const w = meta.width;
    const h = meta.height;

    // Define 3 overlapping horizontal strips
    const strips = [
      { label: "top",    yStartPct: 0,  yEndPct: 40 },
      { label: "middle", yStartPct: 30, yEndPct: 70 },
      { label: "bottom", yStartPct: 60, yEndPct: 100 },
    ];

    const extractPrompt = `You are an expert at reading menu cards from bars, restaurants, and cafés.

This is a SECTION of a menu card (not the full menu). Extract EVERY menu item visible in this section.

For each item return:
- "category_name": the heading/subtitle it belongs to (exact text from menu)
- "product_name": item name exactly as written. Append ABV% if shown. Use "unreadable" if you can't read it — never skip a row.
- "product_description": extra description excluding ABV (empty string if none)
- "product_price": price as integer in CENTS (e.g. 520 for €5,20). null if not visible.
- "textbox": category group number, numbered top-to-bottom then left-to-right starting at 1
- "position_in_textbox": position within its category group, starting at 1
- "serve_format": one of "draft", "bottle", "can", "glass", or null
- "confidence": 0-100 how confident you are

Return ONLY valid JSON (no markdown, no backticks):
{
  "items": [...],
  "categories": {"Cat1": 4, "Cat2": 9},
  "textbox_count": 3
}`;

    console.log(`[scan/strip-extract] Processing ${strips.length} strips from ${w}x${h} image`);

    // Extract from all 3 strips in parallel
    const stripResults = await Promise.all(strips.map(async (strip) => {
      const top = Math.round((strip.yStartPct / 100) * h);
      const bottom = Math.round((strip.yEndPct / 100) * h);
      const stripH = bottom - top;

      const stripBuffer = await sharp(imgBuffer)
        .extract({ left: 0, top, width: w, height: stripH })
        .toBuffer();

      const stripB64 = stripBuffer.toString("base64");

      try {
        const completion = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [
            {
              role: "user",
              content: [
                { type: "image", source: { type: "base64", media_type: "image/jpeg", data: stripB64 } },
                { type: "text", text: extractPrompt },
              ],
            },
            {
              role: "assistant",
              content: "{",
            },
          ],
        });

        const raw = "{" + completion.content[0].text.trim();
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) throw new Error("No JSON found");
        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`[scan/strip-extract] ${strip.label}: ${(parsed.items || []).length} items`);
        return { strip: strip.label, items: parsed.items || [], categories: parsed.categories || {} };
      } catch (err) {
        console.error(`[scan/strip-extract] ${strip.label} failed:`, err.message);
        return { strip: strip.label, items: [], categories: {}, error: err.message };
      }
    }));

    // Merge & deduplicate
    // Items from overlapping zones will appear in multiple strips.
    // Deduplicate by matching on normalized product_name + product_price.
    const normalize = (s) => (s || "").toLowerCase().replace(/\s+/g, " ").trim();
    const seen = new Set();
    const mergedItems = [];
    let counter = 1;

    for (const result of stripResults) {
      for (const item of result.items) {
        const key = normalize(item.product_name) + "|" + (item.product_price ?? "null");
        if (seen.has(key)) continue;
        seen.add(key);
        mergedItems.push({ ...item, item_count: counter++ });
      }
    }

    // Merge categories
    const mergedCategories = {};
    for (const result of stripResults) {
      for (const [cat, count] of Object.entries(result.categories)) {
        mergedCategories[cat] = (mergedCategories[cat] || 0) + count;
      }
    }
    // Recount categories from deduplicated items
    const finalCategories = {};
    for (const item of mergedItems) {
      const cat = item.category_name || "Other";
      finalCategories[cat] = (finalCategories[cat] || 0) + 1;
    }

    console.log(`[scan/strip-extract] Merged: ${mergedItems.length} items (deduped from ${stripResults.reduce((s, r) => s + r.items.length, 0)} raw)`);

    res.json({
      items: mergedItems,
      categories: finalCategories,
      textbox_count: Object.keys(finalCategories).length,
      strip_details: stripResults.map(r => ({
        strip: r.strip,
        item_count: r.items.length,
        error: r.error || null,
      })),
    });
  } catch (e) {
    console.error("[scan/strip-extract]", e);
    res.status(500).json({ error: "Strip extraction failed", detail: e.message });
  }
});

// ── POST /api/scan/detect-columns ─────────────────────────────────────────
// 3-step approach: 1) AI crop to menu bounds, 2) sharp gutter detection, 3) AI for category names
router.post("/scan/detect-columns", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    // Fetch the image
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const metadata = await sharp(imgBuffer).metadata();
    const imgW = metadata.width;
    const imgH = metadata.height;

    // ── Step 1: Detect menu bounds (crop out background/margins) ──────────
    const cropPrompt = `This is a photo of a menu card. The menu card may not fill the entire photo — there might be table, background, or other objects visible around it.

I need the bounding box of JUST the menu card content (where product names and prices are listed). Ignore cover panels, logos, or decorative areas that don't have menu items.

Return the bounds as percentages of image dimensions:
- x: left edge (0 = left side of photo)
- y: top edge (0 = top of photo)
- w: width
- h: height

Be generous — include a small margin so no text is clipped.

Return ONLY valid JSON: { "x": 5, "y": 3, "w": 60, "h": 94 }`;

    const cropCheck = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: cropPrompt },
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } },
        ],
      }],
      max_tokens: 100,
      temperature: 0,
    });

    const cropRaw = cropCheck.choices[0].message.content.trim();
    const cropJson = JSON.parse(cropRaw.replace(/^```json?\n?/, "").replace(/\n?```$/, ""));
    console.log("[scan/detect-columns] Step 1 crop bounds:", cropJson);

    // Crop the image to menu bounds
    const cropLeft = Math.max(0, Math.round((cropJson.x / 100) * imgW));
    const cropTop = Math.max(0, Math.round((cropJson.y / 100) * imgH));
    let cropWidth = Math.round((cropJson.w / 100) * imgW);
    let cropHeight = Math.round((cropJson.h / 100) * imgH);
    if (cropLeft + cropWidth > imgW) cropWidth = imgW - cropLeft;
    if (cropTop + cropHeight > imgH) cropHeight = imgH - cropTop;

    const croppedBuffer = await sharp(imgBuffer)
      .extract({ left: cropLeft, top: cropTop, width: cropWidth, height: cropHeight })
      .toBuffer();

    // Upload cropped version
    const croppedId = randomUUID();
    const croppedPath = `uploads/${croppedId}_cropped.jpg`;
    await supabase.storage.from("scan-images").upload(croppedPath, croppedBuffer, { contentType: "image/jpeg", upsert: false });
    const { data: croppedUrlData } = supabase.storage.from("scan-images").getPublicUrl(croppedPath);
    const croppedUrl = croppedUrlData.publicUrl;

    // ── Step 2: AI counts columns + names categories (semantic understanding) ─
    const croppedB64 = croppedBuffer.toString("base64");

    const countPrompt = `This is a cropped photo showing ONLY the menu content area of a restaurant/bar menu.

A menu column has a repeating pattern: product name on the left, price on the right (e.g. "Chimay Blauw    4,90"), repeated for many lines vertically.

How many of these columns are side by side? Count ONLY columns that have the product-name...price pattern. Most menus have 1, 2, or 3 columns.

Also list the category headings visible in each column.

Return ONLY valid JSON: { "column_count": 2, "columns": [ { "column": 1, "categories": ["BIEREN", "KOFFIE"] }, { "column": 2, "categories": ["FRISDRANKEN", "THEE"] } ] }`;

    const countCheck = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "user",
        content: [
          { type: "text", text: countPrompt },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${croppedB64}`, detail: "high" } },
        ],
      }],
      max_tokens: 500,
      temperature: 0,
    });

    const countRaw = countCheck.choices[0].message.content.trim();
    console.log("[scan/detect-columns] Step 2 AI raw:", countRaw);
    const countJson = JSON.parse(countRaw.replace(/^```json?\n?/, "").replace(/\n?```$/, ""));
    const aiColumnCount = countJson.column_count || 1;
    const aiColumns = countJson.columns || [];
    console.log("[scan/detect-columns] AI says:", aiColumnCount, "columns");

    // ── Step 3: Sharp finds the actual pixel boundaries ───────────────────
    // AI tells us HOW MANY columns, sharp tells us WHERE they split.
    const { gutters: allGutters, imageWidth: croppedW, profile } = await detectGutters(croppedBuffer);

    let columns;
    const neededGutters = aiColumnCount - 1;

    if (neededGutters === 0 || allGutters.length === 0) {
      // Single column or no gutters found — use AI result as-is
      columns = aiColumns.map((col, i) => ({
        ...col,
        column: i + 1,
        x_start: Math.round((i / aiColumnCount) * 100),
        x_end: Math.round(((i + 1) / aiColumnCount) * 100),
      }));
      if (columns.length === 0) columns = [{ column: 1, categories: [], x_start: 0, x_end: 100 }];
      console.log("[scan/detect-columns] Single column (AI or no gutters)");
    } else {
      // Pick the N-1 widest gutters to match the AI column count
      const selectedGutters = allGutters
        .sort((a, b) => b.width - a.width)
        .slice(0, neededGutters)
        .sort((a, b) => a.mid - b.mid);

      const splitPoints = selectedGutters.map(g => Math.round((g.mid / croppedW) * 100));
      const boundaries = [0, ...splitPoints, 100];

      columns = [];
      for (let i = 0; i < aiColumnCount; i++) {
        const aiCol = aiColumns[i] || {};
        columns.push({
          column: i + 1,
          categories: aiCol.categories || [],
          x_start: boundaries[i],
          x_end: boundaries[i + 1],
        });
      }
      console.log("[scan/detect-columns] Sharp boundaries:", columns.map(c => `${c.x_start}-${c.x_end}%`));
    }

    res.json({
      columns,
      column_count: columns.length,
      cropped_url: croppedUrl,
      crop_bounds: cropJson,
      detection_method: allGutters.length > 0 ? "sharp-gutter" : "ai-even-split",
      gutter_details: allGutters.map(g => ({
        position_pct: Math.round((g.mid / croppedW) * 100),
        width_px: g.width,
      })),
    });
  } catch (e) {
    console.error("[scan/detect-columns]", e);
    res.status(500).json({ error: "Column detection failed", detail: e.message });
  }
});

// ── POST /api/scan/detect-columns-sharp ───────────────────────────────────
// Pure Sharp column detection — NO AI calls. Uses brightness projection to:
// 1) Auto-crop to content bounds (trim whitespace/background)
// 2) Detect vertical gutters (column splits)
// 3) Detect horizontal section breaks within each column
router.post("/scan/detect-columns-sharp", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const rawBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const imgBuffer = await sharp(rawBuffer).rotate().toBuffer(); // auto-orient
    const meta = await sharp(imgBuffer).metadata();
    const imgW = meta.width;
    const imgH = meta.height;

    // ── Step 1: Auto-crop to content bounds using Sharp trim ──────────────
    // Trim uniform edges (background around menu card)
    let croppedBuffer, cropInfo;
    try {
      const trimmed = sharp(imgBuffer).trim({ threshold: 30 });
      croppedBuffer = await trimmed.toBuffer();
      const trimMeta = await sharp(croppedBuffer).metadata();
      // Calculate crop bounds as percentages for the response
      const trimW = trimMeta.width;
      const trimH = trimMeta.height;
      // sharp trim doesn't tell us offset directly, so compute from size diff
      const dW = imgW - trimW;
      const dH = imgH - trimH;
      cropInfo = {
        x: Math.round((dW / 2 / imgW) * 100),
        y: Math.round((dH / 2 / imgH) * 100),
        w: Math.round((trimW / imgW) * 100),
        h: Math.round((trimH / imgH) * 100),
        method: "sharp-trim",
      };
      console.log(`[detect-columns-sharp] Trimmed: ${imgW}x${imgH} → ${trimW}x${trimH}`);
    } catch (trimErr) {
      // Trim can fail if image is uniform or has no background to trim
      console.log("[detect-columns-sharp] Trim failed, using original:", trimErr.message);
      croppedBuffer = imgBuffer;
      cropInfo = { x: 0, y: 0, w: 100, h: 100, method: "none" };
    }

    // Upload cropped version for display
    const croppedId = randomUUID();
    const croppedPath = `uploads/${croppedId}_cropped.jpg`;
    await supabase.storage.from("scan-images").upload(croppedPath, croppedBuffer, { contentType: "image/jpeg", upsert: false });
    const { data: croppedUrlData } = supabase.storage.from("scan-images").getPublicUrl(croppedPath);
    const croppedUrl = croppedUrlData.publicUrl;

    // ── Step 2: Detect vertical gutters (column splits) ───────────────────
    const { gutters, imageWidth: croppedW, profile } = await detectGutters(croppedBuffer);
    const croppedMeta = await sharp(croppedBuffer).metadata();
    const croppedH = croppedMeta.height;

    // Build columns from gutters
    let columns;
    if (gutters.length === 0) {
      columns = [{ column: 1, x_start: 0, x_end: 100, categories: [] }];
    } else {
      const splitPoints = gutters.map(g => Math.round((g.mid / croppedW) * 100));
      const boundaries = [0, ...splitPoints, 100];
      columns = [];
      for (let i = 0; i < boundaries.length - 1; i++) {
        columns.push({
          column: i + 1,
          x_start: boundaries[i],
          x_end: boundaries[i + 1],
          categories: [],
        });
      }
    }

    // ── Step 3: Detect horizontal section breaks per column ───────────────
    // For each column, do a horizontal projection (1px wide) to find row gaps
    for (const col of columns) {
      const left = Math.max(0, Math.round((col.x_start / 100) * croppedW));
      const right = Math.min(croppedW, Math.round((col.x_end / 100) * croppedW));
      const colWidth = right - left;
      if (colWidth < 10) continue;

      try {
        const colStrip = await sharp(croppedBuffer)
          .extract({ left, top: 0, width: colWidth, height: croppedH })
          .greyscale()
          .blur(2)
          .resize({ width: 1, height: croppedH, kernel: "cubic" })
          .raw()
          .toBuffer();

        // Find horizontal bright bands (gaps between text sections)
        let hSum = 0, hSumSq = 0;
        for (let y = 0; y < croppedH; y++) {
          hSum += colStrip[y];
          hSumSq += colStrip[y] * colStrip[y];
        }
        const hMean = hSum / croppedH;
        const hStddev = Math.sqrt(hSumSq / croppedH - hMean * hMean);
        const hThreshold = Math.min(250, hMean + hStddev * 0.6);

        // Find contiguous bright rows (section gaps)
        const minGapH = Math.max(5, Math.round(croppedH * 0.015)); // at least 1.5% of height
        const hGaps = [];
        let runStart = null;
        for (let y = 0; y < croppedH; y++) {
          if (colStrip[y] >= hThreshold && runStart === null) {
            runStart = y;
          } else if (colStrip[y] < hThreshold && runStart !== null) {
            const runH = y - runStart;
            if (runH >= minGapH) {
              const midPct = Math.round(((runStart + runH / 2) / croppedH) * 100);
              // Only keep interior gaps (10%-90%)
              if (midPct > 10 && midPct < 90) {
                hGaps.push({ y_start: runStart, y_end: y, mid_pct: midPct, height: runH });
              }
            }
            runStart = null;
          }
        }

        // Keep top 8 by height, sort by position
        col.section_breaks = hGaps
          .sort((a, b) => b.height - a.height)
          .slice(0, 8)
          .sort((a, b) => a.mid_pct - b.mid_pct)
          .map(g => ({ y_pct: g.mid_pct, gap_px: g.height }));
      } catch (colErr) {
        console.error(`[detect-columns-sharp] Horizontal projection failed for col ${col.column}:`, colErr.message);
        col.section_breaks = [];
      }
    }

    console.log(`[detect-columns-sharp] ${columns.length} columns, sections:`,
      columns.map(c => `col${c.column}: ${c.section_breaks?.length || 0} breaks`));

    res.json({
      columns,
      column_count: columns.length,
      cropped_url: croppedUrl,
      crop_bounds: cropInfo,
      detection_method: "sharp-only",
      gutter_details: gutters.map(g => ({
        position_pct: Math.round((g.mid / croppedW) * 100),
        width_px: g.width,
      })),
      image_size: { width: croppedW, height: croppedH },
      profile,
    });
  } catch (e) {
    console.error("[detect-columns-sharp]", e);
    res.status(500).json({ error: "Sharp column detection failed", detail: e.message });
  }
});

// ── POST /api/scan/detect-columns-vision ──────────────────────────────────
// Google Cloud Vision word positions → find vertical gaps (no text) → split lines.
// Uses word-level x-coordinates to build a density profile across the page width,
// then finds empty vertical bands = column gutters. No AI, no Sharp.
router.post("/scan/detect-columns-vision", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    const apiKey = process.env.GOOGLE_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GOOGLE_API_KEY not configured" });

    // Fetch image
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const rawBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const imgBuffer = await sharp(rawBuffer).rotate().toBuffer(); // EXIF normalize only
    const meta = await sharp(imgBuffer).metadata();
    const imgW = meta.width;
    const imgH = meta.height;
    const b64 = imgBuffer.toString("base64");

    // ── Step 1: Google Vision → text + logos + objects ─────────────────────
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    const visionRes = await fetch(visionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: b64 },
          features: [
            { type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 },
            { type: "LOGO_DETECTION", maxResults: 10 },
            { type: "OBJECT_LOCALIZATION", maxResults: 20 },
          ],
        }],
      }),
    });
    const visionData = await visionRes.json();

    if (visionData.error) {
      return res.status(500).json({ error: "Google Vision API error", detail: visionData.error.message });
    }

    const response = visionData.responses?.[0] || {};

    // ── Parse logos ──────────────────────────────────────────────────────
    const logos = (response.logoAnnotations || []).map(logo => {
      const verts = logo.boundingPoly?.vertices || [];
      if (verts.length < 4) return null;
      const x0 = Math.min(...verts.map(v => v.x || 0));
      const x1 = Math.max(...verts.map(v => v.x || 0));
      const y0 = Math.min(...verts.map(v => v.y || 0));
      const y1 = Math.max(...verts.map(v => v.y || 0));
      return {
        description: logo.description,
        score: logo.score,
        x0_pct: Math.round((x0 / imgW) * 1000) / 10,
        y0_pct: Math.round((y0 / imgH) * 1000) / 10,
        x1_pct: Math.round((x1 / imgW) * 1000) / 10,
        y1_pct: Math.round((y1 / imgH) * 1000) / 10,
        w_pct: Math.round(((x1 - x0) / imgW) * 1000) / 10,
        h_pct: Math.round(((y1 - y0) / imgH) * 1000) / 10,
        type: "logo",
      };
    }).filter(Boolean);

    // ── Parse localized objects ──────────────────────────────────────────
    const objects = (response.localizedObjectAnnotations || []).map(obj => {
      const normVerts = obj.boundingPoly?.normalizedVertices || [];
      if (normVerts.length < 4) return null;
      const x0 = Math.min(...normVerts.map(v => v.x || 0));
      const x1 = Math.max(...normVerts.map(v => v.x || 0));
      const y0 = Math.min(...normVerts.map(v => v.y || 0));
      const y1 = Math.max(...normVerts.map(v => v.y || 0));
      return {
        name: obj.name,
        score: Math.round((obj.score || 0) * 100) / 100,
        x0_pct: Math.round(x0 * 1000) / 10,
        y0_pct: Math.round(y0 * 1000) / 10,
        x1_pct: Math.round(x1 * 1000) / 10,
        y1_pct: Math.round(y1 * 1000) / 10,
        w_pct: Math.round((x1 - x0) * 1000) / 10,
        h_pct: Math.round((y1 - y0) * 1000) / 10,
        type: "object",
      };
    }).filter(Boolean);

    console.log(`[detect-columns-vision] Logos: ${logos.length} (${logos.map(l => l.description).join(', ') || 'none'})`);
    console.log(`[detect-columns-vision] Objects: ${objects.length} (${objects.map(o => `${o.name} ${o.score}`).join(', ') || 'none'})`);

    const fullAnnotation = response.fullTextAnnotation;
    if (!fullAnnotation) {
      return res.json({
        columns: [{ column: 1, x_start: 0, x_end: 100, categories: [] }], column_count: 1,
        detection_method: "google-vision", logos, objects,
      });
    }

    // Collect all words with bounding boxes, text, and size info
    // Price: decimal (3,00 / €2,8 / +0,50) or whole number (11 / €7)
    // Exclude 0,0 (ABV for non-alcoholic)
    const pricePatternDecimal = /^[€$£+]?\d{1,3}[.,]\d{1,2}$/;
    const pricePatternWhole = /^[€$£]\d{1,3}$/; // whole numbers with currency symbol
    const pricePatternBare = /^\d{1,3}$/; // bare numbers like 15, 18 — only counted as price if on same line as a currency symbol
    const words = [];
    for (const page of (fullAnnotation.pages || [])) {
      for (const block of (page.blocks || [])) {
        for (const para of (block.paragraphs || [])) {
          for (const word of (para.words || [])) {
            const verts = word.boundingBox?.vertices || [];
            if (verts.length < 4) continue;
            const x0 = Math.min(...verts.map(v => v.x || 0));
            const x1 = Math.max(...verts.map(v => v.x || 0));
            const y0 = Math.min(...verts.map(v => v.y || 0));
            const y1 = Math.max(...verts.map(v => v.y || 0));
            if (x1 - x0 < 3) continue;
            const text = (word.symbols || []).map(s => s.text).join("");
            const trimmed = text.trim();
            const height = y1 - y0; // pixel height = visual font size
            // Exclude ABV patterns: 0,0 / 4.5% / 4,5° / 8.5% / 4.5 (next to ° or %)
            const isABV = /^\d{1,2}[.,]\d{1,2}[%°]$/.test(trimmed)
              || /^\d{1,2}[.,]\d{1,2}°$/.test(trimmed)
              || trimmed === "0,0" || trimmed === "0.0";
            const isPrice = !isABV && (pricePatternDecimal.test(trimmed) || pricePatternWhole.test(trimmed));
            const isCurrency = /^[€$£]$/.test(trimmed); // standalone currency symbol
            const isBareNumber = pricePatternBare.test(trimmed) && !isPrice;
            words.push({ x0, x1, y0, y1, text, isPrice, isCurrency, isBareNumber, height });
          }
        }
      }
    }

    // Second pass: contextual corrections
    const currencyWords = words.filter(w => w.isCurrency);
    const percentWords = words.filter(w => /^[%°º]$/.test(w.text.trim()));
    const lineThresholdY = imgH * 0.01;
    const nearbyThresholdX = imgW * 0.03;
    for (const w of words) {
      // Bare numbers next to € → mark as price
      if (w.isBareNumber && !w.isPrice) {
        const hasCurrency = currencyWords.some(c =>
          Math.abs(c.y0 - w.y0) < lineThresholdY && c.x1 <= w.x0 && (w.x0 - c.x1) < nearbyThresholdX
        );
        if (hasCurrency) w.isPrice = true;
      }
      // Numbers next to % or ° → NOT a price (it's ABV)
      if (w.isPrice) {
        const hasPercent = percentWords.some(p =>
          Math.abs(p.y0 - w.y0) < lineThresholdY && p.x0 >= w.x1 && (p.x0 - w.x1) < nearbyThresholdX
        );
        if (hasPercent) w.isPrice = false;
      }
    }

    // Calculate median word height to detect headers (words significantly taller than median)
    const heights = words.map(w => w.height).sort((a, b) => a - b);
    const medianHeight = heights[Math.floor(heights.length / 2)] || 1;
    for (const w of words) {
      w.sizeRatio = Math.round((w.height / medianHeight) * 10) / 10; // 1.0 = normal, 2.0 = 2x bigger
      w.isLarge = w.sizeRatio >= 1.8; // visually large text
      const letters = w.text.replace(/[^a-zA-ZÀ-ÿ]/g, "");
      w.isUppercase = letters.length > 1 && letters === letters.toUpperCase(); // ALL CAPS
      w.isHeader = w.isLarge || (w.isUppercase && w.sizeRatio >= 1.3); // large OR uppercase+medium = header
    }

    console.log(`[detect-columns-vision] ${words.length} words detected on ${imgW}x${imgH} image, median height=${medianHeight}px`);

    if (words.length === 0) {
      return res.json({ columns: [{ column: 1, x_start: 0, x_end: 100, categories: [] }], column_count: 1, detection_method: "google-vision" });
    }

    // ── Step 2: Cluster ALL number-words by x1 position ─────────────────
    const numberWords = words.filter(w => w.isPrice);
    console.log(`[detect-columns-vision] ${numberWords.length} number words found out of ${words.length} total`);

    // Cluster by x1 (right-edge) — sort and find gaps > 3%
    const numX1s = numberWords.map(w => w.x1).sort((a, b) => a - b);
    const clusterGap = imgW * 0.03;
    const allClusters = [];
    let cluster = null;

    for (const x1 of numX1s) {
      if (!cluster || x1 - cluster.maxX1 > clusterGap) {
        if (cluster) allClusters.push(cluster);
        cluster = { minX1: x1, maxX1: x1, count: 1 };
      } else {
        cluster.maxX1 = x1;
        cluster.count++;
      }
    }
    if (cluster) allClusters.push(cluster);

    // Only keep clusters with at least 3 numbers
    const significantClusters = allClusters
      .filter(c => c.count >= 3)
      .sort((a, b) => a.minX1 - b.minX1); // sort left to right

    console.log(`[detect-columns-vision] ${significantClusters.length} number clusters:`,
      significantClusters.map(c => `x1=${Math.round((c.minX1/imgW)*100)}-${Math.round((c.maxX1/imgW)*100)}% (${c.count} nums)`));

    // ── Step 2b: Group adjacent clusters → leftmost=ABV, rest=price ───────────
    // Clusters close together (<15% of image width between consecutive ones) belong
    // to the same visual menu column. The leftmost cluster is ABV; the remaining
    // clusters are price sub-columns that should be merged into ONE price entry
    // (using the rightmost edge for split-line placement).
    const PAIR_THRESHOLD = imgW * 0.15;
    const priceClusters = [];
    const abvClusters = [];
    let i = 0;

    while (i < significantClusters.length) {
      // Greedily collect a run of clusters where each consecutive pair is within threshold
      const group = [significantClusters[i]];
      while (
        i + group.length < significantClusters.length &&
        (significantClusters[i + group.length].minX1 - group[group.length - 1].maxX1) < PAIR_THRESHOLD
      ) {
        group.push(significantClusters[i + group.length]);
      }

      if (group.length >= 2) {
        // Leftmost cluster = ABV
        abvClusters.push(group[0]);
        // Merge remaining clusters into one price entry spanning from the
        // second cluster's minX1 to the last cluster's maxX1, summing counts
        const merged = {
          minX1: group[1].minX1,
          maxX1: group[group.length - 1].maxX1,
          count: group.slice(1).reduce((sum, c) => sum + c.count, 0),
        };
        priceClusters.push(merged);
        console.log(
          `[detect-columns-vision] Group of ${group.length}: ABV cluster ${Math.round((group[0].maxX1 / imgW) * 100)}%` +
          ` + ${group.length - 1} price sub-column(s) merged → ${Math.round((merged.maxX1 / imgW) * 100)}%`
        );
      } else {
        // Standalone = price (no ABV companion)
        priceClusters.push(group[0]);
        console.log(
          `[detect-columns-vision] Standalone price cluster: ${Math.round((group[0].maxX1 / imgW) * 100)}%`
        );
      }

      i += group.length;
    }

    // Mark ABV words on the original words array for debug visualization
    for (const abvCluster of abvClusters) {
      for (const w of words) {
        if (w.isPrice && w.x1 >= abvCluster.minX1 - imgW * 0.01 && w.x1 <= abvCluster.maxX1 + imgW * 0.01) {
          w.isPrice = false;
          w.isABV = true;
        }
      }
    }

    const realClusters = priceClusters.filter(c => c.count >= 3);

    console.log(`[detect-columns-vision] Final: ${realClusters.length} price columns, ${abvClusters.length} ABV columns`);

    // ── Step 3: Place split lines tight after each price cluster ────────────
    const TIGHT_PAD = Math.round(imgW * 0.005);
    const topGutters = [];

    for (let j = 0; j < realClusters.length - 1; j++) {
      const rightEdge = realClusters[j].maxX1;
      const splitX = rightEdge + TIGHT_PAD;
      const splitPct = Math.round((splitX / imgW) * 100);

      if (splitPct > 5 && splitPct < 95) {
        topGutters.push({
          start: rightEdge,
          end: splitX,
          mid: splitX,
          width: TIGHT_PAD,
          mid_pct: splitPct,
          source: "price-cluster",
        });
      }
    }

    console.log(`[detect-columns-vision] ${topGutters.length} split lines:`,
      topGutters.map(g => `${g.mid_pct}%`));

    // ── Step 4: Build columns from ALL split lines ────────────────────────
    // Each uploaded photo = one side of the menu. All splits within it are
    // content columns. Fold structure is inferred from the number of photos
    // on the frontend.
    const splitPoints = topGutters.map(g => g.mid_pct);
    const boundaries = [0, ...splitPoints, 100];

    const columns = [];
    for (let ci = 0; ci < boundaries.length - 1; ci++) {
      columns.push({
        column: ci + 1,
        x_start: boundaries[ci],
        x_end: boundaries[ci + 1],
        categories: [],
      });
    }

    // Upload image for display
    const dispId = randomUUID();
    const dispPath = `uploads/${dispId}_vision.jpg`;
    await supabase.storage.from("scan-images").upload(dispPath, imgBuffer, { contentType: "image/jpeg", upsert: false });
    const { data: dispUrlData } = supabase.storage.from("scan-images").getPublicUrl(dispPath);

    res.json({
      columns,
      column_count: columns.length,
      cropped_url: dispUrlData.publicUrl,
      crop_bounds: { x: 0, y: 0, w: 100, h: 100, method: "google-vision" },
      detection_method: "google-vision",
      gutter_details: topGutters.map(g => ({ position_pct: g.mid_pct, width_px: g.width, source: g.source || "price-cluster" })),
      image_size: { width: imgW, height: imgH },
      word_count: words.length,
      price_count: words.filter(w => w.isPrice).length,
      abv_count: words.filter(w => w.isABV).length,
      price_clusters: realClusters.map(c => ({
        right_edge_pct: Math.round((c.maxX1 / imgW) * 100),
        count: c.count,
      })),
      debug_words: words.map(w => ({
        x0_pct: Math.round((w.x0 / imgW) * 1000) / 10,
        y0_pct: Math.round((w.y0 / imgH) * 1000) / 10,
        x1_pct: Math.round((w.x1 / imgW) * 1000) / 10,
        y1_pct: Math.round((w.y1 / imgH) * 1000) / 10,
        text: w.text,
        isPrice: w.isPrice,
        isABV: w.isABV || false,
        isHeader: w.isHeader,
        isLarge: w.isLarge,
        isUppercase: w.isUppercase,
        sizeRatio: w.sizeRatio,
        height_px: w.height,
      })),
      median_word_height: medianHeight,
      logos,
      objects,
    });
  } catch (e) {
    console.error("[detect-columns-vision]", e);
    res.status(500).json({ error: "Google Vision detection failed", detail: e.message });
  }
});

// ── POST /api/scan/vision-pipeline ────────────────────────────────────────
// Full pipeline: Google Vision → crop blocks → GPT-4o per block → reassemble
// Returns items with original coordinates so the menu can be reconstructed.
router.post("/scan/vision-pipeline", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    const apiKey = process.env.GOOGLE_API_KEY || process.env.REACT_APP_GOOGLE_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GOOGLE_API_KEY not configured" });

    // ── Step 1: Fetch image ───────────────────────────────────────────────
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const rawBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const imgBuffer = await sharp(rawBuffer).rotate().toBuffer(); // EXIF normalize only
    const meta = await sharp(imgBuffer).metadata();
    const imgW = meta.width;
    const imgH = meta.height;

    // ── Step 2: Google Vision → get text blocks with bounding boxes ───────
    const b64 = imgBuffer.toString("base64");
    const visionUrl = `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`;
    const visionRes = await fetch(visionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: b64 },
          features: [{ type: "DOCUMENT_TEXT_DETECTION", maxResults: 1 }],
        }],
      }),
    });
    const visionData = await visionRes.json();
    const fullAnnotation = visionData.responses?.[0]?.fullTextAnnotation;
    if (!fullAnnotation) {
      return res.json({ blocks: [], items: [], message: "No text detected" });
    }

    // Extract blocks with bounding boxes
    const blocks = [];
    for (const page of (fullAnnotation.pages || [])) {
      for (const block of (page.blocks || [])) {
        if (block.blockType !== "TEXT") continue;
        const verts = block.boundingBox?.vertices || [];
        if (verts.length < 4) continue;

        const x0 = Math.min(...verts.map(v => v.x || 0));
        const x1 = Math.max(...verts.map(v => v.x || 0));
        const y0 = Math.min(...verts.map(v => v.y || 0));
        const y1 = Math.max(...verts.map(v => v.y || 0));

        // Skip tiny blocks (noise)
        const bw = x1 - x0;
        const bh = y1 - y0;
        if (bw < imgW * 0.03 || bh < imgH * 0.02) continue;

        // Extract raw text from Vision (for reference, GPT will re-read from image)
        let blockText = "";
        for (const para of (block.paragraphs || [])) {
          for (const word of (para.words || [])) {
            blockText += (blockText ? " " : "") + (word.symbols || []).map(s => s.text).join("");
          }
          blockText += "\n";
        }

        blocks.push({
          id: blocks.length + 1,
          x0, y0, x1, y1,
          x0_pct: Math.round((x0 / imgW) * 100),
          y0_pct: Math.round((y0 / imgH) * 100),
          x1_pct: Math.round((x1 / imgW) * 100),
          y1_pct: Math.round((y1 / imgH) * 100),
          width: bw,
          height: bh,
          vision_text: blockText.trim(),
        });
      }
    }

    // Sort blocks: top-to-bottom, left-to-right
    blocks.sort((a, b) => {
      const rowA = Math.floor(a.y0 / (imgH * 0.1));
      const rowB = Math.floor(b.y0 / (imgH * 0.1));
      if (rowA !== rowB) return rowA - rowB;
      return a.x0 - b.x0;
    });

    console.log(`[vision-pipeline] Step 2: ${blocks.length} text blocks detected`);

    // ── Step 3: Crop each block and send to GPT-4o ────────────────────────
    const PAD = 10; // padding around crop to avoid clipping text
    const allItems = [];
    const blockResults = [];

    for (const block of blocks) {
      const cropLeft = Math.max(0, block.x0 - PAD);
      const cropTop = Math.max(0, block.y0 - PAD);
      const cropRight = Math.min(imgW, block.x1 + PAD);
      const cropBottom = Math.min(imgH, block.y1 + PAD);
      const cropW = cropRight - cropLeft;
      const cropH = cropBottom - cropTop;

      if (cropW < 20 || cropH < 20) continue;

      try {
        const cropped = await sharp(imgBuffer)
          .extract({ left: cropLeft, top: cropTop, width: cropW, height: cropH })
          .toBuffer();
        const cropB64 = cropped.toString("base64");

        const prompt = `This is a small section cropped from a restaurant/bar menu card. Extract every menu item visible.

For each item return:
- "category_name": the heading/subtitle it belongs to (exact text from menu, or "Unknown" if no heading visible)
- "product_name": item name exactly as written. Append ABV% if shown. Use "unreadable" if you can't read it.
- "product_description": extra description (empty string if none)
- "product_price": price as integer in CENTS (e.g. 520 for €5,20). null if not visible.
- "serve_format": one of "draft", "bottle", "can", "glass", or null
- "confidence": 0-100

If this section contains ONLY a heading/title with no items, return: { "items": [], "is_header": true, "header_text": "..." }
If it's decorative/non-menu content, return: { "items": [], "is_decoration": true }

Return ONLY valid JSON (no markdown): { "items": [...] }`;

        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cropB64}`, detail: "high" } },
            ],
          }],
          max_tokens: 4096,
          temperature: 0.1,
        });

        const raw = completion.choices[0].message.content.trim();
        const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
        const parsed = JSON.parse(jsonStr);

        const blockItems = (parsed.items || []).map((item, idx) => ({
          ...item,
          block_id: block.id,
          block_x0_pct: block.x0_pct,
          block_y0_pct: block.y0_pct,
          block_x1_pct: block.x1_pct,
          block_y1_pct: block.y1_pct,
          position_in_block: idx + 1,
        }));

        allItems.push(...blockItems);
        blockResults.push({
          block_id: block.id,
          x0_pct: block.x0_pct, y0_pct: block.y0_pct,
          x1_pct: block.x1_pct, y1_pct: block.y1_pct,
          vision_text: block.vision_text,
          items_extracted: blockItems.length,
          is_header: parsed.is_header || false,
          header_text: parsed.header_text || null,
          is_decoration: parsed.is_decoration || false,
        });

        console.log(`[vision-pipeline] Block ${block.id}: ${blockItems.length} items extracted`);
      } catch (blockErr) {
        console.error(`[vision-pipeline] Block ${block.id} failed:`, blockErr.message);
        blockResults.push({
          block_id: block.id,
          x0_pct: block.x0_pct, y0_pct: block.y0_pct,
          x1_pct: block.x1_pct, y1_pct: block.y1_pct,
          vision_text: block.vision_text,
          items_extracted: 0,
          error: blockErr.message,
        });
      }
    }

    // Number items globally
    allItems.forEach((item, i) => { item.item_count = i + 1; });

    // Build categories summary
    const categories = {};
    for (const item of allItems) {
      const cat = item.category_name || "Unknown";
      categories[cat] = (categories[cat] || 0) + 1;
    }

    console.log(`[vision-pipeline] Done: ${blocks.length} blocks → ${allItems.length} items`);

    res.json({
      items: allItems,
      categories,
      blocks: blockResults,
      block_count: blocks.length,
      item_count: allItems.length,
      image_size: { width: imgW, height: imgH },
      detection_method: "vision-pipeline",
    });
  } catch (e) {
    console.error("[vision-pipeline]", e);
    res.status(500).json({ error: "Vision pipeline failed", detail: e.message });
  }
});

// ── POST /api/scan/vision-extract ─────────────────────────────────────────
// Full pipeline: Google Vision split lines → Sharp crop → GPT per column → structural tree
// Returns: { panels: [{ columns: [{ textboxes: [{ header, items: [...] }] }] }] }
router.post("/scan/vision-extract", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl, splitLines } = req.body;
    // splitLines = array of { position_pct } from the detect-columns-vision step
    if (!imageUrl || !splitLines) return res.status(400).json({ error: "imageUrl and splitLines required" });

    // Fetch image
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const rawBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const imgBuffer = await sharp(rawBuffer).rotate().toBuffer();
    const meta = await sharp(imgBuffer).metadata();
    const imgW = meta.width;
    const imgH = meta.height;

    // Build column boundaries from split lines
    const splits = splitLines.map(s => s.position_pct).sort((a, b) => a - b);
    const boundaries = [0, ...splits, 100];
    const columnCount = boundaries.length - 1;

    console.log(`[vision-extract] ${columnCount} columns from splits: ${splits.join(', ')}%`);

    // ── First pass: extract styling + logo from full image ──────────────
    const fullB64 = imgBuffer.toString("base64");
    const stylingPrompt = `Look at this menu card photo. Extract:
1. "bg_color": the dominant background color as a hex code (e.g. "#f5f0e6")
2. "text_color": the main body text color as hex (e.g. "#14213d")
3. "header_color": the category header text color as hex (e.g. "#c4a96a")
4. "logo": if there is a logo or icon visible, return its approximate position as { "x_pct", "y_pct", "w_pct", "h_pct" } (percentage of image dimensions). null if no logo.
5. "fold_type": the fold format — one of: "a5-portrait", "a4-portrait", "a4-landscape", "bifold", "trifold", "zfold", "four-panel", "a4-booklet", "a5-booklet", "gate-fold", "accordion", "roll-fold", "double-parallel". Pick the one that best matches what you see.

Return ONLY valid JSON (no markdown):
{ "bg_color": "...", "text_color": "...", "header_color": "...", "logo": null | { "x_pct": ..., "y_pct": ..., "w_pct": ..., "h_pct": ... }, "fold_type": "..." }`;

    let menuStyling = {};
    try {
      const stylingCompletion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: stylingPrompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${fullB64}`, detail: "low" } },
          ],
        }],
        max_tokens: 512,
        temperature: 0.1,
      });
      const rawStyling = stylingCompletion.choices[0].message.content.trim();
      menuStyling = JSON.parse(rawStyling.replace(/^```json?\n?/, "").replace(/\n?```$/, ""));
      console.log(`[vision-extract] Styling:`, menuStyling);
    } catch (stylingErr) {
      console.error(`[vision-extract] Styling extraction failed:`, stylingErr.message);
    }

    const columns = [];

    for (let i = 0; i < columnCount; i++) {
      const xStartPct = boundaries[i];
      const xEndPct = boundaries[i + 1];
      const left = Math.max(0, Math.round((xStartPct / 100) * imgW));
      const right = Math.min(imgW, Math.round((xEndPct / 100) * imgW));
      const width = right - left;

      if (width < 20) {
        columns.push({ column: i + 1, textboxes: [], error: "Column too narrow" });
        continue;
      }

      // Crop this column
      const cropped = await sharp(imgBuffer)
        .extract({ left, top: 0, width, height: imgH })
        .toBuffer();
      const cropB64 = cropped.toString("base64");

      console.log(`[vision-extract] Column ${i + 1}/${columnCount}: ${xStartPct}-${xEndPct}% (${width}px wide)`);

      // GPT extracts structured text-boxes from this column
      const prompt = `You are reading ONE COLUMN of a restaurant/bar menu card. Extract its complete structure.

## Structure

Return "textboxes" — each textbox is a visual section (category block). Each textbox contains "display_rows" — each display_row is ONE VISUAL LINE on the menu.

## Textbox fields:
- "header": section heading text (null if none)
- "header_style": "large", "uppercase", "normal", or null
- "type": "category" (header + items), "items_only" (no header), "text" (just text/notes), "header_only" (standalone title)
- "volume_headers": if volume columns appear at the top of this section (e.g. "25cl  33cl  50cl"), list them: ["25cl", "33cl", "50cl"]. null otherwise.
- "display_rows": array of visual rows (see below)

## Display row types:

Each display_row has a "row_type" and an "items" array. IMPORTANT: every product must appear as its own item in the items array, even when grouped visually.

### "single" — one item, one line (most common)
{ "row_type": "single", "items": [{ "product_name": "Heineken", "product_price": 450, "abv": 5.0 }] }

### "single_described" — item with description text below it
{ "row_type": "single_described", "description": "rum, ice tea, munt, limoen", "items": [{ "product_name": "Iced Rum Tea", "product_price": 1100 }] }

### "multi_inline" — multiple products on ONE VISUAL LINE, usually sharing a price
{ "row_type": "multi_inline", "separator": " - ", "items": [
  { "product_name": "Fanta", "product_price": 280 },
  { "product_name": "Cola", "product_price": 280 },
  { "product_name": "Sprite", "product_price": 280 }
] }
IMPORTANT: multi_inline means the items are literally on the SAME LINE separated by " - ", " / ", " · " etc. If the items are on SEPARATE LINES below each other, they are NOT multi_inline — use "single" for each, or "brand_variants" if they share a brand header.

### "brand_variants" — brand name as a header, followed by variant rows BELOW it (on separate lines)
{ "row_type": "brand_variants", "brand_name": "Yugen Kombucha", "variant_style": "indented", "items": [
  { "product_name": "Yugen Kombucha Appelmunt", "product_price": 510, "variant_label": "appelmunt" },
  { "product_name": "Yugen Kombucha Citroen", "product_price": 510, "variant_label": "citroen" }
] }
Note: product_name must be the FULL name (brand + variant). variant_label is the short text shown on the menu.
Use this when a brand name appears on its own line, then variants are listed below (often indented or in smaller text).

### "price_variants" — same product in different volumes/sizes with different prices
Common formats on menus:
Format A (slash): "Bavik Super  25cl/33cl/50cl  2,90/3,40/5,80"
Format B (inline): "Bavik Super  25cl 2,90  33cl 3,40  50cl 5,80"
Format C (column headers): the textbox has volume headers like "25cl  33cl  50cl" at the top, and each item row just shows prices per volume.
{ "row_type": "price_variants", "items": [
  { "product_name": "Bavik Super 25cl", "product_price": 290, "volume": "25cl" },
  { "product_name": "Bavik Super 33cl", "product_price": 340, "volume": "33cl" },
  { "product_name": "Bavik Super 50cl", "product_price": 580, "volume": "50cl" }
] }
Note: each volume is a SEPARATE item with its own price. product_name includes the volume.
If volume headers appear at the textbox level, set "volume_headers": ["25cl", "33cl"] on the textbox.

### "supplement" — a supplement/add-on line (e.g. "met slagroom +0,50" or "extra shot +1,00")
{ "row_type": "supplement", "items": [
  { "product_name": "met slagroom", "product_price": 50 }
] }
These are modifiers/extras, not standalone products. They usually start with "met", "extra", "+", or similar.

### "note" — a non-product text line (explanation, policy, allergy info, etc.)
{ "row_type": "note", "description": "Alle bieren zijn ook verkrijgbaar als proeverij (15cl)", "items": [] }
No items — just a "description" field with the text. Use for any line that is NOT a product/price.

## Item fields (for ALL types):
- "product_name": full product name (brand + variant + volume if relevant). "unreadable" if unclear.
- "product_description": extra text (empty string if none) — NOT used for single_described, that goes in the row's "description"
- "product_price": price in CENTS (520 for €5,20). null if not visible.
- "volume": "25cl", "33cl", "75cl", etc. null if not shown.
- "serve_format": "draft", "bottle", "can", "glass", or null
- "abv": alcohol percentage as number (5.2). null if not shown.
- "confidence": 0-100

## Rules
- EXACT order top to bottom
- Every visible price line = at least one item. Count them carefully.
- "unreadable" is better than skipping. Do NOT invent items.
- When unsure about row_type, use "single" as default.
- product_name should always be the COMPLETE name suitable for a product database.

Return ONLY valid JSON (no markdown):
{ "textboxes": [...] }`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cropB64}`, detail: "high" } },
            ],
          }],
          max_tokens: 16384,
          temperature: 0.1,
        });

        const raw = completion.choices[0].message.content.trim();
        const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
        const parsed = JSON.parse(jsonStr);
        // Process textboxes with display_rows
        let rowCounter = 1;
        const textboxes = (parsed.textboxes || []).map((tb, idx) => {
          const displayRows = (tb.display_rows || []).map((dr, drIdx) => ({
            ...dr,
            sort_order: drIdx + 1,
            row_type: dr.row_type || "single",
            items: (dr.items || []).map((item, itemIdx) => ({
              ...item,
              position_in_row: itemIdx + 1,
              global_row: rowCounter++,
            })),
          }));
          return {
            ...tb,
            sort_order: idx + 1,
            display_rows: displayRows,
          };
        });

        const itemCount = textboxes.reduce((sum, tb) =>
          sum + tb.display_rows.reduce((s, dr) => s + (dr.items?.length || 0), 0), 0);
        const rowCount = textboxes.reduce((sum, tb) => sum + tb.display_rows.length, 0);
        console.log(`[vision-extract] Column ${i + 1}: ${textboxes.length} textboxes, ${rowCount} display_rows, ${itemCount} items`);

        columns.push({
          column: i + 1,
          x_start_pct: xStartPct,
          x_end_pct: xEndPct,
          textboxes,
        });
      } catch (gptErr) {
        console.error(`[vision-extract] Column ${i + 1} GPT failed:`, gptErr.message);
        columns.push({
          column: i + 1,
          x_start_pct: xStartPct,
          x_end_pct: xEndPct,
          textboxes: [],
          error: gptErr.message,
        });
      }
    }

    // Summary stats
    const totalTextboxes = columns.reduce((s, c) => s + c.textboxes.length, 0);
    const totalRows = columns.reduce((s, c) => s + c.textboxes.reduce((s2, tb) => s2 + (tb.display_rows?.length || 0), 0), 0);
    const totalItems = columns.reduce((s, c) => s + c.textboxes.reduce((s2, tb) =>
      s2 + (tb.display_rows || []).reduce((s3, dr) => s3 + (dr.items?.length || 0), 0), 0), 0);

    // Count row types
    const rowTypeCounts = {};
    for (const col of columns) {
      for (const tb of col.textboxes) {
        for (const dr of (tb.display_rows || [])) {
          rowTypeCounts[dr.row_type] = (rowTypeCounts[dr.row_type] || 0) + 1;
        }
      }
    }

    console.log(`[vision-extract] Done: ${columnCount} columns, ${totalTextboxes} textboxes, ${totalRows} display_rows, ${totalItems} items`);
    console.log(`[vision-extract] Row types:`, rowTypeCounts);

    res.json({
      panel: {
        columns,
        column_count: columnCount,
      },
      styling: menuStyling,
      total_textboxes: totalTextboxes,
      total_display_rows: totalRows,
      total_items: totalItems,
      row_type_counts: rowTypeCounts,
      detection_method: "vision-extract",
    });
  } catch (e) {
    console.error("[vision-extract]", e);
    res.status(500).json({ error: "Vision extract failed", detail: e.message });
  }
});

// ── POST /api/scan/verify-structure ───────────────────────────────────────
// Compares Vision-detected prices against GPT-extracted items per column.
// Sends each column image + extracted items back to GPT to find missing items.
router.post("/scan/verify-structure", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl, splitLines, extractedColumns } = req.body;
    if (!imageUrl || !splitLines || !extractedColumns) {
      return res.status(400).json({ error: "imageUrl, splitLines, and extractedColumns required" });
    }

    // Fetch and prepare image
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const rawBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const imgBuffer = await sharp(rawBuffer).rotate().toBuffer();
    const meta = await sharp(imgBuffer).metadata();
    const imgW = meta.width;
    const imgH = meta.height;

    // Build column boundaries
    const splits = splitLines.map(s => s.position_pct).sort((a, b) => a - b);
    const boundaries = [0, ...splits, 100];
    const columnCount = boundaries.length - 1;

    const verifications = [];

    for (let i = 0; i < columnCount; i++) {
      const xStartPct = boundaries[i];
      const xEndPct = boundaries[i + 1];
      const left = Math.max(0, Math.round((xStartPct / 100) * imgW));
      const right = Math.min(imgW, Math.round((xEndPct / 100) * imgW));
      const width = right - left;

      if (width < 20) {
        verifications.push({ column: i + 1, status: "skipped", reason: "too narrow" });
        continue;
      }

      // Crop this column
      const cropped = await sharp(imgBuffer)
        .extract({ left, top: 0, width, height: imgH })
        .toBuffer();
      const cropB64 = cropped.toString("base64");

      // Build the list of extracted items for this column
      const col = extractedColumns[i];
      const extractedItems = [];
      if (col?.textboxes) {
        for (const tb of col.textboxes) {
          for (const dr of (tb.display_rows || [])) {
            for (const item of (dr.items || [])) {
              extractedItems.push({
                product_name: item.product_name,
                product_price: item.product_price,
                volume: item.volume || null,
                category: tb.header || null,
              });
            }
          }
        }
      }

      const itemList = extractedItems.map((it, idx) =>
        `${idx + 1}. ${it.product_name}${it.volume ? ` (${it.volume})` : ''} — ${it.product_price != null ? `€${(it.product_price / 100).toFixed(2)}` : 'no price'}${it.category ? ` [${it.category}]` : ''}`
      ).join('\n');

      const verifyPrompt = `Look at this menu column image. Below is the list of items we extracted from it.

EXTRACTED ITEMS (${extractedItems.length} total):
${itemList}

Your task: compare the image against this list and find ANY discrepancies:
1. Items visible on the menu that are MISSING from the list (skipped by extraction)
2. Items in the list that don't appear on the menu (hallucinated)
3. Prices that are WRONG (different from what's shown on the menu)

For each issue found, return it in the array. If everything matches perfectly, return an empty array.

Return ONLY valid JSON (no markdown):
{
  "match": true/false,
  "extracted_count": ${extractedItems.length},
  "visible_count": <number of product lines you can see on the menu>,
  "issues": [
    { "type": "missing", "product_name": "...", "product_price": <cents or null>, "location": "after X / before Y" },
    { "type": "hallucinated", "product_name": "...", "reason": "..." },
    { "type": "wrong_price", "product_name": "...", "extracted_price": <cents>, "correct_price": <cents> }
  ]
}`;

      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{
            role: "user",
            content: [
              { type: "text", text: verifyPrompt },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${cropB64}`, detail: "high" } },
            ],
          }],
          max_tokens: 4096,
          temperature: 0.1,
        });

        const raw = completion.choices[0].message.content.trim();
        const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
        const parsed = JSON.parse(jsonStr);

        console.log(`[verify-structure] Column ${i + 1}: match=${parsed.match}, extracted=${parsed.extracted_count}, visible=${parsed.visible_count}, issues=${parsed.issues?.length || 0}`);

        verifications.push({
          column: i + 1,
          ...parsed,
          status: parsed.match ? "ok" : "mismatch",
        });
      } catch (gptErr) {
        console.error(`[verify-structure] Column ${i + 1} GPT failed:`, gptErr.message);
        verifications.push({ column: i + 1, status: "error", error: gptErr.message });
      }
    }

    const allOk = verifications.every(v => v.status === "ok" || v.status === "skipped");
    const totalIssues = verifications.reduce((s, v) => s + (v.issues?.length || 0), 0);

    console.log(`[verify-structure] Done: ${allOk ? 'ALL OK' : `${totalIssues} issues found`}`);

    res.json({
      ok: allOk,
      total_issues: totalIssues,
      columns: verifications,
    });
  } catch (e) {
    console.error("[verify-structure]", e);
    res.status(500).json({ error: "Verify structure failed", detail: e.message });
  }
});

// ── POST /api/scan/extract-column ─────────────────────────────────────────
// Crop a vertical column strip from the image and extract items from it
router.post("/scan/extract-column", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl, column } = req.body;
    // column = { x_start, x_end, column number }
    if (!imageUrl || !column) return res.status(400).json({ error: "imageUrl and column are required" });

    // Fetch and crop the image
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image" });
    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());

    const metadata = await sharp(imgBuffer).metadata();
    const imgW = metadata.width;
    const imgH = metadata.height;

    // Full-height vertical strip
    const left = Math.max(0, Math.round((column.x_start / 100) * imgW));
    const right = Math.min(imgW, Math.round((column.x_end / 100) * imgW));
    const width = right - left;
    if (width < 10) return res.status(400).json({ error: "Column too narrow" });

    const cropped = await sharp(imgBuffer)
      .extract({ left, top: 0, width, height: imgH })
      .toBuffer();

    const b64 = cropped.toString("base64");

    // Use the same full extraction prompt — this is just a narrower image now
    const prompt = `You are an expert at reading menu cards from bars, restaurants, and cafés.

Analyze this menu column carefully. Extract EVERY menu item visible.

## Step 1 — Identify text-boxes

A "text-box" is a category heading/subtitle with its items listed underneath. Every new heading starts a new text-box. Number them sequentially top-to-bottom starting at 1.

## Step 2 — Extract every item

For EACH menu item, return:
- "category_name": the heading/subtitle of the text-box. Use the exact text from the menu.
- "product_name": the item name exactly as written. If an ABV% is shown, APPEND it. If you cannot read the text, use "unreadable" — never skip a row.
- "product_description": any extra description or notes EXCLUDING ABV (empty string if none).
- "product_price": price as integer in CENTS (e.g. 520 for €5,20). null if not visible.
- "textbox": which text-box number (within this column)
- "position_in_textbox": position within the text-box, starting at 1
- "page_number": 1
- "serve_format": one of "draft", "bottle", "can", "glass", or null
- "confidence": 0-100 how confident you are in this extraction

## Step 3 — Verify

Count every price line visible per text-box. If your item count doesn't match, re-examine and correct.

Return ONLY valid JSON (no markdown, no backticks):
{
  "items": [...],
  "categories": {"Cat1": 4, "Cat2": 9},
  "textbox_count": 3,
  "textbox_summary": [
    {"textbox": 1, "category_name": "...", "items_extracted": 6, "price_lines_visible": 6}
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${b64}`, detail: "high" } },
          ],
        },
      ],
      max_tokens: 16384,
      temperature: 0.1,
    });

    const raw = completion.choices[0].message.content.trim();
    const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[scan/extract-column] JSON parse failed. Raw:", raw.slice(0, 500));
      return res.status(500).json({ error: "Invalid JSON from column extraction", detail: parseErr.message });
    }

    res.json(parsed);
  } catch (e) {
    console.error("[scan/extract-column]", e);
    res.status(500).json({ error: "Column extraction failed", detail: e.message });
  }
});

// ── POST /api/scan/prescan ────────────────────────────────────────────────
// Quick structural scan: count pages, columns, text-boxes, rows per box
router.post("/scan/prescan", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    const prompt = `You are an expert at analyzing menu cards from bars, restaurants, and cafés.

Look at this menu card photo. Do NOT extract individual items yet. Instead, map out the STRUCTURE of the menu.

## Instructions

1. **Pages/panels**: How many distinct pages or panels are visible? (A single photo = 1 page. Fold lines may create multiple panels.)

2. **Visual columns per page**: How many side-by-side vertical columns of text are on each page? (e.g. a page with items on the left and right = 2 visual columns)

3. **Text-boxes**: Within each visual column, identify each category/heading (e.g. "BIEREN", "Frisdranken", "Alcoholvrij", "Trappisten", "KOFFIE"). Each heading with its items underneath = 1 text-box. Number them sequentially left-to-right, top-to-bottom across the entire menu.

4. **Row count per text-box**: Count the number of ROWS in each text-box. One row = one price line. Count every single price you can see, top to bottom, one by one. Do not estimate — count precisely. If a heading itself has no price, do not count it as a row. Sub-headings within a text-box (like "Alcoholvrij:" under "BIEREN") start a NEW text-box.

Return ONLY valid JSON (no markdown, no backticks):
{
  "pages": [
    {
      "page_number": 1,
      "visual_columns": 2
    }
  ],
  "textboxes": [
    { "textbox": 1, "page": 1, "visual_column": 1, "category_name": "BIEREN", "row_count": 25 },
    { "textbox": 2, "page": 1, "visual_column": 1, "category_name": "Alcoholvrij", "row_count": 8 },
    ...
  ],
  "total_rows": 95
}`;

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
    const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[scan/prescan] JSON parse failed. Raw:", raw.slice(0, 500));
      return res.status(500).json({ error: "Prescan returned invalid JSON", detail: parseErr.message, rawPreview: raw.slice(0, 300) });
    }

    res.json(parsed);
  } catch (e) {
    console.error("[scan/prescan]", e);
    res.status(500).json({ error: "Prescan failed", detail: e.message });
  }
});

// ── POST /api/scan/extract ────────────────────────────────────────────────
// Send image to GPT-4o vision to extract menu items
router.post("/scan/extract", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    const prompt = `You are an expert at reading menu cards from bars, restaurants, and cafés.

Analyze this menu card photo carefully. Extract EVERY menu item visible.

## Step 1 — Identify text-boxes

A "text-box" is a visual group on the menu: a category heading/subtitle (e.g. "Frisdranken", "Cocktails", "Regionale Bieren") with its items listed underneath. Every new heading starts a new text-box — even if it is in the same visual column on the page.

Number text-boxes sequentially, reading left-to-right then top-to-bottom:
- Left visual column has 3 headings stacked → text-boxes 1, 2, 3
- Right visual column has 2 headings stacked → text-boxes 4, 5
- Total: textbox_count = 5

## Step 2 — Extract every item

For EACH menu item, return:
- "category_name": the heading/subtitle of the text-box it belongs to. Use the exact text from the menu.
- "product_name": the item name exactly as written. If an ABV/alcohol percentage is shown (e.g. 7.5%, 9,0%), APPEND it: "Chimay Blauw 9,0%". If you can detect a row/line on the menu but CANNOT read the text clearly, use "unreadable" as the product_name — never skip a row.
- "product_description": any extra description, ingredients, or notes EXCLUDING the ABV (empty string if none). For cocktails/food, include the ingredient list if shown.
- "product_price": the price as an integer in CENTS (e.g. 520 for €5,20 or €5.20). null if not visible or unreadable.
- "textbox": which text-box number this item belongs to (1, 2, 3, ... as defined in Step 1)
- "position_in_textbox": the item's position within its text-box (resets to 1 for each new text-box)
- "page_number": which page/panel (1 for single-side photo; if fold lines create panels, number left-to-right starting at 1)
- "serve_format": one of "draft", "bottle", "can", "glass", or null if not specified
- "confidence": a number from 0 to 100 indicating how confident you are in the extraction of THIS item. Consider:
  - 90-100: text is crisp and clearly readable, price is unambiguous
  - 70-89: mostly readable but some characters are guessed (e.g. blurry, small font, unusual styling)
  - 50-69: significant guessing — partial text, obscured by fold/shadow, handwritten and hard to parse
  - 0-49: very uncertain — "unreadable" items, or names/prices that are mostly guessed

## Step 3 — Verify counts

After extracting all items, count the number of items in each text-box. Cross-check this by counting the number of distinct price lines (or price positions) visible for that text-box on the menu image. If the counts don't match, re-examine the image and correct any missed or duplicated items.

Return the verification as a "textbox_summary" array: one entry per text-box with:
- "textbox": the text-box number
- "category_name": the heading
- "items_extracted": how many items you extracted
- "price_lines_visible": how many distinct price lines you can count in the image for this text-box

## Output format

Return ONLY valid JSON (no markdown, no backticks):
{
  "items": [...],
  "categories": {"Cat1": 4, "Cat2": 9},
  "textbox_count": 5,
  "textbox_summary": [
    {"textbox": 1, "category_name": "Frisdranken", "items_extracted": 6, "price_lines_visible": 6},
    ...
  ]
}`;

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
      max_tokens: 16384,
      temperature: 0.1,
    });

    const raw = completion.choices[0].message.content.trim();
    // Strip markdown fences if present
    const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[scan/extract] JSON parse failed. Raw response:", raw.slice(0, 500));
      return res.status(500).json({
        error: "Extraction returned invalid JSON — response may have been truncated",
        detail: parseErr.message,
        rawPreview: raw.slice(0, 300),
      });
    }

    res.json(parsed);
  } catch (e) {
    console.error("[scan/extract]", e);
    res.status(500).json({ error: "Extraction failed", detail: e.message });
  }
});

// ── POST /api/scan/extract-claude ─────────────────────────────────────────
// Same extraction but using Claude (Anthropic) vision instead of GPT-4o
router.post("/scan/extract-claude", isAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl is required" });

    // Fetch image and convert to base64 for Claude API
    const imgResponse = await fetch(imageUrl);
    if (!imgResponse.ok) return res.status(400).json({ error: "Could not fetch image", detail: imgResponse.statusText });
    const imgBuffer = Buffer.from(await imgResponse.arrayBuffer());
    const contentType = imgResponse.headers.get("content-type") || "image/jpeg";
    const b64 = imgBuffer.toString("base64");

    const prompt = `You are an expert at reading menu cards from bars, restaurants, and cafés.

Analyze this menu card photo carefully. Extract EVERY menu item visible.

## Step 1 — Identify text-boxes

A "text-box" is a visual group on the menu: a category heading/subtitle (e.g. "Frisdranken", "Cocktails", "Regionale Bieren") with its items listed underneath. Every new heading starts a new text-box — even if it is in the same visual column on the page.

Number text-boxes sequentially, reading left-to-right then top-to-bottom:
- Left visual column has 3 headings stacked → text-boxes 1, 2, 3
- Right visual column has 2 headings stacked → text-boxes 4, 5
- Total: textbox_count = 5

## Step 2 — Extract every item

For EACH menu item, return:
- "category_name": the heading/subtitle of the text-box it belongs to. Use the exact text from the menu.
- "product_name": the item name exactly as written. If an ABV/alcohol percentage is shown (e.g. 7.5%, 9,0%), APPEND it: "Chimay Blauw 9,0%". If you can detect a row/line on the menu but CANNOT read the text clearly, use "unreadable" as the product_name — never skip a row.
- "product_description": any extra description, ingredients, or notes EXCLUDING the ABV (empty string if none). For cocktails/food, include the ingredient list if shown.
- "product_price": the price as an integer in CENTS (e.g. 520 for €5,20 or €5.20). null if not visible or unreadable.
- "textbox": which text-box number this item belongs to (1, 2, 3, ... as defined in Step 1)
- "position_in_textbox": the item's position within its text-box (resets to 1 for each new text-box)
- "page_number": which page/panel (1 for single-side photo; if fold lines create panels, number left-to-right starting at 1)
- "serve_format": one of "draft", "bottle", "can", "glass", or null if not specified
- "confidence": a number from 0 to 100 indicating how confident you are in the extraction of THIS item. Consider:
  - 90-100: text is crisp and clearly readable, price is unambiguous
  - 70-89: mostly readable but some characters are guessed (e.g. blurry, small font, unusual styling)
  - 50-69: significant guessing — partial text, obscured by fold/shadow, handwritten and hard to parse
  - 0-49: very uncertain — "unreadable" items, or names/prices that are mostly guessed

## Step 3 — Verify counts

After extracting all items, count the number of items in each text-box. Cross-check this by counting the number of distinct price lines (or price positions) visible for that text-box on the menu image. If the counts don't match, re-examine the image and correct any missed or duplicated items.

Return the verification as a "textbox_summary" array: one entry per text-box with:
- "textbox": the text-box number
- "category_name": the heading
- "items_extracted": how many items you extracted
- "price_lines_visible": how many distinct price lines you can count in the image for this text-box

## Output format

Return ONLY valid JSON (no markdown, no backticks):
{
  "items": [...],
  "categories": {"Cat1": 4, "Cat2": 9},
  "textbox_count": 5,
  "textbox_summary": [
    {"textbox": 1, "category_name": "Frisdranken", "items_extracted": 6, "price_lines_visible": 6},
    ...
  ]
}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16384,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image",
              source: { type: "base64", media_type: contentType, data: b64 },
            },
          ],
        },
      ],
    });

    const raw = (message.content[0]?.text || "").trim();
    const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[scan/extract-claude] JSON parse failed. Raw:", raw.slice(0, 500));
      return res.status(500).json({
        error: "Claude extraction returned invalid JSON",
        detail: parseErr.message,
        rawPreview: raw.slice(0, 300),
      });
    }

    res.json(parsed);
  } catch (e) {
    console.error("[scan/extract-claude]", e);
    res.status(500).json({ error: "Claude extraction failed", detail: e.message });
  }
});

// ── POST /api/scan/extract-twin ───────────────────────────────────────────
// Multi-image extraction for Digital Twin: format detection, items + positions, styling
router.post("/scan/extract-twin", isAuthenticated, upload.array("images", 10), async (req, res) => {
  try {
    // Accept either uploaded files (multipart) or imageUrls in body
    let imageContents = [];

    if (req.files && req.files.length > 0) {
      // Direct file upload → base64
      for (const file of req.files) {
        const b64 = file.buffer.toString("base64");
        const mime = file.mimetype || "image/jpeg";
        imageContents.push({
          type: "image_url",
          image_url: { url: `data:${mime};base64,${b64}`, detail: "high" },
        });
      }
    } else if (req.body.imageUrls) {
      // URLs (from prior upload to Supabase Storage)
      const urls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls];
      for (const url of urls) {
        imageContents.push({ type: "image_url", image_url: { url, detail: "high" } });
      }
    } else {
      return res.status(400).json({ error: "Provide images (multipart) or imageUrls (JSON)" });
    }

    const prompt = `You are an expert at analyzing physical menu cards from bars, restaurants, and cafés.

You are given photos of BOTH SIDES of a single menu card. Analyze them together.

## Task 1 — Format detection
Detect the fold type. Choose exactly ONE from:
a5-portrait, a4-portrait, a4-landscape, bifold, trifold, zfold, four-panel, a4-booklet, a5-booklet, gate-fold, accordion, roll-fold, double-parallel

Hints:
- Count visible panels per side and fold creases
- A5 is ~148×210mm, A4 is ~210×297mm
- Bifold = 1 fold (2 panels/side, 4 total), Trifold = 2 folds (3 panels/side, 6 total)
- Z-fold looks like trifold but panels zigzag
- Four-panel = 3 folds (4 panels/side, 8 total)
- Gate fold = 2 narrow flaps folding over a wider center
- Accordion = zigzag fold (4+ panels)

## Task 2 — Item extraction
For EACH menu item visible across ALL photos, extract:
- "item_name": exact name as printed
- "price": price in CENTS as integer (e.g. 350 for €3,50). null if not visible
- "category": the section/heading it falls under (exact text from menu)
- "description": any subtitle, ingredients list, or notes (empty string if none). For cocktails/food, include the ingredient list if shown.
- "abv": alcohol percentage as number if shown (null otherwise)
- "side": "front" or "back" (front = side with logo/cover)
- "panel": panel number on that side, counting left-to-right starting at 1
- "column_number": cumulative column number across the entire menu (left-to-right, top-to-bottom, continuing across sides)
- "position": position within the panel, starting at 1 from top
- "serve_format": how the item is served if indicated — one of "draft", "bottle", "can", "glass", or null if not specified

## Task 3 — Styling
Extract the visual design characteristics:
- "bg_color": background color of the menu paper as hex (e.g. "#ffffff", "#1a1a2e")
- "text_color": main body text color as hex
- "header_color": category/section header color as hex
- "accent_color": lines, borders, decorative elements color as hex
- "font_style": one of "serif", "sans-serif", "script", "display", "monospace"
- "has_logo": true/false — is there a logo or venue name on the cover?
- "venue_name": the venue/restaurant name if visible

Return ONLY valid JSON (no markdown, no backticks):
{
  "fold_type": "...",
  "panels_per_side": 3,
  "total_pages": 6,
  "styling": { "bg_color": "...", "text_color": "...", "header_color": "...", "accent_color": "...", "font_style": "...", "has_logo": true, "venue_name": "..." },
  "items": [
    { "item_name": "...", "price": 350, "category": "...", "description": "...", "abv": null, "side": "front", "panel": 1, "column_number": 1, "position": 1, "serve_format": null },
    ...
  ]
}`;

    const messages = [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          ...imageContents,
        ],
      },
    ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      max_tokens: 16384,
      temperature: 0.1,
    });

    const raw = completion.choices[0].message.content.trim();
    const jsonStr = raw.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const parsed = JSON.parse(jsonStr);

    res.json(parsed);
  } catch (e) {
    console.error("[scan/extract-twin]", e);
    res.status(500).json({ error: "Twin extraction failed", detail: e.message });
  }
});

// ── POST /api/scan/export ─────────────────────────────────────────────────
// Generate Excel in scan_images format and upload to Supabase Storage
router.post("/scan/export", isAuthenticated, async (req, res) => {
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
router.post("/scan/push-menu", isAuthenticated, async (req, res) => {
  let workdir = null;
  try {
    const { location = {}, images = [], items = [] } = req.body;
    if (!items.length) return res.status(400).json({ error: "No items to process" });

    // 1. Create temp workdir
    workdir = await mkdtemp(path.join(tmpdir(), "pipeline_run_"));

    // 2. Ensure venue exists in Supabase (auto-create if needed)
    const placeId = location.place_id || "";
    let businessId = null;

    if (placeId) {
      // Check if an assortment with this place_id already exists
      const { data: existing } = await supabase
        .from("assortments")
        .select("id, business_id")
        .eq("place_id", placeId)
        .limit(1);

      if (existing && existing.length > 0) {
        businessId = existing[0].business_id;
        console.log(`[push-menu] Found existing business ${businessId} for place_id ${placeId}`);
      } else {
        // Create a new business_info entry
        const venueName = location.name || "Unknown Venue";
        const uniqueEmail = `scan_${placeId.slice(0, 20)}_${Date.now()}@auto.local`;
        const { data: newBiz, error: bizErr } = await supabase
          .from("business_info")
          .insert({ horeca_name: venueName, email: uniqueEmail, password: "auto" })
          .select("id")
          .single();

        if (bizErr) {
          console.error("[push-menu] Failed to create business:", bizErr);
          return res.status(500).json({ error: "Failed to create venue", detail: bizErr.message });
        }

        businessId = newBiz.id;

        // Create an assortment for this business
        const { error: assErr } = await supabase
          .from("assortments")
          .insert({
            business_id: businessId,
            name: venueName,
            address: location.formatted_address || "",
            place_id: placeId,
            location_address_place_id: placeId,
            lat: location.latitude || null,
            lng: location.longitude || null,
            sort_order: 0,
          });

        if (assErr) console.error("[push-menu] Failed to create assortment:", assErr);
        console.log(`[push-menu] Created new business ${businessId} + assortment for "${venueName}"`);
      }
    }

    // 3. Look up the actual assortment_id for this business
    let assortmentId = null;
    if (businessId) {
      const { data: assortments } = await supabase
        .from("assortments")
        .select("id")
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true })
        .limit(1);
      if (assortments && assortments.length > 0) {
        assortmentId = assortments[0].id;
      }
    }

    // 4. Write a workdir-local MAPS_VENUE.xlsx with the venue mapping
    //    Use assortment_id as location_willy_id so the pipeline maps correctly
    const willyId = assortmentId || businessId;
    if (willyId && placeId) {
      const mapsWb = new ExcelJS.Workbook();
      const mapsWs = mapsWb.addWorksheet("Sheet1");
      mapsWs.addRow(["location_willy_id", "location_name", "location_address_place_id"]);
      mapsWs.addRow([willyId, location.name || "", placeId]);
      const mapsPath = path.join(workdir, "MAPS_VENUE.xlsx");
      await writeFile(mapsPath, Buffer.from(await mapsWb.xlsx.writeBuffer()));
    }

    // 4. Build the input Excel in the format ACTIVE_MATCHED_2_1.PY expects
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Sheet1");

    const headers = [
      "scan_session_id", "location_id", "category_name",
      "product_name", "product_description", "product_price", "key",
      "page_number", "textbox", "position_in_textbox", "serve_format",
    ];
    ws.addRow(headers);

    const sessionId = randomUUID();
    const locationId = placeId || randomUUID();

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
        item.page_number ?? "",
        item.textbox ?? "",
        item.position_in_textbox ?? "",
        item.serve_format ?? "",
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
