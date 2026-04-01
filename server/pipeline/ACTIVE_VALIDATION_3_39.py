#!/usr/bin/env python3
"""
ACTIVE_VALIDATION_3_39.PY

Add 'venue_name' by looking up location_willy_id in MAPS_VENUE.xlsx.
- Input: ACTIVE_VALIDATION_3_38.xlsx (from workdir)
- Maps: MAPS_VENUE.xlsx (from datadir)
- Output: ACTIVE_VALIDATION_3_39.xlsx (to workdir)
"""

from __future__ import annotations
import argparse
from pathlib import Path
import sys
import logging
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("validation_3_39")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", type=str, default=None)
    parser.add_argument("--datadir", type=str, default=None)
    parser.add_argument("--input", default=None)
    parser.add_argument("--output", default=None)
    parser.add_argument("--venue-map", default=None)
    args = parser.parse_args()

    workdir = Path(args.workdir) if args.workdir else Path.cwd()
    datadir = Path(args.datadir) if args.datadir else workdir

    in_path = Path(args.input).resolve() if args.input else workdir / "ACTIVE_VALIDATION_3_38.xlsx"
    out_path = Path(args.output).resolve() if args.output else workdir / "ACTIVE_VALIDATION_3_39.xlsx"
    # Check workdir first (run-specific), then datadir (global)
    if args.venue_map:
        venue_path = Path(args.venue_map).resolve()
    elif (workdir / "MAPS_VENUE.xlsx").is_file():
        venue_path = workdir / "MAPS_VENUE.xlsx"
    else:
        venue_path = datadir / "MAPS_VENUE.xlsx"

    if not in_path.is_file():
        log.error("Input not found: %s", in_path); sys.exit(1)
    if not venue_path.is_file():
        log.error("Venue map not found: %s", venue_path); sys.exit(1)

    log.info("Reading: %s", in_path)
    df = pd.read_excel(in_path)

    log.info("Reading venue map: %s", venue_path)
    venue_df = pd.read_excel(venue_path)

    venue_map = venue_df.set_index("location_willy_id")["location_name"]
    df["venue_name"] = df["location_willy_id"].map(venue_map)

    matched = df["venue_name"].notna().sum()
    log.info("Matched %d / %d rows", matched, len(df))

    log.info("Writing: %s", out_path)
    df.to_excel(out_path, index=False)
    log.info("Done.")

if __name__ == "__main__":
    main()
