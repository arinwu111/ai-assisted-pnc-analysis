#!/usr/bin/env python3
from __future__ import annotations

import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "01-数据"
REPORT_DIR = ROOT / "04-报告"
DATA_DIR.mkdir(parents=True, exist_ok=True)
REPORT_DIR.mkdir(parents=True, exist_ok=True)

COR_DEF = "中国平安_年报_2025.pdf，PDF第56页（报告印刷页码52），综合成本率公式"
RESERVE_NOTE = "平安产险_年度信息披露报告_2025.pdf，PDF第31页，未决回溯偏差结果报告"

PERIODS = {
    "2022R": {
        "source": "平安产险_年度信息披露报告_2023.pdf，PDF第120页，分部报告（2022年度已重述）",
        "total_revenue": 294222.187667,
        "segment_operating_profit": [6925.488157, 1464.312290, 194.135447, -7254.570766],
        "segment_other_income": [195.051871, 3.020475, 49.729231, 0.109668],
        "guarantee_revenue": 28358.510941,
        "guarantee_operating_profit": -7254.570766,
        "guarantee_other_income": 0.109668,
    },
    "2023": {
        "source": "平安产险_年度信息披露报告_2023.pdf，PDF第118页，分部报告（2023年度）",
        "total_revenue": 313457.529726,
        "segment_operating_profit": [4855.286223, -159.017177, 252.923080, -6834.353175],
        "segment_other_income": [122.862529, 0.003959, 74.707846, 0.133849],
        "guarantee_revenue": 22002.723838,
        "guarantee_operating_profit": -6834.353175,
        "guarantee_other_income": 0.133849,
    },
    "2024": {
        "source": "平安产险_年度信息披露报告_2025.pdf，PDF第119页，分部报告（2024年度比较数）",
        "total_revenue": 328146.308886,
        "segment_operating_profit": [4397.770028, 1097.803331, 465.268033, -247.854406],
        "segment_other_income": [197.267158, 0.038053, 52.293138, 0.034672],
        "guarantee_revenue": 11532.507005,
        "guarantee_operating_profit": -247.854406,
        "guarantee_other_income": 0.034672,
    },
    "2025": {
        "source": "平安产险_年度信息披露报告_2025.pdf，PDF第117页，分部报告（2025年度）",
        "total_revenue": 338912.305427,
        "segment_operating_profit": [9697.115678, 188.643174, -1004.709604, 2094.629644],
        "segment_other_income": [200.736847, 0.018383, 57.917186, 0.022190],
        "guarantee_revenue": 4415.533885,
        "guarantee_operating_profit": 2094.629644,
        "guarantee_other_income": 0.022190,
    },
}


def n(value: float, decimals: int = 3) -> str:
    return f"{value:.{decimals}f}"


def calc_period(d: dict) -> None:
    d["total_underwriting_profit"] = sum(d["segment_operating_profit"]) - sum(d["segment_other_income"])
    d["guarantee_underwriting_profit"] = d["guarantee_operating_profit"] - d["guarantee_other_income"]
    d["total_cor"] = (1 - d["total_underwriting_profit"] / d["total_revenue"]) * 100
    d["guarantee_cor"] = (1 - d["guarantee_underwriting_profit"] / d["guarantee_revenue"]) * 100
    d["guarantee_weight"] = d["guarantee_revenue"] / d["total_revenue"] * 100
    d["guarantee_drag"] = -d["guarantee_underwriting_profit"] / d["total_revenue"] * 100
    d["other_revenue"] = d["total_revenue"] - d["guarantee_revenue"]
    d["other_underwriting_profit"] = d["total_underwriting_profit"] - d["guarantee_underwriting_profit"]
    d["other_cor"] = (1 - d["other_underwriting_profit"] / d["other_revenue"]) * 100


for d in PERIODS.values():
    calc_period(d)


FIELDS = ["record_type", "period", "entity", "metric", "value", "unit", "status", "formula", "input_sources", "note"]
rows: list[dict[str, str]] = []


def add_direct(period: str, metric: str, value: float, unit: str, source: str, decimals: int = 6, note: str = "") -> None:
    rows.append({
        "record_type": "年度输入",
        "period": period,
        "entity": "平安产险",
        "metric": metric,
        "value": n(value, decimals),
        "unit": unit,
        "status": "直接披露",
        "formula": "直接读取",
        "input_sources": source,
        "note": note or f"直接披露；来源：{source}",
    })


def add_derived(record_type: str, period: str, metric: str, value: float, unit: str,
                formula: str, sources: str, decimals: int = 3, note: str = "") -> None:
    rendered = n(value, decimals)
    tag = f"【推算：{rendered}{unit}｜方法：{formula}｜输入来源：{sources}】"
    rows.append({
        "record_type": record_type,
        "period": period,
        "entity": "平安产险",
        "metric": metric,
        "value": rendered,
        "unit": unit,
        "status": "推算",
        "formula": formula,
        "input_sources": sources,
        "note": tag if not note else f"{tag} {note}",
    })


for period, d in PERIODS.items():
    src = d["source"]
    add_direct(period, "整体保险服务收入", d["total_revenue"], "人民币百万元", src)
    add_direct(period, "保证险保险服务收入", d["guarantee_revenue"], "人民币百万元", src)
    add_direct(period, "保证险分部营业利润", d["guarantee_operating_profit"], "人民币百万元", src)
    add_direct(period, "保证险分部其他收益", d["guarantee_other_income"], "人民币百万元", src)
    op = "+".join(n(x, 6) for x in d["segment_operating_profit"])
    oi = "+".join(n(x, 6) for x in d["segment_other_income"])
    add_derived("年度结果", period, "整体承保利润", d["total_underwriting_profit"], "人民币百万元",
                f"四个保险分部营业利润合计({op})-四个保险分部其他收益合计({oi})", src, 6,
                "与集团年报披露的百万元整数承保利润勾稽，差异仅为四舍五入。")
    add_derived("年度结果", period, "保证险承保利润", d["guarantee_underwriting_profit"], "人民币百万元",
                f"保证险分部营业利润{n(d['guarantee_operating_profit'], 6)}-其他收益{n(d['guarantee_other_income'], 6)}", src, 6)
    add_derived("年度结果", period, "整体COR_精确底数推算", d["total_cor"], "%",
                f"(1-整体承保利润{n(d['total_underwriting_profit'], 6)}/整体保险服务收入{n(d['total_revenue'], 6)})×100",
                f"{src}；{COR_DEF}", 3, "用于精确贡献测算；与集团年报一位小数披露值相符。")
    add_derived("年度结果", period, "保证险COR", d["guarantee_cor"], "%",
                f"(1-保证险承保利润{n(d['guarantee_underwriting_profit'], 6)}/保证险保险服务收入{n(d['guarantee_revenue'], 6)})×100",
                f"{src}；{COR_DEF}", 3)
    add_derived("年度结果", period, "保证险保险服务收入权重", d["guarantee_weight"], "%",
                f"保证险保险服务收入{n(d['guarantee_revenue'], 6)}/整体保险服务收入{n(d['total_revenue'], 6)}×100", src, 3)
    add_derived("年度结果", period, "保证险对整体COR的拖累_正值拖累负值增益", d["guarantee_drag"], "个百分点",
                f"-保证险承保利润{n(d['guarantee_underwriting_profit'], 6)}/整体保险服务收入{n(d['total_revenue'], 6)}×100", src, 3,
                "等价于保证险收入权重×(保证险COR-100%)。")
    add_derived("年度结果", period, "剔除保证险后其他业务保险服务收入", d["other_revenue"], "人民币百万元",
                f"整体保险服务收入{n(d['total_revenue'], 6)}-保证险保险服务收入{n(d['guarantee_revenue'], 6)}", src, 6)
    add_derived("年度结果", period, "剔除保证险后其他业务承保利润", d["other_underwriting_profit"], "人民币百万元",
                f"整体承保利润{n(d['total_underwriting_profit'], 6)}-保证险承保利润({n(d['guarantee_underwriting_profit'], 6)})", src, 6)
    add_derived("年度结果", period, "剔除保证险后其他业务COR", d["other_cor"], "%",
                f"(1-其他业务承保利润{n(d['other_underwriting_profit'], 6)}/其他业务保险服务收入{n(d['other_revenue'], 6)})×100",
                f"{src}；{COR_DEF}", 3, "这是其他业务独立分母口径，最接近“其他业务真实改善”。")


TRANSITIONS = [("2022R", "2023"), ("2023", "2024"), ("2024", "2025"), ("2023", "2025"), ("2022R", "2025")]
for start, end in TRANSITIONS:
    a, b = PERIODS[start], PERIODS[end]
    sources = f"{a['source']}；{b['source']}；{COR_DEF}"
    label = f"{start}→{end}"
    overall_improvement = a["total_cor"] - b["total_cor"]
    guarantee_contribution = a["guarantee_drag"] - b["guarantee_drag"]
    residual_total = overall_improvement - guarantee_contribution
    other_standalone = a["other_cor"] - b["other_cor"]
    profitability_effect = ((a["guarantee_cor"] - 100) - (b["guarantee_cor"] - 100)) * (
        a["guarantee_weight"] / 100 + b["guarantee_weight"] / 100
    ) / 2
    weight_effect = (a["guarantee_weight"] / 100 - b["guarantee_weight"] / 100) * (
        (a["guarantee_cor"] - 100) + (b["guarantee_cor"] - 100)
    ) / 2
    add_derived("期间贡献", label, "整体COR改善", overall_improvement, "个百分点",
                f"{start}整体COR{n(a['total_cor'], 6)}%-{end}整体COR{n(b['total_cor'], 6)}%", sources, 6,
                "正值为改善，负值为恶化。")
    add_derived("期间贡献", label, "保证险贡献的整体COR改善", guarantee_contribution, "个百分点",
                f"{start}保证险整体拖累{n(a['guarantee_drag'], 6)}-{end}保证险整体拖累({n(b['guarantee_drag'], 6)})", sources, 6)
    if overall_improvement != 0:
        add_derived("期间贡献", label, "保证险占整体COR改善份额", guarantee_contribution / overall_improvement * 100, "%",
                    f"保证险贡献{n(guarantee_contribution, 6)}/整体COR改善{n(overall_improvement, 6)}×100", sources, 3,
                    "当整体COR恶化时，该比例只表示方向相反的抵消关系，不解释为改善份额。")
    add_derived("期间贡献", label, "扣除保证险后的其他业务贡献_整体分母", residual_total, "个百分点",
                f"整体COR改善{n(overall_improvement, 6)}-保证险贡献{n(guarantee_contribution, 6)}", sources, 6,
                "可与保证险贡献加总勾稽整体；受整体收入分母和业务结构变化影响。")
    add_derived("期间贡献", label, "其他业务COR独立改善", other_standalone, "个百分点",
                f"{start}其他业务COR{n(a['other_cor'], 6)}%-{end}其他业务COR{n(b['other_cor'], 6)}%", sources, 6,
                "使用剔除保证险后的独立收入分母，最接近其他业务自身表现。")
    add_derived("结构效率拆分", label, "保证险盈利率变化效应_Shapley", profitability_effect, "个百分点",
                f"[(起点保证险COR-100)-(终点保证险COR-100)]×(起终点收入权重均值)", sources, 6,
                "与权重变化效应对半分配交叉项；两项之和等于保证险贡献。")
    add_derived("结构效率拆分", label, "保证险权重变化效应_Shapley", weight_effect, "个百分点",
                f"(起点权重-终点权重)×[(起点保证险COR-100)+(终点保证险COR-100)]/2", sources, 6,
                "正值表示缩量改善整体，负值表示缩小已盈利险种反而减少整体增益。")
    add_derived("校验", label, "Shapley两项与保证险贡献差额", profitability_effect + weight_effect - guarantee_contribution,
                "个百分点", f"盈利率变化效应{n(profitability_effect, 9)}+权重变化效应{n(weight_effect, 9)}-保证险贡献{n(guarantee_contribution, 9)}",
                sources, 6, "应为0；显示值可能有浮点尾差。")


csv_path = DATA_DIR / "阶段3-2_保证保险贡献.csv"
with csv_path.open("w", encoding="utf-8-sig", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=FIELDS)
    writer.writeheader()
    writer.writerows(rows)


data_note = f"""# 阶段3-2 保证保险贡献数据说明

对应 CSV：`阶段3-2_保证保险贡献.csv`。

## 口径

- 使用 `2022R–2025` 的 IFRS 17 可比序列。`2022R` 是平安 2023 年报重述的 2022 比较期；旧准则原报 `2022` 不接入测算。
- 主测算口径不是“原保险保费权重”，而是“保险服务收入权重”，因为新准则 COR 的分母是保险服务收入。用原保费权重乘新准则 COR 会混用口径。
- 整体及保证险承保利润均按分部营业利润扣除保险分部其他收益还原；与集团年报百万元整数披露勾稽。
- “保证险对整体 COR 的拖累”定义为 `-保证险承保利润÷整体保险服务收入`：正数为拖累，负数为增益。
- “扣除保证险后的其他业务贡献”使用整体分母，可与保证险贡献相加；“其他业务 COR 独立改善”使用剔除保证险后的独立分母，更接近其他业务自身表现。两者因分母和结构变化不会完全相等。
- 结构/效率拆分使用两因素 Shapley 分解，只是恒等式拆分，不新增假设。

## 数据来源

- 2022R、2023：`平安产险_年度信息披露报告_2023.pdf`，PDF 第120、118页。
- 2024、2025：`平安产险_年度信息披露报告_2025.pdf`，PDF 第119、117页。
- COR 公式：`中国平安_年报_2025.pdf`，PDF 第56页（报告印刷页码52）。
- 准备金限制说明：`平安产险_年度信息披露报告_2025.pdf`，PDF 第31页披露公司整体未决准备金有利发展，但未按保证险拆分，不能据此把保证险利润直接定义为准备金释放。

## 机械检查

- 每期：整体收入=保证险收入+其他业务收入；整体承保利润=保证险承保利润+其他业务承保利润。
- 每个期间：整体 COR 改善=保证险贡献+其他业务整体分母贡献。
- 每个期间：保证险贡献=盈利率变化效应+权重变化效应。
"""
(DATA_DIR / "阶段3-2_保证保险贡献.md").write_text(data_note, encoding="utf-8")


d22, d23, d24, d25 = PERIODS["2022R"], PERIODS["2023"], PERIODS["2024"], PERIODS["2025"]


def tag(value: str, unit: str, formula: str, sources: str) -> str:
    return f"【推算：{value}{unit}｜方法：{formula}｜输入来源：{sources}】"


s23_25 = f"{d23['source']}；{d25['source']}；{COR_DEF}"
s22_25 = f"{d22['source']}；{d25['source']}；{COR_DEF}"
s23_24 = f"{d23['source']}；{d24['source']}；{COR_DEF}"
s24_25 = f"{d24['source']}；{d25['source']}；{COR_DEF}"

overall_23_25 = d23["total_cor"] - d25["total_cor"]
g_23_25 = d23["guarantee_drag"] - d25["guarantee_drag"]
resid_23_25 = overall_23_25 - g_23_25
share_23_25 = g_23_25 / overall_23_25 * 100
other_23_25 = d23["other_cor"] - d25["other_cor"]
overall_22_25 = d22["total_cor"] - d25["total_cor"]
g_22_25 = d22["guarantee_drag"] - d25["guarantee_drag"]
resid_22_25 = overall_22_25 - g_22_25
share_22_25 = g_22_25 / overall_22_25 * 100
other_22_25 = d22["other_cor"] - d25["other_cor"]


def split_effects(a: dict, b: dict) -> tuple[float, float, float]:
    profitability = ((a["guarantee_cor"] - 100) - (b["guarantee_cor"] - 100)) * (
        a["guarantee_weight"] / 100 + b["guarantee_weight"] / 100
    ) / 2
    weight = (a["guarantee_weight"] / 100 - b["guarantee_weight"] / 100) * (
        (a["guarantee_cor"] - 100) + (b["guarantee_cor"] - 100)
    ) / 2
    return profitability + weight, profitability, weight


g_23_24, profitability_23_24, weight_23_24 = split_effects(d23, d24)
g_24_25, profitability_24_25, weight_24_25 = split_effects(d24, d25)
g_23_25_check, profitability_23_25, weight_23_25 = split_effects(d23, d25)

report = f"""# 阶段 3-2·保证保险贡献：2023–2025 整体 COR 改善约七成来自保证险

## 结论先行

按分部精确底数还原，2023–2025 年整体 COR 改善中约七成来自保证险；其余才是其他业务对整体的贡献。

- {tag(n(overall_23_25, 4), '个百分点', f"2023整体COR{n(d23['total_cor'], 6)}%-2025整体COR{n(d25['total_cor'], 6)}%", s23_25)}
- {tag(n(g_23_25, 4), '个百分点', f"2023保证险整体影响{n(d23['guarantee_drag'], 6)}-2025保证险整体影响({n(d25['guarantee_drag'], 6)})", s23_25)}
- {tag(n(share_23_25, 1), '%', f"保证险贡献{n(g_23_25, 6)}÷整体改善{n(overall_23_25, 6)}×100", s23_25)}
- {tag(n(resid_23_25, 4), '个百分点', f"整体改善{n(overall_23_25, 6)}-保证险贡献{n(g_23_25, 6)}", s23_25)}

这意味着：阶段 3-1 看到的 2023–2025 整体改善，不能全部解释为车险费用管理、风险筛选或普遍承保能力提升；约七成来自保证险这一单一分部从亏损拖累转为利润增益。

## 年度路径

- **2023**：保证险保险服务收入 22002.723838 百万元，来源：`平安产险_年度信息披露报告_2023.pdf`，PDF第118页。{tag(n(d23['guarantee_weight'],3), '%', f"保证险收入{n(d23['guarantee_revenue'],6)}÷整体收入{n(d23['total_revenue'],6)}×100", d23['source'])}{tag(n(d23['guarantee_underwriting_profit'],6), '人民币百万元', f"分部营业利润{n(d23['guarantee_operating_profit'],6)}-其他收益{n(d23['guarantee_other_income'],6)}", d23['source'])}{tag(n(d23['guarantee_cor'],3), '%', f"(1-承保利润({n(d23['guarantee_underwriting_profit'],6)})÷收入{n(d23['guarantee_revenue'],6)})×100", f"{d23['source']}；{COR_DEF}")}{tag(n(d23['guarantee_drag'],3), '个百分点', f"-保证险承保利润({n(d23['guarantee_underwriting_profit'],6)})÷整体收入{n(d23['total_revenue'],6)}×100", d23['source'])}
- **2024**：保证险保险服务收入 11532.507005 百万元，来源：`平安产险_年度信息披露报告_2025.pdf`，PDF第119页。{tag(n(d24['guarantee_weight'],3), '%', f"保证险收入{n(d24['guarantee_revenue'],6)}÷整体收入{n(d24['total_revenue'],6)}×100", d24['source'])}{tag(n(d24['guarantee_underwriting_profit'],6), '人民币百万元', f"分部营业利润{n(d24['guarantee_operating_profit'],6)}-其他收益{n(d24['guarantee_other_income'],6)}", d24['source'])}{tag(n(d24['guarantee_cor'],3), '%', f"(1-承保利润({n(d24['guarantee_underwriting_profit'],6)})÷收入{n(d24['guarantee_revenue'],6)})×100", f"{d24['source']}；{COR_DEF}")}{tag(n(d24['guarantee_drag'],3), '个百分点', f"-保证险承保利润({n(d24['guarantee_underwriting_profit'],6)})÷整体收入{n(d24['total_revenue'],6)}×100", d24['source'])}
- **2025**：保证险保险服务收入 4415.533885 百万元，来源：`平安产险_年度信息披露报告_2025.pdf`，PDF第117页。{tag(n(d25['guarantee_weight'],3), '%', f"保证险收入{n(d25['guarantee_revenue'],6)}÷整体收入{n(d25['total_revenue'],6)}×100", d25['source'])}{tag(n(d25['guarantee_underwriting_profit'],6), '人民币百万元', f"分部营业利润{n(d25['guarantee_operating_profit'],6)}-其他收益{n(d25['guarantee_other_income'],6)}", d25['source'])}{tag(n(d25['guarantee_cor'],3), '%', f"(1-承保利润{n(d25['guarantee_underwriting_profit'],6)}÷收入{n(d25['guarantee_revenue'],6)})×100", f"{d25['source']}；{COR_DEF}")}{tag(n(-d25['guarantee_drag'],3), '个百分点', f"保证险承保利润{n(d25['guarantee_underwriting_profit'],6)}÷整体收入{n(d25['total_revenue'],6)}×100", d25['source'])}

保证险收入权重连续下降，分部 COR 则由亏损区间转入高利润区间；完整逐年数据和公式见 `01-数据/阶段3-2_保证保险贡献.csv`。

## “其他业务真实改善”有两个口径

1. **用于整体归因的加总口径**：{tag(n(resid_23_25, 4), '个百分点', f"整体改善{n(overall_23_25, 6)}-保证险贡献{n(g_23_25, 6)}", s23_25)}。它与保证险贡献相加，严格勾稽整体改善。
2. **用于看其他业务自身经营的独立分母口径**：{tag(n(other_23_25,4), '个百分点', f"2023其他业务COR{n(d23['other_cor'],6)}%-2025其他业务COR{n(d25['other_cor'],6)}%", s23_25)}。

两者不完全相等，是因为保证险收入权重下降、整体分母增长。回答“整体改善由谁贡献”用第一个；回答“其他业务自己变好了多少”用第二个。

## 不应把全部贡献都叫“规模出清”

用两因素 Shapley 恒等式把保证险贡献拆成“分部 COR 变化”和“收入权重变化”：

- **2023→2024**：{tag(n(g_23_24,4), '个百分点', f"盈利率变化效应{n(profitability_23_24,6)}+权重变化效应{n(weight_23_24,6)}", s23_24)}。其中，{tag(n(profitability_23_24,4), '个百分点', '保证险超额COR变化×起终点收入权重均值', s23_24)}；{tag(n(weight_23_24,4), '个百分点', '收入权重变化×起终点超额COR均值', s23_24)}。亏损率收窄和缩量都改善整体。
- **2024→2025**：{tag(n(g_24_25,4), '个百分点', f"盈利率变化效应{n(profitability_24_25,6)}+权重变化效应({n(weight_24_25,6)})", s24_25)}。其中，{tag(n(profitability_24_25,4), '个百分点', '保证险超额COR变化×起终点收入权重均值', s24_25)}；{tag(n(weight_24_25,4), '个百分点', '收入权重变化×起终点超额COR均值', s24_25)}。保证险转为高利润后继续缩量，权重变化反而减少整体增益。
- **2023→2025**：{tag(n(g_23_25_check,4), '个百分点', f"盈利率变化效应{n(profitability_23_25,6)}+权重变化效应({n(weight_23_25,6)})", s23_25)}。其中，{tag(n(profitability_23_25,4), '个百分点', '保证险超额COR变化×起终点收入权重均值', s23_25)}；{tag(n(weight_23_25,4), '个百分点', '收入权重变化×起终点超额COR均值', s23_25)}。累计贡献主要来自账面盈利率转正，不是单纯收入权重下降。

所以，“保证险出清”更准确的表达是：存量规模持续收缩，同时分部账面 COR 从亏损区间跨到高利润区间；在 2024→2025 这一步，缩量本身已经不是改善来源，真正推高整体的是分部盈利率变化。

## 2022R 为什么值得保留

旧准则原报 2022 不进入趋势；但 IFRS 17 重述的 `2022R` 可以作为可比锚点。若从 2022R 看至 2025：

- {tag(n(overall_22_25,4), '个百分点', f"2022R整体COR{n(d22['total_cor'],6)}%-2025整体COR{n(d25['total_cor'],6)}%", s22_25)}
- {tag(n(g_22_25,4), '个百分点', f"2022R保证险整体影响{n(d22['guarantee_drag'],6)}-2025保证险整体影响({n(d25['guarantee_drag'],6)})", s22_25)}；{tag(n(share_22_25,1), '%', f"保证险贡献{n(g_22_25,6)}÷整体改善{n(overall_22_25,6)}×100", s22_25)}
- {tag(n(resid_22_25,4), '个百分点', f"整体改善{n(overall_22_25,6)}-保证险贡献{n(g_22_25,6)}", s22_25)}，即扣除保证险后，对整体是轻微拖累。
- {tag(n(-other_22_25,4), '个百分点', f"2025其他业务COR{n(d25['other_cor'],6)}%-2022R其他业务COR{n(d22['other_cor'],6)}%", s22_25)}，即其他业务独立 COR 恶化。

因此，选择 2023 作为起点时，其他业务确实改善；把可比窗口扩展到 2022R，则其他业务尚未回到 2022R 的 COR 水平。两者都成立，必须同时写清起点。

## 一次性与可持续性限制

2025 年保证险保险服务收入为 4415.533885 百万元，来源：`平安产险_年度信息披露报告_2025.pdf`，PDF第117页。{tag(n(d25['guarantee_underwriting_profit'],6), '人民币百万元', f"分部营业利润{n(d25['guarantee_operating_profit'],6)}-其他收益{n(d25['guarantee_other_income'],6)}", d25['source'])}{tag(n(d25['guarantee_cor'],3), '%', f"(1-保证险承保利润{n(d25['guarantee_underwriting_profit'],6)}/保险服务收入{n(d25['guarantee_revenue'],6)})×100", f"{d25['source']}；{COR_DEF}")}

同一年度披露报告称，公司整体 2023 年末、2024 年末未决赔款准备金后来分别出现 315.6 亿元、203.8 亿元有利进展，并说明风险边际会随赔案发展自然释放；但该说明是公司整体口径，且脚注注明回溯财务数据按旧保险合同等准则编制，没有给出保证险分拆。来源：`{RESERVE_NOTE}`。

因此，现有公开数据只支持确认保证险在 2025 年产生了很高的账面承保利润，不支持把其中多少精确归因于准备金释放、理赔经验改善或其他因素。上述推算 COR 不应直接当作新增保证险业务的稳态盈利率，也不应线性外推。

## 对核心问题的阶段性回答

- **2023–2025 的整体改善**：保证险贡献约七成；其余才是其他业务对整体的贡献。其他业务自身 COR 也有改善，但幅度明显小于整体。
- **从完整可比锚点 2022R 看**：保证险贡献超过整体改善，掩盖了其他业务仍比 2022R 略差的事实。
- **持续性**：保证险收入权重已降至低个位数，“由巨亏到盈利”的历史贡献不能作为每年可重复的基准；后续更应监控剔除保证险后的其他业务 COR，而不是继续把整体 COR 改善全部当作可持续能力。

## 本块停点

阶段 3-2 完成。下一块是新能源结构性成本上移敏感性；其中新能源与燃油车 COR 差距 `x` 必须由你确认区间后才能计算，本阶段不预设。
"""
(REPORT_DIR / "阶段3-2_保证保险贡献.md").write_text(report, encoding="utf-8")

print(f"wrote {csv_path}")
print(f"wrote {DATA_DIR / '阶段3-2_保证保险贡献.md'}")
print(f"wrote {REPORT_DIR / '阶段3-2_保证保险贡献.md'}")
print(f"rows={len(rows)}")
