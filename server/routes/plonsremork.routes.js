import { Router } from "express";
import { supabase } from "../integrations/supabase.js";
import { sendPlonsremorkNotificatie, sendPlonsremorkBevestiging } from "../services/email.service.js";

const router = Router();

router.get("/plonsremork/bezet", async (req, res) => {
  const { data, error } = await supabase
    .from("plonsremork_reservaties")
    .select("start_datum, eind_datum")
    .in("status", ["aangevraagd", "bevestigd"]);

  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post("/plonsremork/reservatie", async (req, res) => {
  const { naam, email, telefoon, type, periode, start_datum, eind_datum, adres, bericht } = req.body;

  if (!naam || !email || !telefoon || !type || !periode || !start_datum || !eind_datum) {
    return res.status(400).json({ error: "Verplichte velden ontbreken." });
  }
  if (type === "levering" && !adres) {
    return res.status(400).json({ error: "Adres is verplicht bij levering." });
  }

  // Check voor overlappende reservaties
  // Overlap als: bestaande.start <= nieuwe.eind EN bestaande.eind >= nieuwe.start
  const { data: conflicten } = await supabase
    .from("plonsremork_reservaties")
    .select("id")
    .in("status", ["aangevraagd", "bevestigd"])
    .lte("start_datum", eind_datum)
    .gte("eind_datum", start_datum);

  if (conflicten && conflicten.length > 0) {
    return res.status(409).json({ error: "Die periode is al gereserveerd. Kies een andere datum." });
  }

  const { data, error } = await supabase
    .from("plonsremork_reservaties")
    .insert([{ naam, email, telefoon, type, periode, start_datum, eind_datum, adres, bericht }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  try {
    await Promise.all([
      sendPlonsremorkBevestiging(email, naam, data),
      sendPlonsremorkNotificatie(data),
    ]);
  } catch (emailErr) {
    console.error("[plonsremork] email fout:", emailErr.message);
  }

  res.json({ success: true, id: data.id });
});

export default router;
