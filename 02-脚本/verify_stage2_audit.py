#!/usr/bin/env python3
from __future__ import annotations

import os
import csv
import re
import subprocess
from collections import defaultdict
from pathlib import Path

import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "00-原始材料"
AUDIT = ROOT / "01-数据" / "阶段2_10pct随机复核.csv"
CONVERTED = Path(os.environ.get("NFRA_XLSX_DIR", "work/nfra_xlsx"))
OCR = Path(os.environ.get("OCR_PAGES_DIR", "work/ocr_pdf_pages"))
CACHE = Path(os.environ.get("AUDIT_CACHE_DIR", "work/audit_ocr"))
CACHE.mkdir(parents=True, exist_ok=True)


with AUDIT.open(encoding="utf-8-sig", newline="") as f:
    rows = list(csv.DictReader(f))
fields = list(rows[0])


def normalized_numbers(text: str):
    text = re.sub(r"(?<=\d)[,，]\s*(?=\d)", "", text)
    text = re.sub(r"(?<=\d)\.\s+(?=\d)", ".", text)
    return [float(x) for x in re.findall(r"(?<!\d)[-+]?\d+(?:\.\d+)?", text)]


groups = defaultdict(set)
for r in rows:
    if r["source_file"].lower().endswith(".pdf"):
        m = re.search(r"PDF\s*第(\d+)页", r["source_page"])
        if m:
            groups[r["source_file"]].add(int(m.group(1)))

ocr_text = {}
for filename, pages in groups.items():
    cache = CACHE / f"{Path(filename).stem}.txt"
    result = subprocess.run([str(OCR), str(SRC / filename), *map(str, sorted(pages))],
                            check=True, capture_output=True, text=True)
    cache.write_text(result.stdout, encoding="utf-8")
    chunks = re.split(r"===== .*? \| PDF_PAGE_(\d+) =====\n", result.stdout)
    for i in range(1, len(chunks), 2):
        ocr_text[(filename, int(chunks[i]))] = chunks[i + 1]


def excel_path(filename):
    p = SRC / filename
    return CONVERTED / f"{p.stem}.xlsx" if p.suffix.lower() == ".xls" else p


failures = []
for r in rows:
    expected = float(r["csv_value"])
    if r["source_file"].lower().endswith(".pdf"):
        page = int(re.search(r"PDF\s*第(\d+)页", r["source_page"]).group(1))
        nums = normalized_numbers(ocr_text[(r["source_file"], page)])
        candidates = [abs(expected)]
        if r["unit"] == "人民币百万元" and re.match(r"202[23]Q", r["period"]):
            candidates.append(abs(expected * 100))  # source report uses 万元
        elif r["unit"] == "人民币百万元" and re.match(r"202[456]Q", r["period"]):
            candidates.append(abs(expected * 1_000_000))  # source report uses 元
        matched = any(any(abs(abs(n) - c) <= max(0.0001, c * 1e-9) for n in nums) for c in candidates)
        r["source_recheck_value"] = r["csv_value"] if matched else ""
        r["result"] = "一致" if matched else "OCR未命中，需目视复核"
    else:
        p = excel_path(r["source_file"])
        sheet = re.search(r"《(.+?)》", r["source_page"]).group(1)
        frame = pd.read_excel(p, sheet_name=sheet, header=None)
        line_nums = [int(x) for x in re.findall(r"第(\d+)行", r["source_table"])]
        vals = []
        for line in line_nums:
            cell_nums = []
            for v in frame.iloc[line - 1].tolist():
                if isinstance(v, (int, float)) and not pd.isna(v):
                    cell_nums.append(float(v))
                elif isinstance(v, str):
                    s = v.replace(",", "").strip()
                    if re.fullmatch(r"[-+]?\d+(?:\.\d+)?", s):
                        cell_nums.append(float(s))
            vals.append(cell_nums[-1])
        actual = vals[0] if len(vals) == 1 else vals[0] / vals[1] * 100
        actual = round(actual, 4) if r["unit"] == "%" else round(actual, 6)
        matched = abs(actual - expected) <= 0.00011
        r["source_recheck_value"] = actual
        r["result"] = "一致" if matched else "不一致"
    if r["result"] != "一致":
        failures.append((r["sample_no"], r["source_file"], r["source_page"], r["metric"], r["csv_value"], r["result"]))

with AUDIT.open("w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    w.writerows(rows)

print(f"samples={len(rows)} matched={len(rows)-len(failures)} failures={len(failures)}")
for failure in failures:
    print(failure)
