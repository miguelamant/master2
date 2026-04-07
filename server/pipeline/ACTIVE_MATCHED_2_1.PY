import pandas as pd
import os
import unicodedata
import re
import math
import argparse
from datetime import datetime
import logging
from pathlib import Path
from functools import lru_cache

# Logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("scan_match_with_zero_mapping")

# --- CLI args ---
parser = argparse.ArgumentParser()
parser.add_argument("--workdir", type=str, default=None, help="Working directory for I/O files")
parser.add_argument("--datadir", type=str, default=None, help="Directory for reference data files")
parser.add_argument("--input", type=str, default=None, help="Input scan file name")
_args = parser.parse_args()

SCRIPT_DIR = Path(__file__).resolve().parent
WORKDIR = Path(_args.workdir) if _args.workdir else Path.cwd()
DATADIR = Path(_args.datadir) if _args.datadir else SCRIPT_DIR
INPUT_NAME = _args.input or "scan_input.xlsx"

WILDCARDS_FILE_NAME = "wildcards_matching_general.xlsx"


def resolve_file(name: str, search_dirs: list[Path]) -> Path:
    candidate = Path(name)
    if candidate.is_absolute() and candidate.exists():
        return candidate
    for base in search_dirs:
        p = base / name
        if p.exists():
            return p
    raise FileNotFoundError(f"Could not find '{name}' in {[str(d) for d in search_dirs]}")


SCAN_FILE_PATH = resolve_file(INPUT_NAME, [WORKDIR, SCRIPT_DIR])
# Wildcards: look in datadir first, then datadir/data, then script dir
WILDCARDS_FILE_PATH = resolve_file(WILDCARDS_FILE_NAME, [DATADIR, DATADIR / "data", SCRIPT_DIR])

TARGET_CATEGORY = "BEER"
KEEP_ONLY_BEER_AND_UNLABELED = False

# ========= Normalization =========
def normalize_text(text):
    if not isinstance(text, str):
        return ""
    t = text.strip().lower()
    t = ''.join(c for c in unicodedata.normalize('NFD', t)
                if unicodedata.category(c) != 'Mn')
    t = (t
         .replace("x0019", "")
         .replace("0019", "")
         .replace("0013", "")
         .replace(")", "")
         .replace("(", "")
         .replace("0.33", "")
         .replace("0,33", "")
         .replace("0.66", "")
         .replace("0,66", "")
         .replace("0,50", "")
         .replace("0,5l", "")
         .replace("\u221e", "")
         .replace("", ""))
    t = re.sub(r"[\x00-\x1F\x7F]", "", t)
    t = re.sub(r"[^\x00-\x7F]+", "", t)
    t = t.replace("st-", "st_").replace("st.", "st_")
    t = t.replace('%', '_')
    t = t.replace('"', '_')
    t = re.sub(r'(?<!\d)[.,](?!\d)', '', t)
    t = t.replace("-", "_").replace("'", "_").replace(" ", "_")
    t = t.replace("__", "_")
    t = t.replace("__", "_")
    return t.upper()


def normalize_wildcard_column(series):
    out = []
    for raw in series:
        if raw is None or (isinstance(raw, float) and pd.isna(raw)):
            s = ""
        else:
            s = str(raw)
        if s.strip().lower() in {"nan", "none", "null"}:
            s = ""
        items = []
        for i in s.split(";"):
            i = i.strip()
            if not i or i.lower() in {"nan", "none", "null"}:
                continue
            if i.startswith("REGEX:"):
                items.append(re.compile(i[6:], re.IGNORECASE))
            else:
                items.append(normalize_text(i))
        out.append(items)
    return out


# ========= token helpers =========
def _tokens(s: str) -> list[str]:
    return [t for t in str(s).split("_") if t]

def _phrase_hit(text_tokens: list[str], wildcard: str) -> bool:
    if not wildcard:
        return False
    p = _tokens(wildcard)
    if not p:
        return False
    n = len(p)
    for i in range(0, len(text_tokens) - n + 1):
        if text_tokens[i:i+n] == p:
            return True
    return False


@lru_cache(maxsize=32768)
def _boundary_regex(token: str) -> re.Pattern:
    return re.compile(rf'(?:(?<=_)|^){re.escape(token)}(?=(?:_|$))')

def _brand_token_hit(text: str, token: str) -> bool:
    if not token or not text:
        return False
    return bool(_boundary_regex(token).search(text))

def match_brand_from_list(norm_text: str, blist):
    for brand, wilds in blist:
        if _brand_token_hit(norm_text, brand):
            return brand
        for w in wilds:
            if isinstance(w, str):
                if _brand_token_hit(norm_text, w):
                    return brand
            else:
                if w.search(norm_text):
                    return brand
    return None


def match_brand(norm_text: str):
    return match_brand_from_list(norm_text, brand_list)


# ========= Load scan data =========
log.info("Loading scan file: %s", SCAN_FILE_PATH)
df = pd.read_excel(SCAN_FILE_PATH)
df.columns = df.columns.str.strip().str.lower()
HAS_INPUT_KEY = "key" in df.columns
log.info("Rows loaded: %d", len(df))

df["normalized_name"] = df["product_name"].astype(str).apply(normalize_text)
df["normalized_category"] = df["category_name"].astype(str).apply(normalize_text)

df["Product Menu Nr"] = (
    df.groupby(["scan_session_id", "category_name"]).cumcount() + 1
)

# ========= CATEGORY match =========
cat = pd.read_excel(WILDCARDS_FILE_PATH, sheet_name="CATEGORY")
cat["CATEGORY"] = cat["CATEGORY"].apply(normalize_text)
cat["CATEGORY_WILDCARD"] = normalize_wildcard_column(cat["CATEGORY_WILDCARD"])
category_list = list(zip(cat["CATEGORY"], cat["CATEGORY_WILDCARD"]))

def find_category(normalized_category_text: str):
    s = str(normalized_category_text or "")
    for category, wilds in category_list:
        for w in wilds:
            if not w:
                continue
            if isinstance(w, re.Pattern):
                if w.search(s):
                    return category
            else:
                if re.search(rf'(?:(?<=_)|^){re.escape(w)}(?=(?:_|$))', s):
                    return category
    return None


# ========= Volume & presentation =========
format_patterns = [
    (r"(\d{1,3})_?CL", "cl"),
    (r"(\d+(?:[.,]\d+)?)_?L", "l"),
]
draft_keywords   = ["TAP", "DRAFT", "VAT", "VAN_'T_VAT", "VAN_HET_VAT", "FUT", "FUT"]
bottle_keywords  = ["BOTTLE", "FLES", "BOUTEILLE"]
can_keywords     = ["CAN", "BLIK"]

def detect_presentation(norm_name, norm_cat):
    n = norm_name or ""
    c = norm_cat or ""
    if any(k in n or k in c for k in draft_keywords):
        return "draft"
    if any(k in n or k in c for k in can_keywords):
        return "can"
    if any(k in n or k in c for k in bottle_keywords):
        return "bottle"
    return None

def extract_volume_cl(norm_name):
    if not isinstance(norm_name, str):
        return None
    for pattern, unit in format_patterns:
        m = re.search(pattern, norm_name)
        if m:
            raw = m.group(1).replace(",", ".")
            try:
                val = float(raw)
                return int(round(val * 100)) if unit == "l" else int(round(val))
            except Exception:
                continue
    return None

def edge_score(position: int, size: int) -> float:
    if size <= 1:
        return 100.0
    x = (position - 1) / (size - 1)
    edge = (math.cos(2 * math.pi * x) + 1) / 2.0
    baseline = 100 - 25 * x
    mid_min = 40.0 if size <= 5 else (20.0 if size <= 8 else 0.0)
    return round(baseline * edge + mid_min * (1 - edge), 1)

def match_brand_build(norm_text: str):
    return match_brand_from_list(norm_text, brand_list_build)


# ========= Wildcards tables =========
brand_df    = pd.read_excel(WILDCARDS_FILE_PATH, sheet_name="BRAND")
variant_df  = pd.read_excel(WILDCARDS_FILE_PATH, sheet_name="VARIANT")
tagmap_df   = pd.read_excel(WILDCARDS_FILE_PATH, sheet_name="TAG_MAPPING")
subvar_df   = pd.read_excel(WILDCARDS_FILE_PATH, sheet_name="SUB_VARIANT")

# BRAND
brand_df["BRAND"] = brand_df["BRAND"].apply(normalize_text)
brand_df["BRAND_WILDCARD"] = normalize_wildcard_column(brand_df["BRAND_WILDCARD"])

brand_list = list(zip(brand_df["BRAND"], brand_df["BRAND_WILDCARD"]))
if "BUILD" not in brand_df.columns:
    brand_df["BUILD"] = 0
brand_df["BUILD"] = pd.to_numeric(brand_df["BUILD"], errors="coerce").fillna(0).astype(int)

brand_df_build = brand_df[brand_df["BUILD"] == 1].copy()
brand_list_build = list(zip(brand_df_build["BRAND"], brand_df_build["BRAND_WILDCARD"]))

# VARIANT
variant_df["VARIANT"] = variant_df["VARIANT"].apply(normalize_text)
variant_df["VARIANT_WILDCARD"] = normalize_wildcard_column(variant_df["VARIANT_WILDCARD"])
variant_df["PRIORITY"] = pd.to_numeric(variant_df["PRIORITY"], errors="coerce").fillna(1).astype(int)

variant_rows = []
for idx, row in variant_df.reset_index().iterrows():
    variant_rows.append({
        "name": row["VARIANT"],
        "wilds": [w for w in row["VARIANT_WILDCARD"] if w],
        "priority": int(row["PRIORITY"]),
        "order": int(row["index"]),
    })

if "VARIANT_BUILD" not in variant_df.columns:
    variant_df["VARIANT_BUILD"] = 0
variant_df["VARIANT_BUILD"] = pd.to_numeric(variant_df["VARIANT_BUILD"], errors="coerce").fillna(0).astype(int)

variant_rows_build = []
for idx, row in variant_df[variant_df["VARIANT_BUILD"] == 1].reset_index().iterrows():
    variant_rows_build.append({
        "name": row["VARIANT"],
        "wilds": [w for w in row["VARIANT_WILDCARD"] if w],
        "priority": int(row["PRIORITY"]),
        "order": int(row["index"]),
    })

# SUB_VARIANT
subvar_df["SUB_VARIANT"] = subvar_df["SUB_VARIANT"].apply(normalize_text)
subvar_df["SUB_VARIANT_WILDCARD"] = normalize_wildcard_column(subvar_df["SUB_VARIANT_WILDCARD"])

def _collect_wilds(df, label):
    rows = df[df["SUB_VARIANT"] == label]
    bank = set()
    if not rows.empty:
        for wlist in rows["SUB_VARIANT_WILDCARD"].tolist():
            for w in wlist:
                if w:
                    bank.add(w)
    return bank

ZERO_WILDS     = _collect_wilds(subvar_df, "ZERO")
HOMEMADE_WILDS = _collect_wilds(subvar_df, "HOMEMADE")
FRESH_WILDS    = _collect_wilds(subvar_df, "FRESH")
HOT_WILDS      = _collect_wilds(subvar_df, "HOT")
LIGHT_WILDS    = _collect_wilds(subvar_df, "LIGHT")

NUMBER_TOKEN_RE = re.compile(r'(\d+(?:[.,]\d+)?)%?')

def is_zero_product(text: str, zero_wilds=None) -> bool:
    s = (text or "")
    if zero_wilds:
        for w in zero_wilds:
            if not w:
                continue
            if isinstance(w, str):
                pat = re.compile(rf'(?:(?<=_)|^){re.escape(w)}(?=(?:_|$))')
                if pat.search(s):
                    return True
            else:
                if w.search(s):
                    return True
    return False

def _is_subvar(text: str, wilds: set) -> bool:
    s = (text or "")
    if not wilds:
        return False
    for w in wilds:
        if not w:
            continue
        if isinstance(w, str):
            pat = re.compile(rf'(?:(?<=_)|^){re.escape(w)}(?=(?:_|$))')
            if pat.search(s):
                return True
        else:
            if w.search(s):
                return True
    return False

def is_homemade_product(text: str) -> bool:
    return _is_subvar(text, HOMEMADE_WILDS)

def is_fresh_product(text: str) -> bool:
    return _is_subvar(text, FRESH_WILDS)

def is_hot_product(text: str) -> bool:
    return _is_subvar(text, HOT_WILDS)

def is_light_product(text: str) -> bool:
    return _is_subvar(text, LIGHT_WILDS)


# TAG_MAPPING
tagmap_df["BRAND"] = tagmap_df["BRAND"].apply(normalize_text)
tagmap_df["TAG_WILDCARDS"] = normalize_wildcard_column(tagmap_df["TAG_WILDCARDS"])
if "EXTRA_TAG_A" not in tagmap_df.columns:
    tagmap_df["EXTRA_TAG_A"] = ""
if "EXTRA_TAG_B" not in tagmap_df.columns:
    tagmap_df["EXTRA_TAG_B"] = ""

tagmap_df["EXTRA_TAG_A_W"] = normalize_wildcard_column(tagmap_df["EXTRA_TAG_A"])
tagmap_df["EXTRA_TAG_B_W"] = normalize_wildcard_column(tagmap_df["EXTRA_TAG_B"])

tagmap_df["KEY_TAG_N"] = tagmap_df["KEY_TAG"].apply(lambda x: normalize_text(x) if "KEY_TAG" in tagmap_df and pd.notna(x) else "")
tagmap_df["ZERO_N"]    = tagmap_df["ZERO"].apply(lambda x: normalize_text(x) if "ZERO"    in tagmap_df and pd.notna(x) else "")
tagmap_df["BUCKET"] = tagmap_df["ZERO"].apply(
    lambda x: normalize_text(x) if pd.notna(x) else ""
)

if "SUB_VARIANT" in tagmap_df.columns:
    tagmap_df["SUB_VARIANT_N"] = tagmap_df["SUB_VARIANT"].apply(lambda x: normalize_text(x) if pd.notna(x) else "")
else:
    tagmap_df["SUB_VARIANT_N"] = ""

tm_by_brand = {}
for _, row in tagmap_df.iterrows():
    b = row["BRAND"]
    tm_by_brand.setdefault(b, []).append({
        "wilds": [w for w in row["TAG_WILDCARDS"] if w],
        "extra_a": [w for w in row["EXTRA_TAG_A_W"] if w],
        "extra_b": [w for w in row["EXTRA_TAG_B_W"] if w],
        "key":   row.get("KEY", None),
        "key_tag": row.get("KEY_TAG_N", ""),
        "bucket": row.get("BUCKET", ""),
    })


# ========= Matching helpers =========
def _token_hit(ts: str, token: str) -> bool:
    return bool(re.search(rf'(?:(?<=_)|^){re.escape(token)}(?=(?:_|$))', ts or ""))

def _extras_ok(extra_wilds, tags_string: str) -> bool:
    if not extra_wilds:
        return True
    ts = tags_string or ""
    for w in extra_wilds:
        if isinstance(w, str):
            if _token_hit(ts, w):
                return True
        else:
            if w.search(ts):
                return True
    return False


def collect_tags_and_list(norm_text: str, vrows=None):
    vrows = vrows if vrows is not None else variant_rows
    norm = norm_text or ""
    matched = []
    for vr in vrows:
        if any(w and (w in norm) for w in vr["wilds"]):
            matched.append(vr["name"])
    return ("_".join(matched) if matched else None), matched


def choose_priority_tag(matched_variants: list[str]) -> str | None:
    if not matched_variants:
        return None
    pr = {vr["name"]: (vr["priority"], vr["order"]) for vr in variant_rows}
    best, best_key = None, (10**9, 10**9)
    for name in matched_variants:
        if name not in pr:
            continue
        key = pr[name]
        if key < best_key:
            best_key = key
            best = name
    return best

def _wilds_match_tags(wilds, tags_string: str) -> bool:
    if not wilds or len(wilds) == 0:
        return True
    ts = tags_string or ""
    for w in wilds:
        if isinstance(w, str):
            if w and (w in ts):
                return True
        else:
            if w.search(ts):
                return True
    return False

def choose_key_from_mapping(
    brand_norm: str,
    tags_string: str,
    zero_flag: bool,
    homemade_flag: bool = False,
    fresh_flag: bool = False,
    hot_flag: bool = False,
    light_flag: bool = False
):
    rows = tm_by_brand.get(brand_norm, [])
    if not rows:
        return (None, None)

    def pick(cands):
        def spec_score(r):
            return (1 if r.get("extra_a") else 0) + (1 if r.get("extra_b") else 0)
        cands = sorted(cands, key=spec_score, reverse=True)
        for r in cands:
            if not _wilds_match_tags(r["wilds"], tags_string):
                continue
            if not _extras_ok(r.get("extra_a", []), tags_string):
                continue
            if not _extras_ok(r.get("extra_b", []), tags_string):
                continue
            key = r.get("key")
            key_tag = r.get("key_tag", "")
            if pd.notna(key) and str(key).strip():
                return (str(key), key_tag or None)
            if key_tag:
                return (f"{brand_norm} | {key_tag}", key_tag)
        return (None, None)

    wanted = ""
    if zero_flag:
        wanted = "ZERO"
    elif homemade_flag:
        wanted = "HOMEMADE"
    elif fresh_flag:
        wanted = "FRESH"
    elif light_flag:
        wanted = "LIGHT"
    elif hot_flag:
        wanted = "HOT"

    if wanted:
        mk, mt = pick([r for r in rows if r.get("bucket", "") == wanted])
        if mk:
            return (mk, mt)

    return pick([r for r in rows if r.get("bucket", "") == ""])


# ========= Build rows =========
rows = []
log.info("Building rows with input KEY + matching (ZERO-aware mapping)...")

for _, r in df.iterrows():
    norm_name = r.get("normalized_name", "")
    norm_cat  = r.get("normalized_category", "")
    matched_category = find_category(norm_cat)
    presentation = detect_presentation(norm_name, norm_cat)
    fmt_cl = extract_volume_cl(norm_name)

    if KEEP_ONLY_BEER_AND_UNLABELED:
        keep_set = {normalize_text(TARGET_CATEGORY)}
        keep_cat = matched_category if matched_category else "UNLABELED"
        if keep_cat not in keep_set:
            continue

    input_key = r.get("key", "") if HAS_INPUT_KEY else f"{r.get('scan_session_id','')} - {r.get('category_name','')} - {r.get('product_name','')}"

    brand = match_brand(norm_name)
    tags_string, matched_variants = collect_tags_and_list(norm_name)
    build_brand = match_brand_build(norm_name)
    build_tags_string, build_matched_variants = collect_tags_and_list(norm_name, vrows=variant_rows_build)
    chosen_tag_by_prio = choose_priority_tag(matched_variants)
    zero_flag = is_zero_product(norm_name, ZERO_WILDS)
    homemade_flag = is_homemade_product(norm_name)
    fresh_flag    = is_fresh_product(norm_name)
    hot_flag = is_hot_product(norm_name)
    light_flag = is_light_product(norm_name)

    sub_variant = "ZERO" if is_zero_product(norm_name, ZERO_WILDS) else ("HOMEMADE" if homemade_flag else ("FRESH" if fresh_flag else ("FRESH" if hot_flag else None)))

    first_tags = (tags_string or "")
    mapped_key, mapped_tag = choose_key_from_mapping(brand, first_tags, zero_flag, homemade_flag, fresh_flag, hot_flag, light_flag)
    mapping_used_tags = first_tags

    if not mapped_key:
        tags_list = [t for t in first_tags.split("_") if t]
        if "CORE" not in tags_list:
            tags_list.append("CORE")
        second_tags = "_".join(tags_list) if tags_list else "CORE"
        mapped_key, mapped_tag = choose_key_from_mapping(brand, second_tags, zero_flag, homemade_flag, fresh_flag, hot_flag, light_flag)
        mapping_used_tags = second_tags

    if mapped_key:
        matched_key = mapped_key
        chosen_tag_for_key = mapped_tag if mapped_tag else chosen_tag_by_prio
    elif brand:
        mid = "CORE"
        matched_key = f"{brand} | {mid} | "
        chosen_tag_for_key = chosen_tag_by_prio
    else:
        matched_key = None
        chosen_tag_for_key = None

    rows.append({
        "KEY": input_key,
        "Scan Session ID": r.get("scan_session_id", None),
        "location_id": r.get("location_id", None),
        "Scanned Product Name": r.get("product_name", ""),
        "Scanned Category": r.get("category_name", ""),
        "Normalized Name": norm_name,
        "Price (raw)": r.get("product_price", None),
        "Presentation": presentation,
        "Format (cl)": fmt_cl,
        "Build Tags": build_tags_string,
        "Tags String": tags_string,
        "Chosen Tag (for key)": chosen_tag_for_key,
        "HOMEMADE Detected": "YES" if homemade_flag else "NO",
        "FRESH Detected": "YES" if fresh_flag else "NO",
        "ZERO Detected": "YES" if zero_flag else "NO",
        "HOT Detected": "YES" if hot_flag else "NO",
        "LIGHT Detected": "YES" if light_flag else "NO",
        "Matched Key": matched_key,
        "Computed Key (debug)": matched_key,
        "Matched Brand": brand,
        "Build Brand Match": build_brand,
        # ── pass-through for digital twin ──
        "DT_page_number": r.get("page_number", None),
        "DT_column_number": r.get("textbox", r.get("column_number", None)),
        "DT_position_in_column": r.get("position_in_textbox", r.get("position_in_column", None)),
        "DT_description": r.get("product_description", ""),
        "DT_serve_format": r.get("serve_format", None),
    })

out = pd.DataFrame(rows)

# ========= Position / Group size / Edge score =========
if not out.empty:
    out = out.sort_values(["Scan Session ID", "Scanned Category", "Normalized Name"])
    out["Position In Group"] = (
        out.groupby(["Scan Session ID", "Scanned Category"], dropna=False).cumcount() + 1
    ).astype("Int64")
    out["Group Size"] = (
        out.groupby(["Scan Session ID", "Scanned Category"], dropna=False)["Scanned Product Name"]
        .transform("size")
    ).astype("Int64")

    def _safe_edge(pos, size):
        try:
            p = int(pos) if pd.notna(pos) else 1
            s = int(size) if pd.notna(size) and int(size) > 0 else 1
            return edge_score(p, s)
        except Exception:
            return edge_score(1, 1)

    out["Edge Score"] = out.apply(lambda row: _safe_edge(row["Position In Group"], row["Group Size"]), axis=1)

# ========= Column order =========
final_cols = [
    "KEY",
    "Scan Session ID",
    "location_id",
    "Scanned Product Name",
    "Scanned Category",
    "Normalized Name",
    "Price (raw)",
    "Presentation",
    "Format (cl)",
    "Matched Brand",
    "Tags String",
    "Chosen Tag (for key)",
    "LIGHT Detected",
    "HOMEMADE Detected",
    "FRESH Detected",
    "ZERO Detected",
    "Matched Key",
    "Position In Group",
    "Group Size",
    "Edge Score",
    "Computed Key (debug)",
    "Build Brand Match",
    "Build Tags",
    "DT_page_number",
    "DT_column_number",
    "DT_position_in_column",
    "DT_description",
    "DT_serve_format",
]
out = out[final_cols]

# ========= Save =========
new_name = WORKDIR / "ACTIVE_MATCHED_2_1.xlsx"
out.to_excel(new_name, index=False)

log.info("Saved: %s (rows: %d)", new_name, len(out))
