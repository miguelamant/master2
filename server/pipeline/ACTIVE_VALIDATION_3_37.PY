#!/usr/bin/env python3
"""
ACTIVE_VALIDATION_3_37.PY

Compute VALIDATION_CATEGORY_2 from percentages, validate against Validation Category and REG_CATEGORY.
- Input: ACTIVE_VALIDATION_3_36.xlsx (from workdir)
- Output: ACTIVE_VALIDATION_3_37.xlsx (to workdir)
"""

from __future__ import annotations
import argparse
from pathlib import Path
import sys
import logging
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("validation_3_37")

CATS = ["BEER", "REFRESHING", "EXCLUDED"]

def norm_cat(x: object) -> str:
    if x is None or (isinstance(x, float) and pd.isna(x)):
        return ""
    return str(x).strip().upper()

def pick_validation_from_percents(row: pd.Series, threshold: float) -> str:
    vals = {c: float(row.get(c, 0.0) or 0.0) for c in CATS}
    max_val = max(vals.values()) if vals else 0.0
    if max_val <= threshold:
        return "NONE"
    winners = [c for c, v in vals.items() if v == max_val]
    return winners[0] if len(winners) == 1 else "MIXED"

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", type=str, default=None)
    parser.add_argument("--datadir", type=str, default=None)
    parser.add_argument("--input", default=None)
    parser.add_argument("--output", default=None)
    parser.add_argument("--threshold", type=float, default=40.0)
    args = parser.parse_args()

    workdir = Path(args.workdir) if args.workdir else Path.cwd()
    in_path = Path(args.input).resolve() if args.input else workdir / "ACTIVE_VALIDATION_3_36.xlsx"
    out_path = Path(args.output).resolve() if args.output else workdir / "ACTIVE_VALIDATION_3_37.xlsx"

    if not in_path.is_file():
        log.error("Input not found: %s", in_path); sys.exit(1)

    log.info("Reading: %s", in_path)
    df = pd.read_excel(in_path)

    needed = set(CATS + ["NONE"])
    missing = [c for c in needed if c not in df.columns]
    if missing:
        log.error("Missing columns: %s", missing); sys.exit(1)

    df["__order"] = np.arange(len(df))
    df["VALIDATION_CATEGORY_2"] = df.apply(pick_validation_from_percents, axis=1, threshold=args.threshold)

    v1 = df.get("Validation Category", pd.Series([""] * len(df))).apply(norm_cat)
    v2 = df.get("REG_CATEGORY", pd.Series([""] * len(df))).apply(norm_cat)
    v3 = df["VALIDATION_CATEGORY_2"].apply(norm_cat)

    all_same = (v1 == v2) & (v2 == v3) & (v1 != "")

    df["UNVALID"] = pd.NA
    if "Matched Key" not in df.columns:
        log.error("Missing 'Matched Key'"); sys.exit(1)

    df.loc[~all_same, "UNVALID"] = df.loc[~all_same, "Matched Key"]
    df.loc[~all_same, "Matched Key"] = ""

    df = df.sort_values("__order", kind="mergesort").drop(columns="__order")

    log.info("Validated: %d / %d", int(all_same.sum()), len(df))
    log.info("Writing: %s", out_path)
    df.to_excel(out_path, index=False)
    log.info("Done.")

if __name__ == "__main__":
    main()
