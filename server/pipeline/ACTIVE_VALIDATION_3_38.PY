#!/usr/bin/env python3
"""
ACTIVE_VALIDATION_3_38.PY

Restore 'Matched Key' from 'UNVALID' when registry-source validation agrees.
- Input: ACTIVE_VALIDATION_3_37.xlsx (from workdir)
- Output: ACTIVE_VALIDATION_3_38.xlsx (to workdir)
"""

from __future__ import annotations
import argparse
from pathlib import Path
import sys
import logging
import pandas as pd

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("validation_3_38")

REG_SRC_TO_CAT = {
    "BEERS_REG_RAW": "BEERS",
    "SOFT_REG_RAW": "REFRESHING",
    "EXCLUDED_REG_RAW": "EXCLUDED",
}

def _norm(s: object) -> str:
    if s is None or (isinstance(s, float) and pd.isna(s)):
        return ""
    return str(s).strip().upper()

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", type=str, default=None)
    parser.add_argument("--datadir", type=str, default=None)
    parser.add_argument("--input", default=None)
    parser.add_argument("--output", default=None)
    args = parser.parse_args()

    workdir = Path(args.workdir) if args.workdir else Path.cwd()
    in_path = Path(args.input).resolve() if args.input else workdir / "ACTIVE_VALIDATION_3_37.xlsx"
    out_path = Path(args.output).resolve() if args.output else workdir / "ACTIVE_VALIDATION_3_38.xlsx"

    if not in_path.is_file():
        log.error("Input not found: %s", in_path); sys.exit(1)

    log.info("Reading: %s", in_path)
    df = pd.read_excel(in_path)

    needed = ["registry_source", "VALIDATION_CATEGORY_2", "UNVALID", "Matched Key"]
    missing = [c for c in needed if c not in df.columns]
    if missing:
        log.error("Missing columns: %s", missing); sys.exit(1)

    rs = df["registry_source"].apply(_norm)
    vc2 = df["VALIDATION_CATEGORY_2"].apply(_norm)

    allowed_category = ~(vc2.isin(["NONE", "EXCLUDED"]))
    rs_mapped = rs.map(REG_SRC_TO_CAT).fillna("")

    contains_agree = (vc2 != "") & pd.Series(
        [(v in r) if (v and r) else False for v, r in zip(vc2, rs)],
        index=df.index
    )
    mapped_agree = (vc2 != "") & (vc2 == rs_mapped)
    agree = contains_agree | mapped_agree

    has_unvalid = df["UNVALID"].apply(lambda x: isinstance(x, str) and x.strip() != "")
    mk_empty = df["Matched Key"].apply(lambda x: (not isinstance(x, str)) or x.strip() == "")

    to_restore = agree & has_unvalid & mk_empty & allowed_category
    num_restore = int(to_restore.sum())

    if num_restore > 0:
        df.loc[to_restore, "Matched Key"] = df.loc[to_restore, "UNVALID"]
        df.loc[to_restore, "UNVALID"] = pd.NA

    log.info("Restored keys: %d", num_restore)
    log.info("Writing: %s", out_path)
    df.to_excel(out_path, index=False)
    log.info("Done.")

if __name__ == "__main__":
    main()
