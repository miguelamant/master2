// server/routes/explain.routes.js
import { Router } from "express";
import OpenAI from "openai";

const router = Router();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

router.post("/explain-bucket", async (req, res) => {
  try {
    const { label = "", subsubcategories = [], section = "beers" } = req.body;
    const catList = subsubcategories.length ? subsubcategories.join(", ") : label;

    const prompt =
      `You are a knowledgeable bar consultant. ` +
      `A beverage bucket called "${label}" in the "${section}" section groups these styles: ${catList}. ` +
      `Write a concise 2-3 sentence explanation for a bar owner: ` +
      `what unifies this group, what styles it contains, and 1-2 well-known example brands. ` +
      `English only. No bullet points.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 160,
    });

    res.json({ text: completion.choices[0].message.content.trim() });
  } catch (err) {
    console.error("[explain-bucket]", err.message);
    res.status(500).json({ error: "AI explanation unavailable" });
  }
});

router.post('/explain-recommendation', async (req, res) => {
    try {
        const { label, displayLabel, delta, actual, recommended, bucketBenchmarks = {},
                personaWeights = {}, pairedRec = null } = req.body;
        const bucketName = displayLabel || label;
        const personas = ['Belgian', 'French', 'German', 'Dutch'];

        const gains = personas.map(p => {
            const w = (personaWeights[p] ?? 25) / 100;
            const B = Number(bucketBenchmarks[p] ?? 0);
            let gain;
            if (delta > 0) {
                const gapBefore = Math.max(0, B - actual);
                const gapAfter  = Math.max(0, B - recommended);
                gain = gapBefore - gapAfter;
            } else {
                const exBefore = Math.max(0, actual - B);
                const exAfter  = Math.max(0, recommended - B);
                gain = exBefore - exAfter;
            }
            return { name: p, pct: Math.round(w * 100), gain: Math.round(gain * 10) / 10, weightedGain: gain * w, B };
        }).filter(p => p.weightedGain > 0.005)
          .sort((a, b) => b.weightedGain - a.weightedGain);

        if (gains.length === 0) {
            return res.json({ text: `Balances your ${bucketName} count relative to current benchmarks.` });
        }

        const top = gains[0];
        const secondary = gains[1];
        const secondaryClause = secondary ? ` and ${secondary.name} (${secondary.pct}%)` : '';

        const b = top.B.toFixed(1);
        let text;
        if (delta > 0) {
            text = `${top.name} customers (${top.pct}% of your mix) benchmark at ${b} ${bucketName} — you currently have ${actual}. Adding one should increase satisfaction.`;
        } else {
            text = `${top.name} customers (${top.pct}% of your mix) only benchmark at ${b} ${bucketName} — you currently have ${actual}. Removing one should increase satisfaction.`;
        }

        res.json({ text });
    } catch (err) {
        console.error('[explain-recommendation]', err.message);
        res.status(500).json({ error: 'AI explanation unavailable' });
    }
});

export default router;
