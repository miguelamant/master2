#!/usr/bin/env python3
"""
ACTIVE_DEDUPED_2_2.py  (temporary pass-through)

- Reads ACTIVE_MATCHED_2_1.xlsx from workdir
- DOES NOT DEDUPE (no-op)
- Keeps only selected columns
- Writes ACTIVE_DEDUPED_2_2.xlsx to workdir
"""

from __future__ import annotations
import argparse
from pathlib import Path
import sys
import logging
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("dedupe_passthrough")

KEEP_COLS = [
    "location_id",
    "Scanned Product Name",
    "Scanned Category",
    "Price (raw)",
    "Presentation",
    "Format (cl)",
    "Matched Key",
    "Position In Group",
    "Group Size",
    "DT_page_number",
    "DT_column_number",
    "DT_position_in_column",
    "DT_description",
    "DT_serve_format",
]

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", type=str, default=None)
    parser.add_argument("--datadir", type=str, default=None)
    parser.add_argument("-i", "--input", help="Input filename")
    args = parser.parse_args()

    workdir = Path(args.workdir) if args.workdir else Path.cwd()

    in_path = Path(args.input).resolve() if args.input else workdir / "ACTIVE_MATCHED_2_1.xlsx"
    if not in_path.exists():
        # fallback: latest beer_match_*.xlsx
        cand = sorted(workdir.glob("beer_match_*.xlsx"), key=lambda p: p.stat().st_mtime, reverse=True)
        in_path = cand[0] if cand else in_path

    out_path = workdir / "ACTIVE_DEDUPED_2_2.xlsx"

    if not in_path.exists():
        log.error("Input not found: %s", in_path)
        sys.exit(1)

    log.info("Reading: %s", in_path)
    df = pd.read_excel(in_path)

    for col in ("location_id", "Matched Key"):
        if col not in df.columns:
            log.error("Missing required column: %s", col)
            sys.exit(1)

    keep = [c for c in KEEP_COLS if c in df.columns]
    df = df[keep]

    log.info("Pass-through mode. Rows: %d", len(df))
    log.info("Writing: %s", out_path)
    df.to_excel(out_path, index=False)
    log.info("Done.")

if __name__ == "__main__":
    main()
