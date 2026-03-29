#!/usr/bin/env python3
"""
ACTIVE_MAPPED_3_1.py

- Input A: ACTIVE_MATCH_CAT_2_3.xlsx (from workdir)
- Input B: REGISTRY.xlsx (from datadir, sheet PRODUCTS)
- Input C: wildcards_matching_general.xlsx (from datadir, sheet CATEGORY for VALIDATION_CATEGORY)
- Output: ACTIVE_MAPPED_3_1.xlsx (to workdir)
"""

from __future__ import annotations
import argparse
from pathlib import Path
import logging
import sys
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("active_mapped_3")

WANTED_CATS = {
    "BEER","BEERS","SOFT_DRINKS","OTHER","FRISDRANK","JUICES","HOMEMADE","TEA","COFFEE",
    "KOMBUCHA","CIDER","WHISKEY","JENEVER","WATER","MILKSHAKES","SMOOTHIES","PIZZAS","DFS",
    "FRIES","SAUZEN","GIN","SALADS","SOUP","BITES","DIGESTIF","SHOTS","ICE_CREAM",
    "SUPPLEMENTS","TEQUILA","SPIRITS","VODKA","SANDWICHES","DESSERT","BREAKFAST","PANCAKES",
    "PASTAS","TOASTS","BURGERS","FOOD","REFRESHING","WINE","HOT_DRINKS","COCKTAILS",
    "STRONG_DRINKS","APERITIF","OTHER","MEADS","BEER"
}

def str_col(s):
    if pd.isna(s):
        return ""
    return str(s).strip()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", type=str, default=None)
    parser.add_argument("--datadir", type=str, default=None)
    parser.add_argument("--active", type=str, default=None)
    parser.add_argument("--registry", type=str, default=None)
    parser.add_argument("--sheet", type=str, default="PRODUCTS")
    parser.add_argument("--wildcards", type=str, default=None)
    parser.add_argument("--wildcards_sheet", type=str, default="CATEGORY")
    args = parser.parse_args()

    workdir = Path(args.workdir) if args.workdir else Path.cwd()
    datadir = Path(args.datadir) if args.datadir else workdir

    active_path = Path(args.active).resolve() if args.active else workdir / "ACTIVE_MATCH_CAT_2_3.xlsx"
    registry_path = Path(args.registry).resolve() if args.registry else datadir / "REGISTRY.xlsx"
    wild_path = Path(args.wildcards).resolve() if args.wildcards else datadir / "wildcards_matching_general.xlsx"

    if not active_path.is_file():
        log.error("Active file not found: %s", active_path); sys.exit(1)
    if not registry_path.is_file():
        log.error("Registry not found: %s", registry_path); sys.exit(1)
    if not wild_path.is_file():
        log.error("Wildcards not found: %s", wild_path); sys.exit(1)

    log.info("Reading active: %s", active_path)
    df = pd.read_excel(active_path)

    if "Matched Key" not in df.columns:
        log.error("Missing 'Matched Key'"); sys.exit(1)

    cat_col = "Generic Category" if "Generic Category" in df.columns else (
        "Scanned Category" if "Scanned Category" in df.columns else None
    )
    if not cat_col:
        log.error("No category column found"); sys.exit(1)

    before = len(df)
    df[cat_col] = df[cat_col].astype(str).str.strip().str.upper()
    df = df[df[cat_col].isin(WANTED_CATS)].copy()
    log.info("Filtered: %d -> %d rows", before, len(df))

    log.info("Reading registry: %s (sheet '%s')", registry_path, args.sheet)
    reg = pd.read_excel(registry_path, sheet_name=args.sheet, dtype={"id_product": "Int64"})
    if not {"id_product", "name"}.issubset(reg.columns):
        log.error("Registry must have id_product, name"); sys.exit(1)

    df["Matched Key"] = df["Matched Key"].apply(str_col)
    reg = reg[["id_product", "name"]].copy()
    reg["name"] = reg["name"].apply(str_col)
    reg = reg.drop_duplicates(subset=["name"], keep="first")

    merged = df.merge(reg, how="left", left_on="Matched Key", right_on="name")
    merged = merged.drop(columns=["name"])
    cols = list(merged.columns)
    if "id_product" not in cols:
        merged["id_product"] = pd.NA
    cols.remove("id_product")
    if "Matched Key" in cols:
        cols.insert(cols.index("Matched Key") + 1, "id_product")
    else:
        cols.append("id_product")
    merged = merged[cols]

    log.info("Reading validation categories: %s", wild_path)
    wc = pd.read_excel(wild_path, sheet_name=args.wildcards_sheet)
    if not {"CATEGORY", "VALIDATION_CATEGORY"}.issubset(wc.columns):
        log.error("Wildcards must have CATEGORY, VALIDATION_CATEGORY"); sys.exit(1)

    wc_map = (
        wc.loc[:, ["CATEGORY", "VALIDATION_CATEGORY"]]
          .assign(CATEGORY=lambda x: x["CATEGORY"].astype(str).str.strip().str.upper(),
                  VALIDATION_CATEGORY=lambda x: x["VALIDATION_CATEGORY"].astype(str).str.strip())
          .drop_duplicates(subset=["CATEGORY"], keep="first")
          .set_index("CATEGORY")["VALIDATION_CATEGORY"]
          .to_dict()
    )

    merged["Validation Category"] = merged[cat_col].map(wc_map)

    col_order = list(merged.columns)
    if "Validation Category" in col_order:
        col_order.remove("Validation Category")
        insert_at = col_order.index(cat_col) + 1 if cat_col in col_order else len(col_order)
        col_order.insert(insert_at, "Validation Category")
        merged = merged[col_order]

    out_path = workdir / "ACTIVE_MAPPED_3_1.xlsx"
    log.info("Writing: %s", out_path)
    merged.to_excel(out_path, index=False)
    log.info("Done. Rows: %d | IDs found: %d", len(merged), merged["id_product"].notna().sum())

if __name__ == "__main__":
    main()
