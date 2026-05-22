#!/usr/bin/env python3
"""
rectify_paper.py

Detect the 4 corners of a paper/menu in a photo and warp it into a flat
top-down rectangle (perspective correction). Same trick that scanner apps
like Adobe Scan / iOS Notes use.

Usage:
    python rectify_paper.py --input <in.jpg> --output <out.jpg>

Stdout contract (last line):
    RECTIFY_RESULT {"ok": true, "corners": [[x,y],...], "out_w": W, "out_h": H}
    RECTIFY_RESULT {"ok": false, "reason": "no_quad_found"}

Always exits 0 unless something genuinely crashes (file IO, etc).
A "no quad found" result is NOT an error — the caller treats it as a soft skip.
"""

from __future__ import annotations
import argparse
import json
import sys

import cv2
import numpy as np
from PIL import Image, ImageOps


WORK_LONG_EDGE = 1500  # downscale for detection (speed)
MIN_AREA_FRAC = 0.15   # blob must cover >= 15% of image area to be a candidate
MAX_AREA_FRAC = 0.92   # > this means we picked up the image border, not the paper
EPS_FRACTIONS = [0.01, 0.02, 0.03, 0.04, 0.05, 0.08, 0.12]  # approxPolyDP sweeps


def order_corners(pts: np.ndarray, image_shape: tuple[int, int] | None = None) -> np.ndarray:
    """Order 4 points as [top-left, top-right, bottom-right, bottom-left].

    If image_shape (h, w) is given, orientation is preserved by mapping each
    quad corner to the destination corner whose **image** corner it lies
    nearest to. This way a sideways photo stays sideways after warping.
    """
    pts = pts.reshape(4, 2).astype(np.float32)

    if image_shape is not None:
        h, w = image_shape
        image_corners = np.array(
            [[0, 0], [w, 0], [w, h], [0, h]], dtype=np.float32
        )  # TL, TR, BR, BL
        rect = np.zeros((4, 2), dtype=np.float32)
        used = set()
        # Greedy nearest assignment: for each image corner, pick the closest
        # unused quad point.
        for ic_idx in range(4):
            best_d = float("inf")
            best_q = -1
            for q_idx in range(4):
                if q_idx in used:
                    continue
                d = float(np.linalg.norm(pts[q_idx] - image_corners[ic_idx]))
                if d < best_d:
                    best_d = d
                    best_q = q_idx
            rect[ic_idx] = pts[best_q]
            used.add(best_q)
        return rect

    # Fallback: classic upright-normalizing ordering by x+y / x-y sums
    rect = np.zeros((4, 2), dtype=np.float32)
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]
    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def _gather_candidates(image_bgr: np.ndarray, img_area: float) -> list[np.ndarray]:
    """Run several segmentation strategies, return all big blob contours."""
    candidates: list[np.ndarray] = []
    gray = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)

    def _harvest(mask: np.ndarray) -> None:
        kernel = np.ones((7, 7), np.uint8)
        closed = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < img_area * MIN_AREA_FRAC:
                continue
            if area > img_area * MAX_AREA_FRAC:
                continue  # spurious image-border contour
            candidates.append(cnt)

    # Strategy 1: HSV saturation — white/light paper has very low saturation
    # whereas wood/colored tables have higher saturation. This is the most
    # reliable separator for "paper on table" photos.
    hsv = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2HSV)
    sat = hsv[:, :, 1]
    val = hsv[:, :, 2]
    # paper mask = low saturation AND not too dark
    low_sat = (sat < 60).astype(np.uint8) * 255
    bright = (val > 80).astype(np.uint8) * 255
    paper_mask = cv2.bitwise_and(low_sat, bright)
    _harvest(paper_mask)

    # Strategy 2: Otsu threshold (paper brighter OR darker than bg)
    _, otsu = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    _harvest(otsu)
    _harvest(cv2.bitwise_not(otsu))

    # Strategy 3: Auto Canny based on image median
    v = float(np.median(blur))
    lower = int(max(0, 0.66 * v))
    upper = int(min(255, 1.33 * v))
    edges = cv2.Canny(blur, lower, upper)
    edges = cv2.dilate(edges, np.ones((5, 5), np.uint8), iterations=2)
    _harvest(edges)

    # Strategy 4: Adaptive threshold (handles uneven lighting)
    adapt = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 51, 5
    )
    _harvest(adapt)
    _harvest(cv2.bitwise_not(adapt))

    return candidates


def _approx_to_quad(cnt: np.ndarray) -> np.ndarray | None:
    """Try multiple epsilons; return 4-vertex convex approx or None."""
    peri = cv2.arcLength(cnt, True)
    for eps_frac in EPS_FRACTIONS:
        approx = cv2.approxPolyDP(cnt, eps_frac * peri, True)
        if len(approx) == 4 and cv2.isContourConvex(approx):
            return approx.astype(np.float32)
    # Fallback: convex hull then re-approximate (handles noisy edges)
    hull = cv2.convexHull(cnt)
    peri = cv2.arcLength(hull, True)
    for eps_frac in EPS_FRACTIONS:
        approx = cv2.approxPolyDP(hull, eps_frac * peri, True)
        if len(approx) == 4:
            return approx.astype(np.float32)
    return None


def _corners_on_border(quad: np.ndarray, image_shape: tuple[int, int]) -> int:
    h, w = image_shape
    margin_x = w * 0.01
    margin_y = h * 0.01
    pts = quad.reshape(-1, 2)
    return sum(
        1 for x, y in pts
        if x < margin_x or x > w - margin_x or y < margin_y or y > h - margin_y
    )


def _quad_score(quad: np.ndarray, img_area: float) -> float:
    """Higher = better. Prefers larger area + more rectangular shape."""
    area = cv2.contourArea(quad)
    if area <= 0:
        return -1.0
    if area > img_area * MAX_AREA_FRAC:
        return -1.0
    rect = cv2.minAreaRect(quad)
    rect_area = rect[1][0] * rect[1][1]
    rectangularity = area / rect_area if rect_area > 0 else 0
    return (area / img_area) * rectangularity


def find_paper_quad(image: np.ndarray) -> np.ndarray | None:
    """Return 4-point polygon (in image coordinates) or None if not found.

    Two-pass strategy:
      1. STRICT: only accept quads with <= 1 corner on the image border.
         This finds the actual paper when it's surrounded by background.
      2. LOOSE: if strict found nothing, accept any quad. This catches the
         case where the menu legitimately fills the frame edge-to-edge.
    """
    h, w = image.shape[:2]
    img_area = float(h * w)

    candidates = _gather_candidates(image, img_area)
    if not candidates:
        return None

    # Build all valid quads with their scores
    all_quads: list[tuple[float, np.ndarray, int]] = []  # (score, quad, on_border)
    for cnt in sorted(candidates, key=cv2.contourArea, reverse=True)[:12]:
        quad = _approx_to_quad(cnt)
        if quad is None:
            continue
        score = _quad_score(quad, img_area)
        if score <= 0:
            continue
        on_border = _corners_on_border(quad, (h, w))
        all_quads.append((score, quad, on_border))

    if not all_quads:
        return None

    # Pass 1 — strict: prefer interior quads
    strict = [(s, q) for s, q, b in all_quads if b <= 1]
    if strict:
        strict.sort(key=lambda x: x[0], reverse=True)
        return strict[0][1]

    # Pass 2 — loose: any quad
    all_quads.sort(key=lambda x: x[0], reverse=True)
    return all_quads[0][1]


def rectify(image: np.ndarray, quad: np.ndarray) -> tuple[np.ndarray, int, int]:
    """Apply perspective warp using the 4 ordered corners."""
    rect = order_corners(quad, image_shape=image.shape[:2])
    (tl, tr, br, bl) = rect

    width_top = np.linalg.norm(tr - tl)
    width_bottom = np.linalg.norm(br - bl)
    max_width = int(max(width_top, width_bottom))

    height_left = np.linalg.norm(bl - tl)
    height_right = np.linalg.norm(br - tr)
    max_height = int(max(height_left, height_right))

    dst = np.array(
        [[0, 0], [max_width - 1, 0], [max_width - 1, max_height - 1], [0, max_height - 1]],
        dtype=np.float32,
    )
    M = cv2.getPerspectiveTransform(rect, dst)
    warped = cv2.warpPerspective(image, M, (max_width, max_height))
    return warped, max_width, max_height


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    # Read with PIL so EXIF orientation is honored (cv2.imread ignores it).
    # In production this is moot — /scan/upload bakes EXIF into pixels via
    # sharp().rotate() before storing — but it makes CLI testing match.
    try:
        pil = ImageOps.exif_transpose(Image.open(args.input).convert("RGB"))
    except Exception:
        print("RECTIFY_RESULT " + json.dumps({"ok": False, "reason": "could_not_read_input"}))
        return 0
    image = cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)

    h, w = image.shape[:2]
    long_edge = max(h, w)
    if long_edge > WORK_LONG_EDGE:
        scale = WORK_LONG_EDGE / long_edge
        work = cv2.resize(image, (int(w * scale), int(h * scale)))
    else:
        scale = 1.0
        work = image

    quad = find_paper_quad(work)
    if quad is None:
        print("RECTIFY_RESULT " + json.dumps({"ok": False, "reason": "no_quad_found"}))
        return 0

    # Scale corners back to full-resolution coordinates and warp the original
    full_quad = quad / scale
    warped, out_w, out_h = rectify(image, full_quad)

    cv2.imwrite(args.output, warped, [int(cv2.IMWRITE_JPEG_QUALITY), 92])

    corners = [
        [float(x), float(y)]
        for x, y in order_corners(full_quad, image_shape=image.shape[:2]).tolist()
    ]
    print("RECTIFY_RESULT " + json.dumps({
        "ok": True,
        "corners": corners,
        "out_w": out_w,
        "out_h": out_h,
    }))
    return 0


if __name__ == "__main__":
    sys.exit(main())
