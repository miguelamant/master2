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

export default router;
