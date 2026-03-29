#!/usr/bin/env python3
"""
ACTIVE_MATCH_CAT_2_3.py

- Read ACTIVE_DEDUPED_2_2.xlsx from workdir
- Map 'Scanned Category' -> 'Generic Category' using wildcards from datadir
- Write ACTIVE_MATCH_CAT_2_3.xlsx to workdir
"""

from __future__ import annotations
import argparse
from pathlib import Path
import logging
import sys
import unicodedata
import re
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("match_cat_allcols")

def _strip_accents(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")

def normalize(s: str) -> str:
    if not isinstance(s, str):
        return ""
    s = _strip_accents(s.strip()).lower()
    s = re.sub(r"[^\w]+", "_", s)
    s = re.sub(r"_+", "_", s).strip("_")
    return s

def explode_wildcards(cell) -> list[str]:
    text = "" if cell is None else str(cell)
    return [p.strip() for p in text.split(";") if p.strip()]

class CategoryMatcher:
    def __init__(self, lookup_df: pd.DataFrame):
        self.rules: list[tuple[str, callable]] = []
        for _, row in lookup_df.iterrows():
            cat = str(row.get("CATEGORY", "")).strip()
            if not cat:
                continue
            for token in explode_wildcards(row.get("CATEGORY_WILDCARD", "")):
                if token.upper().startswith("REGEX:"):
                    pattern = token[6:].strip()
                    try:
                        rx = re.compile(pattern, re.IGNORECASE)
                        self.rules.append((cat, lambda s, rx=rx: bool(rx.search(s))))
                    except re.error:
                        ntok = normalize(pattern)
                        if ntok:
                            rx = re.compile(rf'(?:(?<=_)|^){re.escape(ntok)}(?=(?:_|$))')
                            self.rules.append((cat, lambda s, rx=rx: bool(rx.search(s))))
                else:
                    ntok = normalize(token)
                    if ntok:
                        rx = re.compile(rf'(?:(?<=_)|^){re.escape(ntok)}(?=(?:_|$))')
                        self.rules.append((cat, lambda s, rx=rx: bool(rx.search(s))))

    def match(self, scanned_category: str) -> str | None:
        norm = normalize(scanned_category)
        for cat, predicate in self.rules:
            try:
                if predicate(norm):
                    return cat
            except Exception:
                continue
        return None

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", type=str, default=None)
    parser.add_argument("--datadir", type=str, default=None)
    parser.add_argument("--input", "-i", type=str)
    parser.add_argument("--wildcards", "-w", type=str)
    parser.add_argument("--sheet", type=str, default="CATEGORY")
    args = parser.parse_args()

    workdir = Path(args.workdir) if args.workdir else Path.cwd()
    datadir = Path(args.datadir) if args.datadir else workdir

    in_path = Path(args.input).resolve() if args.input else workdir / "ACTIVE_DEDUPED_2_2.xlsx"
    wildcards_path = Path(args.wildcards).resolve() if args.wildcards else datadir / "wildcards_matching_general.xlsx"
    out_path = workdir / "ACTIVE_MATCH_CAT_2_3.xlsx"

    if not in_path.is_file():
        log.error("Input not found: %s", in_path); sys.exit(1)
    if not wildcards_path.is_file():
        log.error("Wildcards file not found: %s", wildcards_path); sys.exit(1)

    log.info("Reading input: %s", in_path)
    df = pd.read_excel(in_path)

    if "Scanned Category" not in df.columns:
        log.error("Missing 'Scanned Category'"); sys.exit(1)

    log.info("Reading wildcards: %s (sheet=%s)", wildcards_path, args.sheet)
    look = pd.read_excel(wildcards_path, sheet_name=args.sheet)
    if not {"CATEGORY", "CATEGORY_WILDCARD"}.issubset(look.columns):
        log.error("Lookup sheet must have CATEGORY, CATEGORY_WILDCARD"); sys.exit(1)

    matcher = CategoryMatcher(look)
    df["Generic Category"] = df["Scanned Category"].apply(lambda x: matcher.match(str(x)) or "OTHER")

    original_cols = list(df.columns)
    col_order = original_cols.copy()
    if "Generic Category" in col_order:
        col_order.remove("Generic Category")
    if "Scanned Category" in col_order:
        insert_at = col_order.index("Scanned Category") + 1
        col_order.insert(insert_at, "Generic Category")
    else:
        col_order.append("Generic Category")

    out_df = df[col_order]
    sort_cols = ["Generic Category"]
    if "Scan Session ID" in out_df.columns:
        sort_cols.append("Scan Session ID")
    out_df = out_df.sort_values(sort_cols, kind="mergesort").reset_index(drop=True)

    log.info("Writing: %s", out_path)
    out_df.to_excel(out_path, index=False)
    log.info("Done. Rows: %d", len(out_df))

if __name__ == "__main__":
    main()
