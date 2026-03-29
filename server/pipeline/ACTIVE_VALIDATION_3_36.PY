#!/usr/bin/env python3
"""
ACTIVE_VALIDATION_3_36.PY

Compute per-group category percentages (BEER/REFRESHING/EXCLUDED/NONE).
- Input: ACTIVE_MAP_REG_3_35.xlsx (from workdir)
- Output: ACTIVE_VALIDATION_3_36.xlsx (to workdir)
"""

from __future__ import annotations
import argparse
from pathlib import Path
import sys
import logging
import pandas as pd
import numpy as np

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("validation_3_36")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", type=str, default=None)
    parser.add_argument("--datadir", type=str, default=None)
    parser.add_argument("--input", default=None)
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    workdir = Path(args.workdir) if args.workdir else Path.cwd()
    in_path = Path(args.input).resolve() if args.input else workdir / "ACTIVE_MAP_REG_3_35.xlsx"
    out_path = Path(args.output).resolve() if args.output else workdir / "ACTIVE_VALIDATION_3_36.xlsx"

    if not in_path.is_file():
        log.error("Input not found: %s", in_path); sys.exit(1)

    log.info("Reading: %s", in_path)
    df = pd.read_excel(in_path)

    required = {"Position In Group", "Group Size", "REG_CATEGORY"}
    if not required.issubset(df.columns):
        log.error("Missing columns: %s", required - set(df.columns)); sys.exit(1)

    df["__order"] = np.arange(len(df))

    reg = df["REG_CATEGORY"].astype(str).str.strip().str.upper()
    reg = reg.replace({"NAN": "", "NONE": ""})
    bucket = pd.Series("NONE", index=df.index, dtype="string")
    bucket[reg == "BEER"] = "BEER"
    bucket[reg == "REFRESHING"] = "REFRESHING"
    bucket[reg == "EXCLUDED"] = "EXCLUDED"
    df["__bucket"] = bucket

    pos = pd.to_numeric(df["Position In Group"], errors="coerce")
    grp_id = (pos == 1).cumsum()
    if grp_id.iloc[0] == 0:
        grp_id += 1
    df["__grp"] = grp_id

    counts = (
        df.groupby(["__grp", "__bucket"], dropna=False)
          .size()
          .unstack("__bucket", fill_value=0)
    )
    for col in ("BEER", "REFRESHING", "EXCLUDED", "NONE"):
        if col not in counts.columns:
            counts[col] = 0
    counts = counts[["BEER", "REFRESHING", "EXCLUDED", "NONE"]]

    denom = (
        pd.to_numeric(df["Group Size"], errors="coerce")
        .groupby(df["__grp"], sort=False)
        .first()
        .astype(float)
    )
    actual_size = df.groupby("__grp", sort=False).size().astype(float)
    denom = denom.fillna(actual_size)
    denom = denom.where(denom > 0, other=actual_size)

    pct = (counts.div(denom, axis=0) * 100.0).round(1)
    pct = pct.reindex(df["__grp"].unique(), fill_value=0.0)

    df = df.join(pct, on="__grp", rsuffix="_pct")
    df = df.sort_values("__order", kind="mergesort").drop(columns=["__order", "__grp", "__bucket"])

    log.info("Writing: %s", out_path)
    df.to_excel(out_path, index=False)
    log.info("Done. Rows: %d | Groups: %d", len(df), pct.shape[0])

if __name__ == "__main__":
    main()
