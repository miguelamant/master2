#!/usr/bin/env python3
"""
main.py

Run the pipeline in a fixed order (2.1 -> 3.5).
Passes --workdir and --datadir to each child script.
Prints PIPELINE_RESULT JSON on the last line for the Express endpoint to parse.

Usage:
    python main.py --workdir /tmp/run_123 --datadir /app/server/pipeline/data
"""

from __future__ import annotations
import sys
import subprocess
import argparse
import json
from pathlib import Path
import time

# ----- Hard-coded run order -----
RUN_ORDER = [
    "ACTIVE_MATCHED_2_1.PY",
    "ACTIVE_DEDUPED_2_2.PY",
    "ACTIVE_MATCH_CAT_2_3.PY",
    "ACTIVE_MAPPED_3_1.PY",
    "ACTIVE_MAP_LOC_3_3.PY",
    "ACTIVE_MAP_REG_3_35.PY",
    "ACTIVE_VALIDATION_3_36.PY",
    "ACTIVE_VALIDATION_3_37.PY",
    "ACTIVE_VALIDATION_3_38.PY",
    "ACTIVE_VALIDATION_3_39.py",
    "ACTIVE_MAP_3_4.PY",
    "ACTIVE_IMPORT_SUPABASE_3_5.PY",
]

EXPECTED_OUTPUTS = {
    "ACTIVE_MATCHED_2_1.PY":       "ACTIVE_MATCHED_2_1.xlsx",
    "ACTIVE_DEDUPED_2_2.PY":       "ACTIVE_DEDUPED_2_2.xlsx",
    "ACTIVE_MATCH_CAT_2_3.PY":     "ACTIVE_MATCH_CAT_2_3.xlsx",
    "ACTIVE_MAPPED_3_1.PY":        "ACTIVE_MAPPED_3_1.xlsx",
    "ACTIVE_MAP_LOC_3_3.PY":       "ACTIVE_MAP_LOC_3_3.xlsx",
    "ACTIVE_MAP_REG_3_35.PY":      "ACTIVE_MAP_REG_3_35.xlsx",
    "ACTIVE_VALIDATION_3_36.PY":   "ACTIVE_VALIDATION_3_36.xlsx",
    "ACTIVE_VALIDATION_3_37.PY":   "ACTIVE_VALIDATION_3_37.xlsx",
    "ACTIVE_VALIDATION_3_38.PY":   "ACTIVE_VALIDATION_3_38.xlsx",
    "ACTIVE_VALIDATION_3_39.py":   "ACTIVE_VALIDATION_3_39.xlsx",
    "ACTIVE_MAP_3_4.PY":           "ACTIVE_EXPORT_3_4.xlsx",
    "ACTIVE_IMPORT_SUPABASE_3_5.PY": "ACTIVE_IMPORT_SUPABASE_3_5.xlsx",
}

SCRIPT_TIMEOUT = 300  # 5 minutes per step
OUTPUT_WAIT_SECONDS = 2

HERE = Path(__file__).resolve().parent


def run_script(script_name: str, workdir: Path, datadir: Path, input_name: str | None = None) -> str:
    script_path = HERE / script_name
    if not script_path.exists():
        raise SystemExit(f"Missing script: {script_name}")

    cmd = [sys.executable, str(script_path), "--workdir", str(workdir), "--datadir", str(datadir)]

    # ACTIVE_MATCHED_2_1 needs --input for the scan file name
    if script_name == "ACTIVE_MATCHED_2_1.PY" and input_name:
        cmd.extend(["--input", input_name])

    print(f"\n=== Running {script_name} ===", flush=True)
    proc = subprocess.run(
        cmd,
        cwd=str(workdir),
        capture_output=True,
        text=True,
        timeout=SCRIPT_TIMEOUT,
        env={**__import__("os").environ},
    )

    if proc.stdout:
        print(proc.stdout, end="")
    if proc.returncode != 0:
        if proc.stderr:
            print(proc.stderr, file=sys.stderr, end="")
        raise SystemExit(f"{script_name} failed (exit {proc.returncode}). Aborting.")

    return proc.stdout or ""


def verify_output(script_name: str, workdir: Path) -> None:
    out_name = EXPECTED_OUTPUTS.get(script_name)
    if not out_name:
        return
    out_path = workdir / out_name
    if out_path.exists():
        print(f"Output found: {out_name}")
        return
    time.sleep(OUTPUT_WAIT_SECONDS)
    if out_path.exists():
        print(f"Output found (after wait): {out_name}")
        return
    raise SystemExit(f"Expected output not found: {out_name}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--workdir", type=str, required=True, help="Working directory for I/O files")
    parser.add_argument("--datadir", type=str, default=None, help="Directory for reference data files")
    parser.add_argument("--input", type=str, default="scan_input.xlsx", help="Input scan filename in workdir")
    args = parser.parse_args()

    workdir = Path(args.workdir).resolve()
    datadir = Path(args.datadir).resolve() if args.datadir else HERE / "data"

    if not workdir.is_dir():
        raise SystemExit(f"Workdir does not exist: {workdir}")
    if not datadir.is_dir():
        raise SystemExit(f"Datadir does not exist: {datadir}")

    print(f"Pipeline workdir: {workdir}")
    print(f"Pipeline datadir: {datadir}")
    print(f"Input file: {args.input}")
    print(f"Run order: {len(RUN_ORDER)} steps")

    last_stdout = ""
    for s in RUN_ORDER:
        last_stdout = run_script(s, workdir, datadir, input_name=args.input)
        verify_output(s, workdir)

    # Extract the PIPELINE_RESULT from the last script's output
    result_line = None
    for line in last_stdout.splitlines():
        if line.startswith("PIPELINE_RESULT:"):
            result_line = line
            break

    if result_line:
        print(result_line)
    else:
        # Fallback: indicate success without detailed counts
        result = {"inserted": -1, "skipped_fk": 0, "skipped_dup": 0, "total": 0, "status": "completed"}
        print(f"PIPELINE_RESULT:{json.dumps(result)}")

    print("\nPipeline completed successfully.")


if __name__ == "__main__":
    main()
