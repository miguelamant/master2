#!/usr/bin/env python3
"""
ACTIVE_MAP_LOC_3_3.py

Map Google Maps place_id -> Willy venue_id.
- Input: ACTIVE_MAPPED_3_1.xlsx (from workdir)
- Maps: MAPS_VENUE.xlsx (from datadir)
- Output: ACTIVE_MAP_LOC_3_3.xlsx (to workdir)
"""

from __future__ import annotations
import argparse
from pathlib import Path
import sys
import logging
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("map_loc")

def clean_place_id(x) -> str:
    if pd.isna(x):
        return ""
    return str(x).strip()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", type=str, default=None)
    parser.add_argument("--datadir", type=str, default=None)
    parser.add_argument("--input", "-i", default=None)
    parser.add_argument("--maps", "-m", default=None)
    parser.add_argument("--maps-sheet", default=0)
    args = parser.parse_args()

    workdir = Path(args.workdir) if args.workdir else Path.cwd()
    datadir = Path(args.datadir) if args.datadir else workdir

    in_path = Path(args.input).resolve() if args.input else workdir / "ACTIVE_MAPPED_3_1.xlsx"
    maps_path = Path(args.maps).resolve() if args.maps else datadir / "MAPS_VENUE.xlsx"
    out_path = workdir / "ACTIVE_MAP_LOC_3_3.xlsx"

    if not in_path.is_file():
        log.error("Input not found: %s", in_path); sys.exit(1)
    if not maps_path.is_file():
        log.error("Mapping not found: %s", maps_path); sys.exit(1)

    log.info("Reading input: %s", in_path)
    df = pd.read_excel(in_path)

    key_col = None
    if "location_id" in df.columns:
        key_col = "location_id"
    elif "location_address_place_id" in df.columns:
        key_col = "location_address_place_id"
    else:
        log.error("No key column found (need location_id or location_address_place_id)"); sys.exit(1)

    log.info("Reading mapping: %s", maps_path)
    map_df = pd.read_excel(maps_path, sheet_name=args.maps_sheet)

    required = {"location_willy_id", "location_name", "location_address_place_id"}
    if not required.issubset(set(map_df.columns)):
        log.error("MAPS_VENUE must contain: %s", required); sys.exit(1)

    df[key_col] = df[key_col].apply(clean_place_id)
    map_df = map_df[["location_address_place_id", "location_willy_id"]].copy()
    map_df["location_address_place_id"] = map_df["location_address_place_id"].apply(clean_place_id)
    map_df = map_df.drop_duplicates(subset=["location_address_place_id"], keep="first")

    merged = df.merge(
        map_df, how="left", left_on=key_col, right_on="location_address_place_id", validate="m:1"
    ).drop(columns=["location_address_place_id"])

    if "location_willy_id" not in merged.columns:
        merged["location_willy_id"] = pd.NA

    cols = list(merged.columns)
    cols.remove("location_willy_id")
    if key_col in cols:
        insert_idx = cols.index(key_col) + 1
        cols.insert(insert_idx, "location_willy_id")
    else:
        cols.append("location_willy_id")
    merged = merged[cols]

    log.info("Writing: %s", out_path)
    merged.to_excel(out_path, index=False)
    log.info("Done. Rows: %d | Willy IDs matched: %d", len(merged), merged["location_willy_id"].notna().sum())

if __name__ == "__main__":
    main()
