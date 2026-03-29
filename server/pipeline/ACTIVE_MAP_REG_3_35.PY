#!/usr/bin/env python3
"""
ACTIVE_MAP_REG_3_35.py

Matches 'Matched Key' against multiple registry sheets.
- Input: ACTIVE_MAP_LOC_3_3.xlsx (from workdir)
- Registry: REGISTRY.xlsx (from datadir)
- Output: ACTIVE_MAP_REG_3_35.xlsx (to workdir)
"""

from __future__ import annotations
import argparse
from pathlib import Path
import sys
import logging
import pandas as pd
import unicodedata
import re

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("map_reg_multi_keys_only")

REG_SHEETS = ["BEERS_REG_RAW", "SOFT_REG_RAW", "EXCLUDED_REG_RAW"]
REG_CATEGORY_MAP = {
    "BEERS_REG_RAW": "BEER",
    "SOFT_REG_RAW": "REFRESHING",
    "EXCLUDED_REG_RAW": "EXCLUDED",
}

_WS = re.compile(r"\s+")
_PIPE = re.compile(r"\s*\|\s*")

def _norm_key(s: object) -> str:
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return ""
    s = str(s)
    s = unicodedata.normalize("NFKC", s)
    s = s.replace("\u00A0", " ").replace("\u200B", "")
    s = _PIPE.sub(" | ", s)
    s = _WS.sub(" ", s).strip()
    return s.upper()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", type=str, default=None)
    parser.add_argument("--datadir", type=str, default=None)
    parser.add_argument("--active", default=None)
    parser.add_argument("--registry", default=None)
    parser.add_argument("--sheets", nargs="*", default=None)
    args = parser.parse_args()

    workdir = Path(args.workdir) if args.workdir else Path.cwd()
    datadir = Path(args.datadir) if args.datadir else workdir

    active_path = Path(args.active).resolve() if args.active else workdir / "ACTIVE_MAP_LOC_3_3.xlsx"
    reg_path = Path(args.registry).resolve() if args.registry else datadir / "REGISTRY.xlsx"
    out_path = workdir / "ACTIVE_MAP_REG_3_35.xlsx"

    if not active_path.is_file():
        log.error("Active not found: %s", active_path); sys.exit(1)
    if not reg_path.is_file():
        log.error("Registry not found: %s", reg_path); sys.exit(1)

    sheets_to_try = args.sheets if args.sheets else REG_SHEETS

    log.info("Reading active: %s", active_path)
    df = pd.read_excel(active_path)
    if "Matched Key" not in df.columns:
        log.error("Missing 'Matched Key'"); sys.exit(1)

    df["__order"] = range(len(df))
    df["Matched Key"] = df["Matched Key"].apply(_norm_key)

    merged = df.copy()
    if "BOTTOM_SSG" not in merged.columns:
        merged["BOTTOM_SSG"] = pd.Series(pd.NA, dtype="string")
    merged["registry_source"] = merged.get("registry_source", "NONE")
    merged["REG_CATEGORY"] = merged.get("REG_CATEGORY", pd.NA)

    eligible_mask = merged["Matched Key"].ne("") & merged["Matched Key"].notna()
    merged.loc[~eligible_mask, ["BOTTOM_SSG", "registry_source", "REG_CATEGORY"]] = [pd.NA, "NONE", pd.NA]
    unmatched_mask = eligible_mask & merged["BOTTOM_SSG"].isna()

    for sheet in sheets_to_try:
        need = int(unmatched_mask.sum())
        if need == 0:
            break

        log.info("Reading registry: %s [%s] (need: %d)", reg_path, sheet, need)
        reg = pd.read_excel(reg_path, sheet_name=sheet)

        if not {"KEY", "BOTTOM_SSG"}.issubset(reg.columns):
            log.error("Sheet '%s' must have KEY, BOTTOM_SSG", sheet); sys.exit(1)

        reg = reg[["KEY", "BOTTOM_SSG"]].copy()
        reg["KEY"] = reg["KEY"].apply(_norm_key)
        reg = reg.drop_duplicates(subset=["KEY"], keep="first")

        todo = merged.loc[unmatched_mask, ["Matched Key"]].copy()
        match = todo.merge(reg, how="left", left_on="Matched Key", right_on="KEY", validate="m:1")

        hits = match["BOTTOM_SSG"].notna().values
        if hits.any():
            idx = todo.index[hits]
            merged.loc[idx, "BOTTOM_SSG"] = match.loc[hits, "BOTTOM_SSG"].astype("string").values
            merged.loc[idx, "registry_source"] = sheet
            merged.loc[idx, "REG_CATEGORY"] = REG_CATEGORY_MAP.get(sheet, sheet)
            log.info("Matched %d rows on %s", len(idx), sheet)

        unmatched_mask = eligible_mask & merged["BOTTOM_SSG"].isna()

    merged = merged.sort_values("__order", kind="mergesort").drop(columns="__order")

    log.info("Writing: %s", out_path)
    merged.to_excel(out_path, index=False)
    log.info("Done. Rows: %d | Matched: %d", len(merged), int(merged["BOTTOM_SSG"].notna().sum()))

if __name__ == "__main__":
    main()
