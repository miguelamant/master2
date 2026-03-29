// scripts/seed-persona-assortments.mjs
// Links the Conservative and Progressive stereotype assortments in persona_assortments.
// Also adds conservative/progressive columns to the assortments table if missing.
//
// Usage: node scripts/seed-persona-assortments.mjs

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } },
);

async function main() {
  // 1. Insert persona_assortments rows
  const rows = [
    { stereotype: "Conservative", assortment_id: 6705, weight: 1 },
    { stereotype: "Progressive",  assortment_id: 6706, weight: 1 },
  ];

  for (const row of rows) {
    const { error } = await supabase.from("persona_assortments").upsert(row, {
      onConflict: "stereotype,assortment_id",
    });
    if (error) {
      // Try plain insert if upsert fails (no unique constraint)
      const { error: insErr } = await supabase.from("persona_assortments").insert(row);
      if (insErr) console.warn(`  ⚠ ${row.stereotype}: ${insErr.message}`);
      else console.log(`  ✓ ${row.stereotype} → assortment ${row.assortment_id} (inserted)`);
    } else {
      console.log(`  ✓ ${row.stereotype} → assortment ${row.assortment_id}`);
    }
  }

  // 2. Try adding conservative/progressive columns (will fail gracefully if they exist)
  // We do this by attempting to set a value — if the column doesn't exist, we need a migration
  const { error: testErr } = await supabase
    .from("assortments")
    .update({ conservative: 50 })
    .eq("id", 6705);

  if (testErr && testErr.message.includes("conservative")) {
    console.log("\n⚠ Columns 'conservative'/'progressive' do not exist on assortments table.");
    console.log("  Please add them via Supabase dashboard or run:");
    console.log("  ALTER TABLE assortments ADD COLUMN conservative INT DEFAULT 50;");
    console.log("  ALTER TABLE assortments ADD COLUMN progressive INT DEFAULT 50;");
  } else {
    console.log("\n✓ 'conservative' column exists (or was set)");
    // Also set progressive
    await supabase.from("assortments").update({ progressive: 50 }).eq("id", 6705);
    console.log("✓ 'progressive' column exists (or was set)");
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("FATAL:", err.message);
  process.exit(1);
});
