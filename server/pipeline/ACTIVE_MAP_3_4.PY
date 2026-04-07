#!/usr/bin/env python3
"""
ACTIVE_MAP_3_4.PY  (export builder)

- Input: ACTIVE_VALIDATION_3_39.xlsx (from workdir)
- Registry: REGISTRY.xlsx (from datadir, sheet PRODUCTS)
- Output: ACTIVE_EXPORT_3_4.xlsx (to workdir)
"""

from __future__ import annotations
import pandas as pd
from pathlib import Path
import argparse
import logging
import sys
import unicodedata
import re

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("export_3_4")

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

def _parse_price(v: object) -> float | None:
    if v is None or (isinstance(v, float) and pd.isna(v)):
        return None
    s = str(v).strip()
    if not s:
        return None
    s = s.replace("\u20ac", "").replace("EUR", "").replace("eur", "").strip()
    s = s.replace(",", ".")
    try:
        return float(s)
    except Exception:
        return None

def _pick_col(df: pd.DataFrame, candidates: list[str]) -> str | None:
    for c in candidates:
        if c in df.columns:
            return c
    return None

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--workdir", type=str, default=None)
    ap.add_argument("--datadir", type=str, default=None)
    ap.add_argument("--input", default=None)
    ap.add_argument("--registry", default=None)
    ap.add_argument("--sheet", default="PRODUCTS")
    ap.add_argument("--output", default=None)
    args = ap.parse_args()

    workdir = Path(args.workdir) if args.workdir else Path.cwd()
    datadir = Path(args.datadir) if args.datadir else workdir

    in_path = Path(args.input).resolve() if args.input else workdir / "ACTIVE_VALIDATION_3_39.xlsx"
    reg_path = Path(args.registry).resolve() if args.registry else datadir / "REGISTRY.xlsx"
    out_path = Path(args.output).resolve() if args.output else workdir / "ACTIVE_EXPORT_3_4.xlsx"

    if not in_path.is_file():
        log.error("Input not found: %s", in_path); sys.exit(1)
    if not reg_path.is_file():
        log.error("Registry not found: %s", reg_path); sys.exit(1)

    log.info("Reading input: %s", in_path)
    df = pd.read_excel(in_path)

    needed = {"location_willy_id", "Price (raw)", "Matched Key"}
    missing = needed - set(df.columns)
    if missing:
        log.error("Missing columns: %s", missing); sys.exit(1)

    df["__order"]    = range(len(df))
    df["__key_norm"] = df["Matched Key"].apply(_norm_key)
    df["__price"]    = df["Price (raw)"].apply(_parse_price)
    df["__biz"]      = df["location_willy_id"]

    log.info("Reading registry: %s [sheet=%s]", reg_path, args.sheet)
    reg = pd.read_excel(reg_path, sheet_name=args.sheet)

    id_col = _pick_col(reg, ["id_product", "PRODUCT_ID", "product_id", "ID_PRODUCT"])
    key_col = _pick_col(reg, ["name", "KEY", "Matched Key", "matched_key"])

    if id_col is None or key_col is None:
        log.error("Registry missing id/name columns"); sys.exit(1)

    reg = reg[[id_col, key_col]].copy()
    reg.columns = ["product_id", "name_raw"]
    reg["__key_norm"] = reg["name_raw"].apply(_norm_key)
    reg = reg.drop_duplicates(subset=["__key_norm"], keep="first")

    merged = df.merge(reg[["product_id", "__key_norm"]], on="__key_norm", how="left")

    ok_mask = merged["product_id"].notna() & merged["__price"].notna() & merged["__biz"].notna()
    exported = merged.loc[ok_mask].sort_values("__order")

    out = pd.DataFrame({
        "id_menu_item": range(1, len(exported) + 1),
        "business_id": exported["__biz"].astype("Int64"),
        "product_id":  exported["product_id"].astype("Int64"),
        "price":       exported["__price"].round(2),
    })
    # ── pass-through digital twin columns ──
    for dt_col in ["DT_page_number", "DT_column_number", "DT_position_in_column", "DT_description", "DT_serve_format"]:
        if dt_col in exported.columns:
            out[dt_col] = exported[dt_col].values

    log.info("Writing: %s (rows: %d / %d)", out_path, len(out), len(df))
    out.to_excel(out_path, index=False)
    log.info("Done.")

if __name__ == "__main__":
    main()
