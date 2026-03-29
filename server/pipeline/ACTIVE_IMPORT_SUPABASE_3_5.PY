#!/usr/bin/env python3
"""
ACTIVE_IMPORT_SUPABASE_3_5.PY

Final step: converts ACTIVE_EXPORT_3_4.xlsx and imports directly into
the Supabase `menu_items` table.

- Input : ACTIVE_EXPORT_3_4.xlsx (from workdir)
- Output: ACTIVE_IMPORT_SUPABASE_3_5.xlsx / .csv (to workdir)
- Action: Inserts new rows into Supabase, skipping duplicates and invalid FKs
"""

from __future__ import annotations
import json
import logging, sys, os
from pathlib import Path
import pandas as pd
from supabase import create_client

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("import_supabase_3_5")

BATCH_SIZE = 500


def load_assortment_lookup(path: Path) -> dict[int, int]:
    lookup_path = path / "ASSORTMENT_LOOKUP.xlsx"
    if lookup_path.is_file():
        log.info("Reading assortment lookup: %s", lookup_path)
        df = pd.read_excel(lookup_path)
        biz_col = next((c for c in df.columns if "business" in c.lower()), None)
        ass_col = next((c for c in df.columns if "assortment" in c.lower()), None)
        if biz_col and ass_col:
            return dict(zip(df[biz_col].astype(int), df[ass_col].astype(int)))

    reg_path = path / "REGISTRY.xlsx"
    if reg_path.is_file():
        try:
            df = pd.read_excel(reg_path, sheet_name="ASSORTMENTS")
            biz_col = next((c for c in df.columns if "business" in c.lower()), None)
            ass_col = next((c for c in df.columns if c.lower() in ("id", "assortment_id")), None)
            if biz_col and ass_col:
                log.info("Reading assortment lookup from REGISTRY.xlsx [ASSORTMENTS]")
                sort_col = next((c for c in df.columns if "sort" in c.lower()), None)
                if sort_col:
                    df = df.sort_values(sort_col)
                return dict(df.drop_duplicates(biz_col, keep="first")[[biz_col, ass_col]]
                            .set_index(biz_col)[ass_col].astype(int))
        except Exception:
            pass

    log.warning("No assortment lookup found. Using business_id as assortment_id.")
    return {}


def connect_supabase():
    """Connect using env vars (works both locally with .env and on server)."""
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_KEY")
    if not url or not key:
        # Fallback: try loading from .env file
        try:
            from dotenv import dotenv_values
            for env_path in [Path.cwd() / ".env", Path(__file__).resolve().parent.parent.parent / ".env"]:
                if env_path.is_file():
                    env = dotenv_values(env_path)
                    url = url or env.get("SUPABASE_URL")
                    key = key or env.get("SUPABASE_SERVICE_KEY")
                    if url and key:
                        break
        except ImportError:
            pass
    if not url or not key:
        log.error("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
        sys.exit(1)
    return create_client(url, key)


def fetch_valid_ids(sb, table: str, id_col: str) -> set[int]:
    ids: set[int] = set()
    page_size = 1000
    offset = 0
    while True:
        resp = sb.table(table).select(id_col).range(offset, offset + page_size - 1).execute()
        rows = resp.data
        if not rows:
            break
        ids.update(r[id_col] for r in rows)
        if len(rows) < page_size:
            break
        offset += page_size
    return ids


def fetch_existing_pairs(sb, assortment_ids: set[int]) -> set[tuple[int, int]]:
    pairs: set[tuple[int, int]] = set()
    for aid in sorted(assortment_ids):
        offset = 0
        page_size = 1000
        while True:
            resp = (sb.table("menu_items")
                    .select("assortment_id,product_id")
                    .eq("assortment_id", aid)
                    .range(offset, offset + page_size - 1)
                    .execute())
            rows = resp.data
            if not rows:
                break
            pairs.update((r["assortment_id"], r["product_id"]) for r in rows)
            if len(rows) < page_size:
                break
            offset += page_size
    return pairs


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", type=str, default=None)
    parser.add_argument("--datadir", type=str, default=None)
    args = parser.parse_args()

    workdir = Path(args.workdir) if args.workdir else Path.cwd()
    datadir = Path(args.datadir) if args.datadir else workdir

    in_path = workdir / "ACTIVE_EXPORT_3_4.xlsx"
    out_path = workdir / "ACTIVE_IMPORT_SUPABASE_3_5.xlsx"

    if not in_path.is_file():
        log.error("Input not found: %s", in_path)
        sys.exit(1)

    # -- Phase 1: Transform --
    log.info("Reading input: %s", in_path)
    df = pd.read_excel(in_path)
    log.info("   Rows: %d | Columns: %s", len(df), list(df.columns))

    required = {"business_id", "product_id", "price"}
    missing = required - set(df.columns)
    if missing:
        log.error("Missing columns: %s", missing)
        sys.exit(1)

    lookup = load_assortment_lookup(datadir)

    if lookup:
        df["assortment_id"] = df["business_id"].map(lookup)
        unmapped = df["assortment_id"].isna().sum()
        if unmapped > 0:
            log.warning("%d rows have no assortment_id mapping", unmapped)
    else:
        df["assortment_id"] = df["business_id"]

    before = len(df)
    df = df.dropna(subset=["product_id", "assortment_id"])
    df["product_id"] = df["product_id"].astype(int)
    df["assortment_id"] = df["assortment_id"].astype(int)
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df = df.dropna(subset=["price"])
    df = df.drop_duplicates(subset=["assortment_id", "product_id"], keep="first")
    after = len(df)
    log.info("   Cleaned: %d -> %d rows", before, after)

    export = df[["assortment_id", "product_id", "price"]].copy()

    log.info("Writing: %s", out_path)
    export.to_excel(out_path, index=False)
    csv_path = out_path.with_suffix(".csv")
    export.to_csv(csv_path, index=False)

    # -- Phase 2: Supabase import --
    log.info("Connecting to Supabase...")
    sb = connect_supabase()

    log.info("Fetching valid assortment IDs...")
    valid_assortments = fetch_valid_ids(sb, "assortments", "id")
    log.info("   %d assortments in DB", len(valid_assortments))

    log.info("Fetching valid product IDs...")
    valid_products = fetch_valid_ids(sb, "products", "id_product")
    log.info("   %d products in DB", len(valid_products))

    csv_assortments = set(export["assortment_id"].unique())
    csv_products = set(export["product_id"].unique())

    bad_assortments = csv_assortments - valid_assortments
    bad_products = csv_products - valid_products

    if bad_assortments:
        log.warning("Invalid assortment_ids: %s", sorted(bad_assortments))
    if bad_products:
        log.warning("Invalid product_ids: %s", sorted(bad_products))

    valid_mask = (export["assortment_id"].isin(valid_assortments) &
                  export["product_id"].isin(valid_products))
    skipped_fk = (~valid_mask).sum()
    export = export[valid_mask].copy()

    if export.empty:
        log.info("Nothing to import.")
        result = {"inserted": 0, "skipped_fk": int(skipped_fk), "skipped_dup": 0, "total": after}
        print(f"PIPELINE_RESULT:{json.dumps(result)}")
        return

    log.info("Fetching existing menu_items...")
    existing_pairs = fetch_existing_pairs(sb, csv_assortments - bad_assortments)

    to_insert = export[
        ~export.apply(lambda r: (int(r["assortment_id"]), int(r["product_id"])) in existing_pairs, axis=1)
    ].copy()
    skipped_dup = len(export) - len(to_insert)

    if to_insert.empty:
        log.info("All rows already exist. Nothing to insert.")
        result = {"inserted": 0, "skipped_fk": int(skipped_fk), "skipped_dup": int(skipped_dup), "total": after}
        print(f"PIPELINE_RESULT:{json.dumps(result)}")
        return

    records = to_insert.to_dict("records")
    for r in records:
        r["assortment_id"] = int(r["assortment_id"])
        r["product_id"] = int(r["product_id"])
        r["price"] = round(float(r["price"]), 2)

    inserted = 0
    for i in range(0, len(records), BATCH_SIZE):
        batch = records[i:i + BATCH_SIZE]
        resp = sb.table("menu_items").insert(batch).execute()
        inserted += len(resp.data)
        log.info("   Inserted batch %d-%d (%d rows)", i + 1, min(i + BATCH_SIZE, len(records)), len(resp.data))

    log.info("=== Import complete ===")
    log.info("   Inserted: %d | Skipped FK: %d | Skipped dup: %d", inserted, skipped_fk, skipped_dup)

    # Print machine-readable result for the Express endpoint to parse
    result = {"inserted": inserted, "skipped_fk": int(skipped_fk), "skipped_dup": int(skipped_dup), "total": after}
    print(f"PIPELINE_RESULT:{json.dumps(result)}")


if __name__ == "__main__":
    main()
