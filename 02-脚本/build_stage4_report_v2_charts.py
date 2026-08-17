# -*- coding: utf-8 -*-
"""阶段4优化版报告：内嵌 SVG 图表生成。全部离线，不依赖任何 CDN。"""

from build_stage4_report_v2_data import *

NAVY, BLUE, ACC = "#17365d", "#1f4e78", "#2e75b6"
GREEN, YELLOW, RED = "#2f7a3e", "#b8860b", "#c0392b"
GRID, MUTED, INK = "#d7e0ee", "#5b6472", "#1f2937"
FONT = 'font-family="-apple-system,BlinkMacSystemFont,PingFang SC,Microsoft YaHei,sans-serif"'


def esc(s):
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


def head(w, h, title, desc):
    return (f'<svg viewBox="0 0 {w} {h}" width="100%" role="img" '
            f'aria-labelledby="t{abs(hash(title))%99999}" preserveAspectRatio="xMidYMid meet" '
            f'xmlns="http://www.w3.org/2000/svg" {FONT}>'
            f'<title>{esc(title)}</title><desc>{esc(desc)}</desc>'
            f'<rect width="{w}" height="{h}" fill="#ffffff"/>')


def txt(x, y, s, size=12, fill=INK, anchor="start", weight="normal"):
    return (f'<text x="{x:.1f}" y="{y:.1f}" font-size="{size}" fill="{fill}" '
            f'text-anchor="{anchor}" font-weight="{weight}">{esc(s)}</text>')


def line(x1, y1, x2, y2, stroke=GRID, w=1, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ""
    return (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
            f'stroke="{stroke}" stroke-width="{w}"{d}/>')


def rect(x, y, w, h, fill, op=1.0, rx=2, stroke="none"):
    return (f'<rect x="{x:.1f}" y="{y:.1f}" width="{max(w,0):.1f}" height="{max(h,0):.1f}" '
            f'fill="{fill}" fill-opacity="{op}" rx="{rx}" stroke="{stroke}"/>')


def note(w, h, s):
    """图内口径角标。"""
    return txt(12, h - 10, s, 10.5, MUTED)


def notes(w, h, lines, size=10.5):
    """多行图内口径角标，自下而上排列。"""
    return "".join(txt(12, h - 10 - (len(lines) - 1 - i) * 15, t, size, MUTED)
                   for i, t in enumerate(lines))


# =========================================================== 图1 经营驾驶舱
def chart_dashboard():
    W, H = 1000, 762
    s = [head(W, H, "一页经营驾驶舱",
              "公司结果更新至2026Q1，行业数据更新至2026Q2；含规模、承保、利润、资本、预警与三项优先动作。")]
    s.append(rect(0, 0, W, 54, NAVY, 1, 0))
    s.append(txt(24, 25, "图1　平安产险一页经营驾驶舱", 16, "#ffffff", "start", "bold"))
    s.append(txt(24, 43, "核心问题：这一轮承保利润改善，多少来自自身能力，多少来自外部环境？还能持续多久？",
                 11, "#c9dcf5"))
    s.append(txt(W - 24, 25, "公司经营结果：2026Q1（最新已披露）", 10.5, "#ffffff", "end", "bold"))
    s.append(txt(W - 24, 42, "行业月度数据：2026Q2（2026年6月）　制表日 2026-08-16", 10, "#c9dcf5", "end"))

    # ---------------- A 关键结果卡片
    def tile(x, y, w, h, label, value, sub, tone=INK, band=None):
        o = [rect(x, y, w, h, "#ffffff", 1, 8, "#dce5f0")]
        if band:
            o.append(rect(x, y, 4, h, band, 1, 2))
        o.append(txt(x + 14, y + 20, label, 10.5, MUTED))
        o.append(txt(x + 14, y + 45, value, 20, tone, "start", "bold"))
        for i, t in enumerate(sub):
            o.append(txt(x + 14, y + 63 + i * 14, t, 9.5, MUTED))
        return "".join(o)

    s.append(txt(24, 78, "A　经营结果（左四格＝2026Q1偿付能力季度累计口径；右四格＝2025年度集团年报 IFRS 17 口径）",
                 12, BLUE, "start", "bold"))
    q26, q25 = QIDX["2026Q1"], QIDX["2025Q1"]
    tw, th, gap = 232, 92, 12
    cards_q = [
        ("整体综合成本率　2026Q1", "94.90%", ["同比 −0.70pp（95.60%→94.90%）", "赔付率 +0.50pp，费用率 −1.20pp"], GREEN, GREEN),
        ("签单保费 YTD　2026Q1", "95,423", ["百万元　同比 +6.84%", "行业财产险原保费同比 −1.34%（口径不同）"], NAVY, GREEN),
        ("净利润 YTD　2026Q1", "2,789", ["百万元　同比 −17.25%", "承保改善未同向传导到最终利润"], RED, YELLOW),
        ("综合偿付能力　2026Q1末", "217.9%", ["核心偿付能力 171.9%", "监管最低 100% / 50%"], NAVY, GREEN),
    ]
    for i, (lb, v, sub, tone, band) in enumerate(cards_q):
        s.append(tile(24 + i * (tw + gap), 88, tw, th, lb, v, sub, tone, band))
    cards_y = [
        ("整体综合成本率　2025", "96.80%", ["同比 −1.50pp；同业均值 −1.20pp", "平安超额仅 +0.30pp"], GREEN, GREEN),
        ("承保利润　2025", "10,717", ["百万元　同比 +96.17%", "2023 年为 −2,083 百万元"], GREEN, GREEN),
        ("总投资收益　2025", "11,927", ["百万元　同比 −26.03%", "抵消了承保端的全部增量"], RED, RED),
        ("净利润　2025", "14,597", ["百万元　同比 −2.82%", "承保 +5,254，投资 −4,198"], RED, YELLOW),
    ]
    for i, (lb, v, sub, tone, band) in enumerate(cards_y):
        s.append(tile(24 + i * (tw + gap), 88 + th + 10, tw, th, lb, v, sub, tone, band))

    # ---------------- B 三轴归因
    TY = 300
    s.append(txt(24, TY, "B　“自身能力 vs 外部环境”：三条互不相加的拆解轴", 12, BLUE, "start", "bold"))
    s.append(rect(24, TY + 10, 600, 240, "#f7f9fc", 1, 8, "#dce5f0"))

    def barpair(y, title, items, span):
        """条形按绝对值等比例排列；宽度足够时把“名称 值”写在条内，太窄的写在条上方。"""
        o = [txt(38, y, title, 10.5, NAVY, "start", "bold")]
        x0, wtot = 186, 316
        cum = 0
        for nm, v, col in items:
            w = abs(v) / span * wtot
            o.append(rect(x0 + cum, y - 11, w, 14, col, 0.88, 2))
            lab = f"{nm} {v:+.2f}"
            if w >= 8.2 * len(lab):
                o.append(txt(x0 + cum + w / 2, y, lab, 9, "#ffffff", "middle", "bold"))
            elif w >= 34:
                o.append(txt(x0 + cum + w / 2, y, f"{v:+.2f}", 9, "#ffffff", "middle", "bold"))
                o.append(txt(x0 + cum + w / 2, y - 14, nm, 8.5, MUTED, "middle"))
            else:
                o.append(txt(x0 + cum + w / 2, y - 14, f"{nm} {v:+.2f}", 8.5, col, "middle", "bold"))
                o.append(line(x0 + cum + w / 2, y - 12, x0 + cum + w / 2, y - 11, col, 1))
            cum += w
        return "".join(o)

    s.append(txt(38, TY + 30, "窗口一　2023→2025　整体COR改善 3.90pp（年报一位小数）／3.8267pp（分部精确底数）",
                 10.5, INK, "start", "bold"))
    s.append(barpair(TY + 54, "轴A｜公司间 3.90", [("行业共同", 0.25, "#9aa5b1"), ("平安差异化", 3.65, ACC)], 4.35))
    s.append(barpair(TY + 78, "轴B｜险种 3.8267", [("保证险", 2.80, "#a4562f"), ("车险", 1.29, ACC),
                                                ("核心非车", -0.26, RED)], 4.35))
    s.append(barpair(TY + 102, "轴C｜成本项 3.90", [("费用率", 2.80, GREEN), ("赔付率", 1.10, ACC)], 4.35))
    s.append(line(38, TY + 114, 612, TY + 114, GRID))
    s.append(txt(38, TY + 132, "窗口二　2024→2025　整体COR改善 1.50pp（年报一位小数）／1.4973pp（精确底数）",
                 10.5, INK, "start", "bold"))
    s.append(barpair(TY + 156, "轴A｜公司间 1.50", [("行业共同", 1.20, "#9aa5b1"), ("平安超额", 0.30, ACC)], 2.93))
    s.append(barpair(TY + 180, "轴B｜险种 1.4973", [("保证险", 0.69, "#a4562f"), ("车险", 1.52, ACC),
                                                 ("核心非车", -0.72, RED)], 2.93))
    s.append(barpair(TY + 204, "轴C｜成本项 1.50", [("费用率", 0.90, GREEN), ("赔付率", 0.60, ACC)], 2.93))
    s.append(txt(38, TY + 226, "红色为反向贡献，按绝对值等长排列。三轴切分方式不同（公司间／险种／成本项），"
                               "同一笔改善会在不同轴上重复出现，不得相加。", 9.5, MUTED))

    # ---------------- C 关键判断
    s.append(rect(636, TY + 10, 340, 240, "#fdf6e8", 1, 8, "#e8d9b0"))
    s.append(txt(650, TY + 32, "关键判断（最新一年最有说服力）", 11.5, NAVY, "start", "bold"))
    jl = [
        ("2024→2025 平安COR改善", "1.4973 pp", NAVY),
        ("其中保证险单项贡献", "0.6936 pp", "#a4562f"),
        ("剔除保证险后剩余改善", "0.8037 pp", ACC),
        ("同期同业均值改善", "1.2000 pp", MUTED),
        ("剔除保证险后 vs 同业", "−0.3963 pp", RED),
    ]
    for i, (a, b, c) in enumerate(jl):
        y = TY + 56 + i * 22
        s.append(txt(650, y, a, 10.5, INK))
        s.append(txt(962, y, b, 11, c, "end", "bold"))
    s.append(line(650, TY + 176, 962, TY + 176, "#e8d9b0"))
    for i, t in enumerate([
        "把保证险这项阶段性贡献拿掉，最新一年平安的",
        "承保改善已经慢于同业均值。同业未做同口径剔除，",
        "这是不对称比较，只作方向提示。",
    ]):
        s.append(txt(650, TY + 196 + i * 15, t, 9.5, MUTED))

    # ---------------- D 预警
    DY = 570
    s.append(txt(24, DY, "C　预警面板（16项常态指标，阈值为管理判断，不是监管标准）", 12, BLUE, "start", "bold"))
    cnt = {"RED": 0, "SCENARIO RED": 0, "YELLOW": 0, "GREEN": 0}
    for r in INDICATORS:
        cnt[r[7]] += 1
    s.append(rect(24, DY + 10, 300, 152, "#ffffff", 1, 8, "#dce5f0"))
    for i, (k, lb, col) in enumerate([("RED", "红灯", RED), ("SCENARIO RED", "情景红灯", "#a4562f"),
                                      ("YELLOW", "黄灯", YELLOW), ("GREEN", "绿灯", GREEN)]):
        x = 38 + (i % 2) * 145
        y = DY + 34 + (i // 2) * 58
        s.append(rect(x, y - 18, 130, 46, col, 0.12, 6, col))
        s.append(txt(x + 12, y + 6, str(cnt[k]), 22, col, "start", "bold"))
        s.append(txt(x + 46, y + 5, lb, 11, INK, "start", "bold"))
    s.append(rect(336, DY + 10, 300, 152, "#ffffff", 1, 8, "#dce5f0"))
    s.append(txt(350, DY + 30, "红灯明细", 11, NAVY, "start", "bold"))
    reds = [(r[0], r[2], r[3], r[4], r[7]) for r in INDICATORS if "RED" in r[7]]
    for i, (mid, nm, v, u, st) in enumerate(reds):
        y = DY + 50 + i * 19
        s.append(txt(350, y, f"{mid}　{nm}", 10, INK))
        s.append(txt(622, y, f"{v:,.4g}{u}", 10, "#a4562f" if st == "SCENARIO RED" else RED, "end", "bold"))

    # 外部环境
    s.append(rect(648, DY + 10, 328, 152, "#ffffff", 1, 8, "#dce5f0"))
    s.append(txt(662, DY + 30, "外部环境　行业2026Q2（最新公开月度）", 10.5, NAVY, "start", "bold"))
    s.append(txt(662, DY + 50, "1–6月财产险原保费 7,678.88 亿元，同比 −0.84%", 9.5, INK))
    s.append(txt(662, DY + 66, "1–6月简单赔付率代理 58.58%，上年同期 57.26%", 9.5, INK))
    px0, py0, pw, ph = 662, DY + 80, 262, 44
    ymn, ymx = 46, 64
    for yr, col, dy in [("2025", "#9aa5b1", 12), ("2026", RED, -4)]:
        pts = []
        for m, prem, clm, rate in INDUSTRY_M[yr]:
            xx = px0 + (m - 1) / 5 * pw
            yy = py0 + ph - (rate - ymn) / (ymx - ymn) * ph
            pts.append(f"{xx:.1f},{yy:.1f}")
            s.append(f'<circle cx="{xx:.1f}" cy="{yy:.1f}" r="2" fill="{col}"/>')
        s.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{col}" stroke-width="2"/>')
        s.append(txt(px0 + pw + 6, float(pts[-1].split(",")[1]) + dy, yr, 9.5, col, "start", "bold"))
    s.append(txt(px0, DY + 132, "累计简单赔付率代理值，1—6月", 8.5, MUTED))
    s.append(txt(662, DY + 146, "行业赔付端连续6个月高于上年同期，公司赔付率2026Q1同步转差。",
                 9.5, MUTED))

    s.append(txt(12, H - 24, "时间：公司2026Q1及2025年度，行业至2026年6月　单位：见各格　"
                             "口径：季度为偿付能力监管口径，年度为集团年报IFRS 17口径，行业为监管统计口径，三者不互换",
                 10.5, MUTED))
    s.append(note(W, H, "来源：平安产险_偿付能力报告_2025Q1.pdf / 2026Q1.pdf，PDF第18页；中国平安_年报_2024.pdf、2025.pdf；"
                        "监管总局_保险业经营情况表_2025-06.xls、2026-06.xls；01-数据/阶段3-1至3-5、阶段4各表"))
    s.append("</svg>")
    return "".join(s)


# =========================================================== 图2 结构图
def chart_structure():
    W, H = 1000, 640
    s = [head(W, H, "完整经营分析结构图", "五层经营分析链条：目标、结果、驱动、方法、专题与输出，底座为数据与治理。")]
    s.append(txt(W / 2, 26, "图2　完整经营分析结构图（自上而下追问，自下而上支撑）", 15, NAVY, "middle", "bold"))

    def box(x, y, w, h, title, body, fill, stroke):
        o = [rect(x, y, w, h, fill, 1, 6, stroke)]
        o.append(txt(x + w / 2, y + 18, title, 12.5, NAVY, "middle", "bold"))
        for i, ln in enumerate(body):
            o.append(txt(x + w / 2, y + 34 + i * 13, ln, 10.5, INK, "middle"))
        return "".join(o)

    def band(y, h, label, fill):
        return (rect(28, y, 944, h, fill, 1, 8, "#c9d6e8") +
                txt(40, y + 17, label, 12, BLUE, "start", "bold"))

    # 顶：总目标
    s.append(rect(300, 40, 400, 40, "#17365d", 1, 8))
    s.append(txt(500, 65, "总目标：在资本与风险约束下实现可持续的盈利增长", 13, "#ffffff", "middle", "bold"))

    layers = [
        (96, "第一层｜经营结果", "#f4f8fd", [
            ("规模", ["签单保费/保险服务收入", "客户数、标的数"]),
            ("承保", ["COR、赔付率、费用率", "承保利润"]),
            ("最终利润", ["投资收益、其他损益", "净利润"]),
            ("风险与资本", ["偿付能力、准备金", "再保险、资本消耗"]),
            ("经营质量", ["续保、客户风险", "服务、投诉、渠道"]),
        ]),
        (196, "第二层｜经营驱动", "#eef4fb", [
            ("规模驱动", ["量 × 价 × 结构"]),
            ("赔付驱动", ["频次 × 案均赔款", "＋准备金发展"]),
            ("费用驱动", ["获客/渠道/运营/理赔", "固定成本摊薄"]),
            ("利润驱动", ["承保＋投资＋其他", "－税费"]),
            ("风险驱动", ["资本占用、集中度", "巨灾、信用、流动性"]),
        ]),
        (296, "第三层｜固定分析方法", "#e8f0f9", [
            ("趋势与预算", ["同比/环比/预算差"]),
            ("结构与贡献", ["险种/客户/渠道/地区"]),
            ("量价与频次", ["量价分解、频次×案均"]),
            ("桥接与同业", ["瀑布归因、共同因素"]),
            ("持续性与情景", ["一次性/周期性/能力性"]),
        ]),
        (396, "第四层｜异常与专题", "#fdf6e8", [
            ("保证险出清", ["对整体COR改善的贡献"]),
            ("新能源车险", ["占比提升与COR敏感性"]),
            ("核心非车压力", ["责任险等险种拖累"]),
            ("费用率改善", ["行业因素还是自身效率"]),
            ("同业对标", ["剥离行业共同因素"]),
        ]),
        (496, "第五层｜管理输出", "#f0f7f0", [
            ("管理驾驶舱", ["结论、预警、关键图表"]),
            ("问题清单", ["异常点、责任单元"]),
            ("行动方案", ["动作、时点、预期影响"]),
            ("复盘闭环", ["领先指标、结果指标"]),
            ("数据缺口", ["需要内部数据验证项"]),
        ]),
    ]
    for y, label, fill, items in layers:
        s.append(band(y, 88, label, fill))
        n = len(items)
        bw = 168
        gap = (944 - 24 - n * bw) / (n - 1)
        for i, (t, body) in enumerate(items):
            x = 40 + i * (bw + gap)
            s.append(box(x, y + 24, bw, 56, t, body, "#ffffff", "#c9d6e8"))
        if y < 496:
            s.append(f'<path d="M500 {y+88} L500 {y+96}" stroke="{BLUE}" stroke-width="2"/>')
            s.append(f'<path d="M494 {y+92} L500 {y+100} L506 {y+92} Z" fill="{BLUE}"/>')
    s.append(f'<path d="M500 80 L500 96" stroke="{BLUE}" stroke-width="2"/>')

    # 底座
    s.append(rect(28, 596, 944, 34, "#eceff4", 1, 8, "#c9d6e8"))
    s.append(txt(40, 617, "底座｜数据与治理：保单・客户・标的・赔案・费用・财务・资本・行业同业 ＋ 口径字典、来源页码、可比区间、准则断点、机械校验、抽样回查、协作日志",
                 11, BLUE, "start", "bold"))
    # 反馈回路
    s.append(f'<path d="M972 540 C 996 540 996 140 972 140" fill="none" stroke="{GREEN}" stroke-width="1.6" stroke-dasharray="5 4"/>')
    s.append(f'<path d="M978 146 L972 136 L966 146 Z" fill="{GREEN}"/>')
    s.append(txt(986, 350, "效果反馈", 10.5, GREEN, "middle") if False else "")
    s.append(f'<text x="990" y="345" font-size="10.5" fill="{GREEN}" text-anchor="middle" transform="rotate(90 990 345)">效果反馈闭环</text>')
    s.append(note(W, H, "时间：适用于月度/季度经营复盘　单位：不适用（结构图）　口径：本项目公开数据边界　来源：04-报告/平安产险经营分析框架.md 第二节"))
    s.append("</svg>")
    return "".join(s)


# =========================================================== 图3 规模趋势
def chart_scale():
    W, H = 1000, 660
    s = [head(W, H, "保费与保险服务收入趋势", "旧准则2022与新准则2022R–2025分区展示，中间设准则断点；下方为各年一季度签单保费。")]
    s.append(txt(W / 2, 26, "图3　规模趋势：旧准则区间与新准则区间分开展示", 15, NAVY, "middle", "bold"))
    s.append(txt(W / 2, 46, "上：年度（左＝2022旧准则已赚保费与原保险保费；右＝2022R–2025 保险服务收入，IFRS 17）　"
                            "下：各年一季度签单保费（偿付能力口径）", 11, MUTED, "middle"))

    # ---------------- 面板A 年度
    L, R, T, B = 78, 962, 116, 336
    vmax = 360000
    def sy(v): return B - v / vmax * (B - T)
    s.append(txt(L - 66, T - 26, "人民币十亿元", 10.5, MUTED, "start"))
    for g in range(0, 360001, 60000):
        s.append(line(L, sy(g), R, sy(g), GRID))
        s.append(txt(L - 8, sy(g) + 4, f"{g//1000:,}", 10.5, MUTED, "end"))

    s.append(rect(L, T - 8, 168, B - T + 8, "#f6f7f9", 1, 4))
    s.append(txt(L + 84, T - 18, "旧准则区间（不接入趋势）", 11, MUTED, "middle", "bold"))
    old = [("原保险保费", OLD2022["原保险保费收入"]), ("已赚保费", OLD2022["已赚保费"])]
    for i, (nm, v) in enumerate(old):
        x = L + 26 + i * 68
        s.append(rect(x, sy(v), 48, B - sy(v), "#9aa5b1", 0.95))
        s.append(txt(x + 24, sy(v) - 7, f"{v:,}", 10, INK, "middle"))
        s.append(txt(x + 24, B + 18, nm, 10.5, MUTED, "middle"))
    s.append(txt(L + 84, B + 36, "2022（旧准则原报）", 10.5, MUTED, "middle"))

    bx = L + 190
    s.append(line(bx, T - 34, bx, B + 46, RED, 2, "6 5"))
    s.append(txt(bx, T - 44, "新旧准则断点", 11, RED, "middle", "bold"))
    s.append(txt(bx, T - 58, "IFRS 17 ／ 新保险合同准则自 2023-01-01 起执行", 9.5, RED, "middle"))

    periods = ["2022R", "2023", "2024", "2025"]
    x0 = bx + 34
    slot = (R - x0) / len(periods)
    for i, pp in enumerate(periods):
        dd = ANNUAL[pp]
        cx = x0 + slot * i + slot / 2
        bw = 52
        s.append(rect(cx - bw - 4, sy(dd["rev"]), bw, B - sy(dd["rev"]), ACC, 0.95))
        s.append(txt(cx - bw / 2 - 4, sy(dd["rev"]) - 7, f'{dd["rev"]:,}', 10, INK, "middle"))
        av = dd.get("auto_rev", SEGMENTS.get(pp, {}).get("车险", (None,))[0])
        s.append(rect(cx + 4, sy(av), bw, B - sy(av), NAVY, 0.88))
        s.append(txt(cx + bw / 2 + 4, sy(av) - 7, f"{av:,.0f}", 10, INK, "middle"))
        s.append(txt(cx, B + 18, pp, 11.5, NAVY, "middle", "bold"))
        if pp == "2022R":
            s.append(txt(cx, B + 34, "重述口径", 10, RED, "middle", "bold"))
    for i, (lb, col) in enumerate([("保险服务收入（IFRS 17）", ACC), ("其中：车险保险服务收入", NAVY)]):
        s.append(rect(x0 + 10 + i * 230, B + 46, 20, 10, col, 0.92))
        s.append(txt(x0 + 36 + i * 230, B + 55, lb, 10.5, INK))

    # ---------------- 面板B 各年一季度签单保费
    T2, B2 = 440, 556
    s.append(txt(L, T2 - 22, "各年一季度签单保费（偿付能力口径，年初至报告期末累计，人民币百万元）；"
                             "2022Q1 属旧准则报告期，仅并列不连线", 11.5, BLUE, "start", "bold"))
    q1 = [("2022Q1", QIDX["2022Q1"][3]), ("2023Q1", QIDX["2023Q1"][3]), ("2024Q1", QIDX["2024Q1"][3]),
          ("2025Q1", QIDX["2025Q1"][3]), ("2026Q1", QIDX["2026Q1"][3])]
    qmax = 110000
    gw = (R - L - 40) / len(q1)
    for i, (pp, v) in enumerate(q1):
        x = L + 30 + i * gw
        h = v / qmax * (B2 - T2)
        col = "#9aa5b1" if pp.startswith("2022") else ACC
        s.append(rect(x, B2 - h, 92, h, col, 0.95))
        s.append(txt(x + 46, B2 - h - 7, f"{v:,.0f}", 10.5, INK, "middle", "bold"))
        s.append(txt(x + 46, B2 + 18, pp, 11, MUTED, "middle", "bold"))
        if i:
            yy = (v / q1[i - 1][1] - 1) * 100
            if i > 1:
                s.append(txt(x + 46, B2 + 33, f"同比 {yy:+.2f}%", 9.5, GREEN if yy > 0 else RED, "middle"))
    bq = L + 30 + gw - 12
    s.append(line(bq, T2 - 6, bq, B2 + 48, RED, 1.8, "5 4"))
    s.append(txt(bq + 6, B2 + 46, "准则断点：签单保费为业务统计口径、定义稳定，此处只提示会计区间的分界",
                 9.5, RED, "start"))
    s.append(line(L, B2, R, B2, MUTED, 1))

    s.append(notes(W, H, [
        "时间：年度 2022–2025；季度为各年第一季度，2026Q1 为公司最新已披露期　单位：人民币百万元（左轴刻度为十亿元）",
        "口径：2022 为旧准则原报（分母为已赚保费），2022R 为 IFRS 17 重述比较期，2023–2025 为新准则保险服务收入；季度签单保费为偿付能力监管口径",
        "来源：中国平安_年报_2022／2023／2024／2025.pdf，PDF 第35／27／46／56–57页；平安产险_偿付能力报告_2022Q1 至 2026Q1.pdf，各期 PDF 第18页",
    ]))
    s.append("</svg>")
    return "".join(s)


# =========================================================== 图4 COR 趋势
def chart_cor_trend():
    W, H = 1000, 570
    s = [head(W, H, "COR、赔付率与费用率趋势", "年度与季度双面板，均在2022/2023处标注准则断点，两套口径不连线。")]
    s.append(txt(W / 2, 26, "图4　COR、赔付率、费用率趋势（含新旧准则断点）", 15, NAVY, "middle", "bold"))

    vmin, vmax = 24, 104
    ANN = ["2022R", "2023", "2024", "2025"]
    series = [("综合成本率", NAVY, "cor", 5), ("赔付率", ACC, "loss", 7), ("费用率", GREEN, "exp", 6)]

    # ---------- 面板A 年度
    L, R, T, B = 78, 468, 118, 316
    def sy(v): return B - (v - vmin) / (vmax - vmin) * (B - T)
    s.append(txt(L, T - 44, "A　年度（%，集团年报 IFRS 17 口径）", 12, BLUE, "start", "bold"))
    for g in [30, 50, 70, 90, 100]:
        s.append(line(L, sy(g), R, sy(g), GRID))
        s.append(txt(L - 8, sy(g) + 4, str(g), 10, MUTED, "end"))
    s.append(line(L, sy(100), R, sy(100), RED, 1.2, "4 4"))

    x_old = L + 36
    xs_new = [L + 138 + i * 76 for i in range(4)]
    bx = L + 92
    s.append(rect(L + 8, T - 6, 56, B - T + 6, "#f6f7f9", 1, 4))
    s.append(line(bx, T - 22, bx, B + 40, RED, 2, "6 5"))
    s.append(txt(bx, T - 28, "准则断点", 10, RED, "middle", "bold"))
    for nm, col, key, _q in series:
        v = OLD2022[{"cor": "综合成本率", "loss": "赔付率", "exp": "费用率"}[key]]
        s.append(f'<circle cx="{x_old}" cy="{sy(v):.1f}" r="4" fill="{col}" fill-opacity="0.45"/>')
        s.append(txt(x_old, sy(v) - 9, f"{v}", 9.5, MUTED, "middle"))
        pts = []
        for i, pp in enumerate(ANN):
            val = ANNUAL[pp][key]
            pts.append(f"{xs_new[i]:.1f},{sy(val):.1f}")
        s.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{col}" stroke-width="2.2"/>')
        for i, pp in enumerate(ANN):
            val = ANNUAL[pp][key]
            s.append(f'<circle cx="{xs_new[i]}" cy="{sy(val):.1f}" r="4" fill="{col}"/>')
            s.append(txt(xs_new[i], sy(val) - 10, f"{val}", 9.5, col, "middle", "bold"))
    for i, pp in enumerate(ANN):
        s.append(txt(xs_new[i], B + 18, pp, 10.5, NAVY, "middle", "bold"))
    s.append(txt(xs_new[0], B + 32, "重述口径", 9, RED, "middle"))
    s.append(txt(x_old, B + 18, "2022", 10.5, MUTED, "middle"))
    s.append(txt(x_old, B + 32, "旧准则原报", 9, MUTED, "middle"))

    # ---------- 面板B 季度
    L2, R2 = 578, 962
    s.append(txt(L2, T - 44, "B　季度累计（%，偿付能力监管口径）", 12, BLUE, "start", "bold"))
    def sy2(v): return B - (v - vmin) / (vmax - vmin) * (B - T)
    for g in [30, 50, 70, 90, 100]:
        s.append(line(L2, sy2(g), R2, sy2(g), GRID))
        s.append(txt(L2 - 8, sy2(g) + 4, str(g), 10, MUTED, "end"))
    s.append(line(L2, sy2(100), R2, sy2(100), RED, 1.2, "4 4"))
    nq = len(QTR)
    xq = [L2 + 14 + i * (R2 - L2 - 28) / (nq - 1) for i in range(nq)]
    bqx = (xq[3] + xq[4]) / 2
    s.append(line(bqx, T - 22, bqx, B + 40, RED, 2, "6 5"))
    s.append(txt(bqx, T - 28, "准则断点", 10, RED, "middle", "bold"))
    for nm, col, _k, idx in series:
        for seg in [range(0, 4), range(4, nq)]:
            pts = [f"{xq[i]:.1f},{sy2(QTR[i][idx]):.1f}" for i in seg]
            op = "0.4" if seg.start == 0 else "1"
            s.append(f'<polyline points="{" ".join(pts)}" fill="none" stroke="{col}" stroke-width="2" stroke-opacity="{op}"/>')
        s.append(f'<circle cx="{xq[-1]:.1f}" cy="{sy2(QTR[-1][idx]):.1f}" r="3.6" fill="{col}"/>')
        s.append(txt(xq[-1] + 6, sy2(QTR[-1][idx]) + 3, f"{QTR[-1][idx]}", 9.5, col, "start", "bold"))
    for i in range(nq):
        if QTR[i][0].endswith("Q1"):
            s.append(line(xq[i], B, xq[i], B + 5, MUTED, 1))
            s.append(txt(xq[i], B + 18, QTR[i][0][:4], 9.5, MUTED, "middle"))
    s.append(txt(L2, B + 32, "标签为 2026Q1 值；浅色＝旧准则区间，不与新准则连线", 9, MUTED))

    # ---------- 图例
    ly = B + 62
    for i, (nm, col, _k, _q) in enumerate(series):
        s.append(rect(L + i * 116, ly - 9, 22, 4, col, 1, 2))
        s.append(txt(L + i * 116 + 28, ly - 4, nm, 11, INK))
    s.append(line(L + 352, ly - 7, L + 374, ly - 7, RED, 1.6, "4 3"))
    s.append(txt(L + 380, ly - 4, "承保盈亏线 100%", 11, RED, "start", "bold"))
    s.append(txt(L + 500, ly - 4, "年度与季度分属两套口径，分面板展示，不连成同一条曲线", 10.5, MUTED))

    # ---------- 关键数字条
    s.append(rect(L, ly + 14, R2 - L, 108, "#f7f9fc", 1, 6, "#dce5f0"))
    rows = [
        ("2023→2025 整体COR改善", "3.9 个百分点", "费用率贡献 2.8 个百分点，赔付率贡献 1.1 个百分点"),
        ("2024→2025 整体COR改善", "1.5 个百分点", "费用率贡献 0.9 个百分点，赔付率贡献 0.6 个百分点"),
        ("2026Q1 对 2025Q1（季度累计）", "COR 改善 0.7 个百分点", "费用率改善 1.2 个百分点，赔付率恶化 0.5 个百分点"),
    ]
    for i, (aa, bb, cc) in enumerate(rows):
        y = ly + 42 + i * 28
        s.append(txt(L + 16, y, aa, 11.5, NAVY, "start", "bold"))
        s.append(txt(L + 248, y, bb, 11.5, ACC, "start", "bold"))
        s.append(txt(L + 440, y, cc, 11, INK))

    s.append(notes(W, H, [
        "时间：年度 2022–2025；季度 2022Q1–2026Q1（累计）　单位：%",
        "口径：面板A为集团年报 IFRS 17 口径，2022 为旧准则原报、2022R 为重述比较期；面板B为偿付能力监管口径，两者不互换",
        "来源：中国平安_年报_2022／2023／2024／2025.pdf，PDF 第35／27／46／57页；平安产险_偿付能力报告_2022Q1 至 2026Q1.pdf，各期 PDF 第18页",
    ]))
    s.append("</svg>")
    return "".join(s)


# =========================================================== 图5 COR 瀑布
def _waterfall(s, x0, y0, w, h, base, items, total_label, vmin, vmax, unit="pp"):
    """通用瀑布：items=[(label, delta)]，正=改善（向下走）。"""
    n = len(items) + 2
    bw = w / n * 0.62
    step = w / n
    def sy(v): return y0 + h - (v - vmin) / (vmax - vmin) * h
    out = []
    cum = base
    xs = []
    # 起点柱
    out.append(rect(x0 + step * 0.19, sy(base), bw, y0 + h - sy(base), "#8fa3bd", 0.9))
    out.append(txt(x0 + step * 0.19 + bw / 2, sy(base) - 7, f"{base:.2f}", 10, INK, "middle", "bold"))
    out.append(txt(x0 + step * 0.19 + bw / 2, y0 + h + 16, "期初COR", 10, MUTED, "middle"))
    xs.append(x0 + step * 0.19 + bw)
    for i, (lb, d) in enumerate(items):
        x = x0 + step * (i + 1) + step * 0.19
        top, bot = min(cum, cum - d), max(cum, cum - d)
        col = GREEN if d > 0 else RED
        out.append(rect(x, sy(bot), bw, abs(sy(bot) - sy(top)), col, 0.85))
        out.append(line(xs[-1], sy(cum), x, sy(cum), MUTED, 1, "3 3"))
        lab = f"{d:+.2f}"
        ly = sy(top) - 7 if d > 0 else sy(bot) + 14
        out.append(txt(x + bw / 2, ly, lab, 10, col, "middle", "bold"))
        for k, part in enumerate(lb.split("\n")):
            out.append(txt(x + bw / 2, y0 + h + 16 + k * 12, part, 9.5, MUTED, "middle"))
        cum -= d
        xs.append(x + bw)
    x = x0 + step * (len(items) + 1) + step * 0.19
    out.append(line(xs[-1], sy(cum), x, sy(cum), MUTED, 1, "3 3"))
    out.append(rect(x, sy(cum), bw, y0 + h - sy(cum), NAVY, 0.9))
    out.append(txt(x + bw / 2, sy(cum) - 7, f"{cum:.2f}", 10, INK, "middle", "bold"))
    out.append(txt(x + bw / 2, y0 + h + 16, total_label, 10, MUTED, "middle"))
    s.extend(out)
    return cum


def chart_cor_waterfall():
    W, H = 1000, 590
    s = [head(W, H, "COR变动贡献瀑布图", "按险种把整体COR变动拆成各分部贡献，两个窗口分别列示。")]
    s.append(txt(W / 2, 26, "图5　整体COR变动贡献瀑布（按险种，IFRS 17保险服务收入权重）", 15, NAVY, "middle", "bold"))

    for k, (win, items) in enumerate(SEG_BRIDGE.items()):
        y0 = 60 + k * 250
        s.append(txt(70, y0 - 10, f"{'A' if k==0 else 'B'}　{win}（个百分点，正数=拉低整体COR=改善）", 12, BLUE, "start", "bold"))
        start = TOTAL_COR_EXACT[win.split("→")[0]]
        end = TOTAL_COR_EXACT[win.split("→")[1]]
        vmin, vmax = 95.5, 101.5
        L, R2, T, B = 70, 950, y0, y0 + 150
        for g in [96, 97, 98, 99, 100, 101]:
            yy = B - (g - vmin) / (vmax - vmin) * (B - T)
            s.append(line(L, yy, R2, yy, GRID))
            s.append(txt(L - 8, yy + 4, str(g), 10, MUTED, "end"))
        yy = B - (100 - vmin) / (vmax - vmin) * (B - T)
        s.append(line(L, yy, R2, yy, RED, 1.2, "4 4"))
        labels = [(nm.replace("（剔除责任险）", "\n（剔除责任险）"), v) for nm, v in items]
        got = _waterfall(s, L, T, R2 - L, B - T, start, labels, f"{win.split('→')[1]}年COR", vmin, vmax)
        s.append(txt(R2, y0 - 10, f"合计改善 {start-end:.4f} 个百分点（勾稽差 {abs(got-end):.6f}）", 11, MUTED, "end"))
    s.append(notes(W, H, [
        "时间：2023、2024、2025 年度　单位：个百分点",
        "口径：IFRS 17；整体 COR 按分部精确底数 (1−承保利润÷保险服务收入) 推算；责任险为其他财产险的下钻项，已从其他财产险中扣除以避免重复计算",
        "来源：中国平安_年报_2023.pdf PDF第29页、2024.pdf PDF第45页、2025.pdf PDF第56页，按险种划分的经营业绩表；"
        "平安产险_年度信息披露报告_2023.pdf PDF第118页、2025.pdf PDF第117及119页，分部报告",
    ]))
    s.append("</svg>")
    return "".join(s)


# =========================================================== 图6 利润桥接
def chart_profit_bridge():
    W, H = 1000, 500
    s = [head(W, H, "承保利润到净利润桥接图", "2025年水平桥接与2024→2025变动桥接。")]
    s.append(txt(W / 2, 26, "图6　承保利润—投资收益—净利润桥接", 15, NAVY, "middle", "bold"))

    d25, d24 = ANNUAL["2025"], ANNUAL["2024"]
    o25 = d25["pbt"] - d25["uw"] - d25["inv"]
    o24 = d24["pbt"] - d24["uw"] - d24["inv"]
    t25 = d25["pbt"] - d25["ni"]
    t24 = d24["pbt"] - d24["ni"]

    # 面板A：2025 水平桥
    L, R2, T, B = 70, 470, 74, 250
    s.append(txt(L, T - 16, "A　2025年水平桥接（人民币百万元）", 12, BLUE, "start", "bold"))
    steps = [("承保利润", d25["uw"], NAVY, True), ("总投资收益", d25["inv"], GREEN, False),
             ("其他损益\n（推算）", o25, RED, False), ("税前利润", d25["pbt"], "#8fa3bd", True),
             ("所得税\n（推算）", -t25, RED, False), ("净利润", d25["ni"], NAVY, True)]
    vmax = 24000
    def syA(v): return B - v / vmax * (B - T)
    for g in range(0, 24001, 6000):
        s.append(line(L, syA(g), R2, syA(g), GRID))
        s.append(txt(L - 8, syA(g) + 4, f"{g//1000}k", 9.5, MUTED, "end"))
    step = (R2 - L) / len(steps)
    bw = step * 0.56
    cum = 0
    for i, (nm, v, col, absolute) in enumerate(steps):
        x = L + step * i + (step - bw) / 2
        if absolute:
            top, bot = v, 0
            cum = v
        else:
            top, bot = max(cum, cum + v), min(cum, cum + v)
            cum = cum + v
        s.append(rect(x, syA(top), bw, abs(syA(top) - syA(bot)), col, 0.85))
        s.append(txt(x + bw / 2, syA(top) - 6, f"{v:+,.0f}" if not absolute else f"{v:,.0f}", 9.5, INK, "middle", "bold"))
        for k, p in enumerate(nm.split("\n")):
            s.append(txt(x + bw / 2, B + 16 + k * 12, p, 9.5, MUTED, "middle"))

    # 面板B：同比变动桥
    L2, R3, T2, B2 = 545, 960, 74, 250
    s.append(txt(L2, T2 - 16, "B　2024→2025 净利润变动桥接（人民币百万元）", 12, BLUE, "start", "bold"))
    deltas = [("承保利润", d25["uw"] - d24["uw"]), ("总投资\n收益", d25["inv"] - d24["inv"]),
              ("其他损益", o25 - o24), ("所得税", -(t25 - t24))]
    vmin2, vmax2 = 8000, 21000
    def syB(v): return B2 - (v - vmin2) / (vmax2 - vmin2) * (B2 - T2)
    for g in range(8000, 21001, 4000):
        s.append(line(L2, syB(g), R3, syB(g), GRID))
        s.append(txt(L2 - 8, syB(g) + 4, f"{g//1000}k", 9.5, MUTED, "end"))
    n = len(deltas) + 2
    step2 = (R3 - L2) / n
    bw2 = step2 * 0.58
    cum = d24["ni"]
    x = L2 + (step2 - bw2) / 2
    s.append(rect(x, syB(cum), bw2, B2 - syB(cum), "#8fa3bd", 0.9))
    s.append(txt(x + bw2 / 2, syB(cum) - 6, f"{cum:,.0f}", 9.5, INK, "middle", "bold"))
    s.append(txt(x + bw2 / 2, B2 + 16, "2024净利润", 9.5, MUTED, "middle"))
    prev = x + bw2
    for i, (nm, v) in enumerate(deltas):
        x = L2 + step2 * (i + 1) + (step2 - bw2) / 2
        top, bot = max(cum, cum + v), min(cum, cum + v)
        col = GREEN if v > 0 else RED
        s.append(line(prev, syB(cum), x, syB(cum), MUTED, 1, "3 3"))
        s.append(rect(x, syB(top), bw2, abs(syB(top) - syB(bot)), col, 0.85))
        s.append(txt(x + bw2 / 2, (syB(top) - 6) if v > 0 else (syB(bot) + 13), f"{v:+,.0f}", 9.5, col, "middle", "bold"))
        for k, p in enumerate(nm.split("\n")):
            s.append(txt(x + bw2 / 2, B2 + 16 + k * 12, p, 9.5, MUTED, "middle"))
        cum += v
        prev = x + bw2
    x = L2 + step2 * (len(deltas) + 1) + (step2 - bw2) / 2
    s.append(line(prev, syB(cum), x, syB(cum), MUTED, 1, "3 3"))
    s.append(rect(x, syB(cum), bw2, B2 - syB(cum), NAVY, 0.9))
    s.append(txt(x + bw2 / 2, syB(cum) - 6, f"{cum:,.0f}", 9.5, INK, "middle", "bold"))
    s.append(txt(x + bw2 / 2, B2 + 16, "2025净利润", 9.5, MUTED, "middle"))

    s.append(rect(70, 300, 890, 128, "#f7f9fc", 1, 6, "#dce5f0"))
    s.append(txt(84, 322, "读法", 12, NAVY, "start", "bold"))
    lines = [
        "承保利润 2024→2025 增加 5,254 百万元，同期总投资收益减少 4,198 百万元，其他损益再减少 740 百万元，所得税费用增加 740 百万元。",
        "四项相加为 −424 百万元，与净利润实际变动 −424 百万元完全勾稽。承保端的改善没有按同方向传导到最终利润。",
        "“其他损益”与“所得税”为按披露项目倒轧的推算值，年报未单独列示这两行；桥接只用于解释分化来源，不作为独立指标。",
    ]
    for i, t in enumerate(lines):
        s.append(txt(84, 346 + i * 22, t, 11.5, INK))
    s.append(notes(W, H, [
        "时间：2024、2025 年度　单位：人民币百万元　口径：集团年报产险业务 IFRS 17 口径",
        "其他损益＝税前利润−承保利润−总投资收益（推算）；所得税＝税前利润−净利润（推算）；年报未单独列示这两行",
        "来源：中国平安_年报_2024.pdf，PDF 第46页（报告印刷页码42）；中国平安_年报_2025.pdf，PDF 第57页（报告印刷页码53），经营业绩／产险业务分析表",
    ]))
    s.append("</svg>")
    return "".join(s)


# =========================================================== 图7 险种矩阵
def chart_matrix():
    W, H = 1000, 540
    s = [head(W, H, "险种规模—盈利矩阵", "横轴为2025保险服务收入占比，纵轴为综合成本率，气泡面积为承保利润绝对额。")]
    s.append(txt(W / 2, 26, "图7　险种规模—盈利矩阵（2025年，气泡面积＝承保利润绝对额）", 15, NAVY, "middle", "bold"))
    L, R2, T, B = 96, 700, 64, 372
    tot = SEGMENTS["2025"]["整体"][0]
    xmin, xmax, ymin, ymax = 0, 72, 45, 112
    def sx(v): return L + (v - xmin) / (xmax - xmin) * (R2 - L)
    def sy(v): return B - (v - ymin) / (ymax - ymin) * (B - T)
    s.append(rect(L, T, R2 - L, sy(100) - T, RED, 0.045, 0))
    for g in range(50, 111, 10):
        s.append(line(L, sy(g), R2, sy(g), GRID))
        s.append(txt(L - 8, sy(g) + 4, f"{g}%", 10, MUTED, "end"))
    for g in range(0, 73, 10):
        s.append(line(sx(g), T, sx(g), B, GRID))
        s.append(txt(sx(g), B + 18, f"{g}%", 10, MUTED, "middle"))
    s.append(line(L, sy(100), R2, sy(100), RED, 1.4, "5 4"))
    s.append(txt(R2 - 6, sy(100) - 7, "承保盈亏线 100%（线以上为承保亏损）", 10, RED, "end", "bold"))
    s.append(txt((L + R2) / 2, B + 40, "保险服务收入占整体比重（%）", 11, BLUE, "middle", "bold"))
    s.append(f'<text x="{L-52}" y="{(T+B)/2}" font-size="11" fill="{BLUE}" font-weight="bold" '
             f'text-anchor="middle" transform="rotate(-90 {L-52} {(T+B)/2})">综合成本率（%）</text>')

    rest_rev = SEGMENTS["2025"]["其他财产险"][0] - 24052 - 11491 - 10454
    rest_uw = SEGMENTS["2025"]["其他财产险"][1] - (-1642) - 152 - 207
    pts = [(nm, rev / tot * 100, cor, uw, rev) for nm, (rev, uw, cor, _s) in SEG_2025_DETAIL.items()]
    pts.append(("其他财产险剩余项", rest_rev / tot * 100, (1 - rest_uw / rest_rev) * 100, rest_uw, rest_rev))
    # 标签放置：避开左侧密集簇
    place = {"车险": ("end", -1, 4), "意外及健康保险": ("start", 1, 4), "责任保险": ("middle", 0, -1),
             "农业保险": ("end", -1, 4), "货运保险": ("middle", 0, 1), "保证保险": ("middle", 0, -1),
             "其他财产险剩余项": ("middle", 0, -1)}
    for nm, w, cor, uw, rev in pts:
        r = max(6, min(46, (abs(uw) ** 0.5) * 0.62))
        col = GREEN if cor < 100 else RED
        cx, cy = sx(w), sy(cor)
        s.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{r:.1f}" fill="{col}" fill-opacity="0.26" '
                 f'stroke="{col}" stroke-width="1.6"/>')
        s.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="2.6" fill="{col}"/>')
        anchor, dx, dy = place[nm]
        if anchor == "middle":
            s.append(txt(cx, cy + (dy * (r + 8) + (5 if dy > 0 else 0)), nm, 11, INK, "middle", "bold"))
        else:
            s.append(txt(cx + dx * (r + 7), cy + 4, nm, 11, INK, anchor, "bold"))

    # 右侧明细表
    s.append(rect(722, T - 4, 238, 320, "#f7f9fc", 1, 6, "#dce5f0"))
    s.append(txt(736, T + 18, "2025 分险种（人民币百万元）", 11.5, NAVY, "start", "bold"))
    s.append(line(736, T + 26, 946, T + 26, "#dce5f0"))
    for i, (nm, w, cor, uw, rev) in enumerate(sorted(pts, key=lambda z: -z[4])):
        y = T + 48 + i * 40
        s.append(txt(736, y, nm, 10.5, INK, "start", "bold"))
        s.append(txt(736, y + 14, f"收入 {rev:,.0f}　占比 {w:.1f}%", 9.5, MUTED))
        s.append(txt(736, y + 26, f"COR {cor:.2f}%", 9.5, MUTED))
        s.append(txt(946, y + 8, f"{uw:+,.0f}", 11.5, GREEN if uw > 0 else RED, "end", "bold"))

    s.append(rect(96, 400, 864, 74, "#f7f9fc", 1, 6, "#dce5f0"))
    s.append(txt(112, 422, "读法", 12, NAVY, "start", "bold"))
    for i, t in enumerate([
        "右下一个大气泡（车险）是唯一同时具备规模与盈利的业务；左下的保证保险利润率极高但盘子只剩 1.3%，无法再贡献一次。",
        "盈亏线以上是责任保险（106.8%）与意外及健康保险（99.4%，紧贴线下），两者合计占整体收入 16.8%，是当前承保压力的集中处。",
    ]):
        s.append(txt(112, 444 + i * 20, t, 11, INK))

    s.append(notes(W, H, [
        "时间：2025 年度　单位：保险服务收入与承保利润为人民币百万元，COR 为 %",
        "口径：IFRS 17；前五大险种收入、承保利润与 COR 来自集团年报，保证保险与“其他财产险剩余项”由分部报告推算（剩余项＝其他财产险−责任保险−农业保险−货运保险）",
        "来源：中国平安_年报_2025.pdf，PDF 第56页（报告印刷页码52），按险种划分的经营业绩表；平安产险_年度信息披露报告_2025.pdf，PDF 第117页，分部报告",
    ]))
    s.append("</svg>")
    return "".join(s)


# =========================================================== 图8 保证险贡献
def chart_guarantee():
    W, H = 1000, 516
    s = [head(W, H, "保证保险贡献图", "保证险收入权重、分部COR与对整体COR影响，并按Shapley拆成盈利率效应和权重效应。")]
    s.append(txt(W / 2, 26, "图8　保证保险：权重、分部COR与对整体COR的影响", 15, NAVY, "middle", "bold"))

    L, R2, T, B = 80, 470, 70, 260
    s.append(txt(L, T - 16, "A　收入权重（柱，%）与分部COR（线，%）", 12, BLUE, "start", "bold"))
    periods = ["2022R", "2023", "2024", "2025"]
    wmax, cmin, cmax = 12, 40, 140
    def syw(v): return B - v / wmax * (B - T)
    def syc(v): return B - (v - cmin) / (cmax - cmin) * (B - T)
    for g in range(0, 13, 3):
        s.append(line(L, syw(g), R2, syw(g), GRID))
        s.append(txt(L - 8, syw(g) + 4, f"{g}%", 10, MUTED, "end"))
    for g in [40, 70, 100, 130]:
        s.append(txt(R2 + 8, syc(g) + 4, f"{g}%", 10, ACC, "start"))
    s.append(line(L, syc(100), R2, syc(100), RED, 1.2, "4 4"))
    step = (R2 - L) / len(periods)
    ptsc = []
    for i, p in enumerate(periods):
        rev, uw, w, cor, imp = GUARANTEE[p]
        x = L + step * i + step * 0.22
        bw = step * 0.42
        s.append(rect(x, syw(w), bw, B - syw(w), "#8fa3bd", 0.9))
        s.append(txt(x + bw / 2, syw(w) - 6, f"{w:.2f}%", 9.5, INK, "middle"))
        cx = L + step * i + step / 2
        ptsc.append(f"{cx:.1f},{syc(cor):.1f}")
        s.append(f'<circle cx="{cx:.1f}" cy="{syc(cor):.1f}" r="4.5" fill="{ACC}"/>')
        if abs(syc(cor) - syw(w)) < 18:      # 与柱顶标签太近时改放右侧
            s.append(txt(cx + 26, syc(cor) + 4, f"{cor:.1f}%", 9.5, ACC, "start", "bold"))
        else:
            s.append(txt(cx, syc(cor) - 10, f"{cor:.1f}%", 10, ACC, "middle", "bold"))
        s.append(txt(cx, B + 16, p, 11, NAVY, "middle", "bold"))
        s.append(txt(cx, B + 30, f"对整体 {imp:+.3f}pp", 9.5, RED if imp > 0 else GREEN, "middle"))
    s.append(f'<polyline points="{" ".join(ptsc)}" fill="none" stroke="{ACC}" stroke-width="2.2"/>')
    s.append(txt(L, B + 52, "对整体影响＝−保证险承保利润÷整体保险服务收入；正数为拖累，负数为增益", 10, MUTED))

    L2, R3, T2, B2 = 560, 950, 70, 260
    s.append(txt(L2, T2 - 16, "B　保证险贡献的两因素拆分（个百分点）", 12, BLUE, "start", "bold"))
    wins = ["2023→2024", "2024→2025", "2023→2025"]
    vmin, vmax = -1.2, 3.6
    def sy2(v): return B2 - (v - vmin) / (vmax - vmin) * (B2 - T2)
    for g in [-1, 0, 1, 2, 3]:
        s.append(line(L2, sy2(g), R3, sy2(g), GRID if g else MUTED))
        s.append(txt(L2 - 8, sy2(g) + 4, str(g), 10, MUTED, "end"))
    step2 = (R3 - L2) / len(wins)
    for i, wn in enumerate(wins):
        pr, wt, tot = GUA_SHAPLEY[wn]
        x = L2 + step2 * i + step2 * 0.12
        bw = step2 * 0.3
        for j, (v, col, lb) in enumerate([(pr, ACC, "盈利率效应"), (wt, "#9d7ad1", "权重效应")]):
            xx = x + j * (bw + 6)
            top, bot = max(v, 0), min(v, 0)
            s.append(rect(xx, sy2(top), bw, abs(sy2(top) - sy2(bot)), col, 0.85))
            s.append(txt(xx + bw / 2, sy2(top) - 6 if v > 0 else sy2(bot) + 13, f"{v:+.3f}", 9.5, col, "middle", "bold"))
        s.append(txt(x + bw + 3, B2 + 16, wn, 10.5, NAVY, "middle", "bold"))
        s.append(txt(x + bw + 3, B2 + 30, f"合计 {tot:+.3f}pp", 9.5, MUTED, "middle"))
    for i, (lb, col) in enumerate([("分部盈利率变化效应", ACC), ("收入权重变化效应", "#9d7ad1")]):
        s.append(rect(L2 + i * 190, B2 + 46, 20, 10, col, 0.85))
        s.append(txt(L2 + i * 190 + 26, B2 + 55, lb, 10.5, INK))

    s.append(rect(80, 320, 870, 108, "#fdf6e8", 1, 6, "#e8d9b0"))
    s.append(txt(94, 342, "结论", 12, NAVY, "start", "bold"))
    for i, t in enumerate([
        "2023→2025 整体COR改善 3.8267 个百分点，其中保证险贡献 2.7984 个百分点，占 73.13%；其余 1.0283 个百分点才是其他业务对整体的贡献。",
        "把窗口拉到 2022R→2025，保证险贡献 3.0838 个百分点，超过整体改善 2.7946 个百分点；扣除后其他业务对整体为 −0.2891 个百分点。",
        "2024→2025 这一步，权重效应已转为 −0.5008 个百分点：继续缩量本身不再改善整体，推高整体的是分部账面盈利率。",
    ]):
        s.append(txt(94, 366 + i * 21, t, 11, INK))
    s.append(notes(W, H, [
        "时间：2022R、2023、2024、2025 年度　单位：% 与个百分点",
        "口径：IFRS 17 保险服务收入权重；承保利润＝分部营业利润−分部其他收益；两因素为 Shapley 恒等式拆分，不新增假设",
        "来源：平安产险_年度信息披露报告_2023.pdf，PDF 第118页（2023年度）、第120页（2022年度已重述）；"
        "平安产险_年度信息披露报告_2025.pdf，PDF 第117页（2025年度）、第119页（2024年度比较数）",
        "综合成本率公式来源：中国平安_年报_2025.pdf，PDF 第56页（报告印刷页码52）",
    ]))
    s.append("</svg>")
    return "".join(s)


# =========================================================== 图9 新能源敏感性
def chart_nev():
    W, H = 1000, 536
    s = [head(W, H, "新能源占比与车险COR拖累敏感性", "量纲说明：COR差距为分项差，整体拖累=占比变动×差距。")]
    s.append(txt(W / 2, 26, "图9　新能源占比提升与整体车险COR拖累（敏感性区间，非实测）", 15, NAVY, "middle", "bold"))

    L, R2, T, B = 90, 600, 70, 300
    s.append(txt(L, T - 16, "A　占比提升 → 整体车险COR拖累（个百分点）", 12, BLUE, "start", "bold"))
    xmax, ymax = 8.0, 0.45
    def sx(v): return L + v / xmax * (R2 - L)
    def sy(v): return B - v / ymax * (B - T)
    for g in [0, 0.1, 0.2, 0.3, 0.4]:
        s.append(line(L, sy(g), R2, sy(g), GRID))
        s.append(txt(L - 8, sy(g) + 4, f"{g:.2f}", 10, MUTED, "end"))
    for g in range(0, 9, 2):
        s.append(line(sx(g), T, sx(g), B, GRID))
        s.append(txt(sx(g), B + 16, f"+{g}pct", 10, MUTED, "middle"))
    s.append(txt((L + R2) / 2, B + 36, "新能源车险保费占比的提升幅度（个百分点）", 11, BLUE, "middle", "bold"))
    s.append(f'<text x="{L-52}" y="{(T+B)/2}" font-size="11" fill="{BLUE}" font-weight="bold" text-anchor="middle" transform="rotate(-90 {L-52} {(T+B)/2})">整体车险COR拖累（个百分点）</text>')

    xm = NEV["x_max"]
    s.append(f'<polygon points="{sx(0)},{sy(0)} {sx(xmax)},{sy(xmax*xm/100)} {sx(xmax)},{sy(0)}" fill="{ACC}" fill-opacity="0.16"/>')
    s.append(f'<line x1="{sx(0)}" y1="{sy(0)}" x2="{sx(xmax):.1f}" y2="{sy(xmax*xm/100):.1f}" stroke="{ACC}" stroke-width="2.4"/>')
    s.append(txt(sx(6.9), sy(6.9 * xm / 100) - 9, "上界 x=5.44pp", 10.5, ACC, "middle", "bold"))
    s.append(f'<line x1="{sx(0)}" y1="{sy(0)}" x2="{sx(xmax):.1f}" y2="{sy(0)}" stroke="{GREEN}" stroke-width="2"/>')
    s.append(txt(sx(xmax) - 6, sy(0) - 8, "下界 x=0pp", 10.5, GREEN, "end", "bold"))
    for xv, col in [(3, "#9d7ad1"), (5, "#d08c2f")]:
        s.append(f'<line x1="{sx(0)}" y1="{sy(0)}" x2="{sx(xmax):.1f}" y2="{sy(xmax*xv/100):.1f}" stroke="{col}" stroke-width="1.4" stroke-dasharray="5 4"/>')
        s.append(txt(sx(xmax) - 6, sy(xmax * xv / 100) - 6, f"x={xv}pp", 9.5, col, "end"))
    dw = NEV["dw"]
    s.append(line(sx(dw), T, sx(dw), B, RED, 1.6, "6 4"))
    s.append(txt(sx(dw), T - 4, f"2024→2025 实际提升 {dw:.4f}pct", 10.5, RED, "middle", "bold"))
    s.append(f'<circle cx="{sx(dw):.1f}" cy="{sy(dw*xm/100):.1f}" r="5" fill="{RED}"/>')
    s.append(txt(sx(dw) + 8, sy(dw * xm / 100) - 6, f"上限拖累 {dw*xm/100:.4f}pp", 10.5, RED, "start", "bold"))

    # 面板B：量纲说明与情景表
    L2 = 640
    s.append(rect(L2, T - 24, 320, 268, "#f7f9fc", 1, 6, "#dce5f0"))
    s.append(txt(L2 + 14, T - 4, "量纲：两件事不是同一个数", 12, NAVY, "start", "bold"))
    s.append(txt(L2 + 14, T + 18, "① 新能源车COR − 燃油车COR", 11, INK, "start", "bold"))
    s.append(txt(L2 + 14, T + 34, "＝ 0 – 5.44 个百分点（车型之间的差距）", 10.5, MUTED))
    s.append(txt(L2 + 14, T + 56, "② 占比每 +1 个百分点，整体车险COR被拖高", 11, INK, "start", "bold"))
    s.append(txt(L2 + 14, T + 72, "＝ 1% × (0–5.44pp) ＝ 0 – 0.0544 个百分点", 10.5, RED, "start", "bold"))
    s.append(line(L2 + 14, T + 84, L2 + 306, T + 84, GRID))
    s.append(txt(L2 + 14, T + 102, "情景表（2024→2025 实际提升 5.8737pct）", 11, BLUE, "start", "bold"))
    s.append(txt(L2 + 14, T + 120, "x（差距）", 10, MUTED, "start", "bold"))
    s.append(txt(L2 + 140, T + 120, "每+1pct拖累", 10, MUTED, "start", "bold"))
    s.append(txt(L2 + 306, T + 120, "本期累计拖累", 10, MUTED, "end", "bold"))
    for i, x in enumerate([0, 3, 5, 5.44]):
        y = T + 140 + i * 20
        s.append(txt(L2 + 14, y, f"{x:g} pp", 10.5, INK))
        s.append(txt(L2 + 140, y, f"{x*0.01:.4f} pp", 10.5, INK))
        s.append(txt(L2 + 306, y, f"{dw*x/100:.4f} pp", 10.5, RED if x > 0 else GREEN, "end", "bold"))

    s.append(rect(90, 352, 870, 98, "#fdf6e8", 1, 6, "#e8d9b0"))
    s.append(txt(104, 374, "读法", 12, NAVY, "start", "bold"))
    for i, t in enumerate([
        "同期车险COR由98.1%降至95.8%，实际改善2.30个百分点。新能源结构没有让车险COR上升，它最多抵消了其他改善的一部分。",
        "扣除结构拖累后的底层改善区间为 2.3000–2.6195 个百分点，最大抵消强度为 13.9%。",
        "5.44个百分点是“新能源仍处于承保盈利”约束下反推的条件边界，不是公司披露的实测差距，也不能写成整体COR的上升幅度。",
    ]):
        s.append(txt(104, 398 + i * 20, t, 11, INK))
    s.append(notes(W, H, [
        "时间：2024、2025 年度　单位：个百分点",
        "口径：w 为新能源车险原保险保费占车险原保险保费比重（承保组合权重的代理）；x 为用户确认假设 A1 的区间，非实测",
        "来源：中国平安_年报_2025.pdf，PDF 第54页（车险经营数据）、第58页（原保险保费按险种）；中国平安_年报_2024.pdf，PDF 第44–45页（车险经营数据）",
    ]))
    s.append("</svg>")
    return "".join(s)


# =========================================================== 图10 同业对标
def chart_peers():
    W, H = 1000, 606
    s = [head(W, H, "同业对标图", "平安、人保、太保同准则同期间的COR、赔付率与费用率对标。")]
    s.append(txt(W / 2, 26, "图10　平安、人保、太保同口径对标（IFRS 17，年度整体）", 15, NAVY, "middle", "bold"))

    L, R2, T, B = 80, 950, 76, 262
    s.append(txt(L, T - 16, "A　各年综合成本率（%）：三家均为各自年报 IFRS 17 年度整体口径，期间一致", 12, BLUE, "start", "bold"))
    periods = ["2022R", "2023", "2024", "2025"]
    cols = {"平安产险": NAVY, "人保财险": ACC, "太保产险": "#d08c2f"}
    vmin, vmax = 94, 102
    def sy(v): return B - (v - vmin) / (vmax - vmin) * (B - T)
    for g in range(94, 103):
        s.append(line(L, sy(g), R2, sy(g), GRID))
        s.append(txt(L - 8, sy(g) + 4, f"{g}%", 10, MUTED, "end"))
    s.append(line(L, sy(100), R2, sy(100), RED, 1.3, "4 4"))
    s.append(txt(R2, sy(100) - 7, "承保盈亏线 100%", 9.5, RED, "end", "bold"))
    step = (R2 - L) / len(periods)
    for i, pp in enumerate(periods):
        gx = L + step * i
        bw = step * 0.2
        for j, (ent, col) in enumerate(cols.items()):
            v = PEERS[ent][pp][0]
            x = gx + step * 0.11 + j * (bw + 6)
            s.append(rect(x, sy(v), bw, B - sy(v), col, 0.88))
            s.append(txt(x + bw / 2, sy(v) - 6, f"{v}", 10, INK, "middle", "bold"))
        s.append(txt(gx + step / 2, B + 18, pp, 11.5, NAVY, "middle", "bold"))
        if pp == "2022R":
            s.append(txt(gx + step / 2, B + 32, "三家均为各自2023年报的重述口径", 9.5, RED, "middle"))
    for j, (ent, col) in enumerate(cols.items()):
        s.append(rect(L + j * 130, B + 48, 20, 10, col, 0.88))
        s.append(txt(L + j * 130 + 26, B + 57, ent, 11, INK))

    # 面板B：改善分解
    T2, B2 = 356, 490
    s.append(txt(L, T2 - 10, "B　改善分解（个百分点，正数＝改善）：同一窗口内三家同时列示", 12, BLUE, "start", "bold"))
    s.append(rect(L, T2, R2 - L, B2 - T2, "#f7f9fc", 1, 6, "#dce5f0"))
    hdr = ["窗口 / 指标", "平安产险", "人保财险", "太保产险", "同业均值", "平安超额"]
    xs = [L + 16, L + 250, L + 380, L + 510, L + 640, L + 780]
    for i, h in enumerate(hdr):
        s.append(txt(xs[i], T2 + 20, h, 10.5, NAVY, "start", "bold"))
    s.append(line(L + 16, T2 + 27, R2 - 16, T2 + 27, "#c9d6e8"))
    rows = []
    for win, (aa, bb) in [("2023→2025", ("2023", "2025")), ("2024→2025", ("2024", "2025"))]:
        for k, key in [(0, "COR"), (1, "赔付率"), (2, "费用率")]:
            pa = PEERS["平安产险"][aa][k] - PEERS["平安产险"][bb][k]
            pc = PEERS["人保财险"][aa][k] - PEERS["人保财险"][bb][k]
            cp = PEERS["太保产险"][aa][k] - PEERS["太保产险"][bb][k]
            avg = (pc + cp) / 2
            rows.append((f"{win}　{key}", pa, pc, cp, avg, pa - avg))
    for i, r in enumerate(rows):
        y = T2 + 46 + i * 17
        if i == 3:
            s.append(line(L + 16, y - 12, R2 - 16, y - 12, "#dce5f0"))
        s.append(txt(xs[0], y, r[0], 10, INK))
        for j in range(1, 6):
            v = r[j]
            col = GREEN if v > 0 else (RED if v < 0 else MUTED)
            s.append(txt(xs[j], y, f"{v:+.2f}", 10, col, "start", "bold" if j == 5 else "normal"))

    s.append(notes(W, H, [
        "时间：2022R、2023、2024、2025 年度　单位：% 与个百分点",
        "口径：三家均为各自年报 IFRS 17 年度整体口径，2022R 为各自 2023 年报的重述比较期；太保 2022R／2023 费用率由综合成本率减赔付率推算",
        "来源（平安）：中国平安_年报_2023.pdf PDF第27页、2024.pdf PDF第46页、2025.pdf PDF第57页，经营业绩／产险业务分析表",
        "来源（同业）：人保财险_年报_2023.pdf PDF第13页、2024／2025.pdf PDF第14页，承保业绩表；"
        "中国太保_年报_2023.pdf PDF第33页、2024.pdf PDF第46页、2025.pdf PDF第44页，产险业务经营指标",
    ]))
    s.append("</svg>")
    return "".join(s)


# =========================================================== 图11 预警热力图
def chart_heatmap():
    W = 1000
    rows = INDICATORS
    H = 120 + len(rows) * 26 + 40
    s = [head(W, H, "指标预警热力图", "16项常态监控指标的当前状态、阈值与所属层级。")]
    s.append(txt(W / 2, 26, "图11　指标体系预警热力图（阈值为管理判断，不是监管标准）", 15, NAVY, "middle", "bold"))
    cmap = {"GREEN": GREEN, "YELLOW": YELLOW, "RED": RED, "SCENARIO RED": "#a4562f"}
    hdr = [("指标", 70), ("层级", 300), ("期间", 372), ("当前值", 470), ("黄线", 560), ("红线", 630), ("状态", 706), ("说明", 800)]
    s.append(rect(60, 48, 900, 26, NAVY, 1, 4))
    for h, x in hdr:
        s.append(txt(x, 66, h, 11, "#ffffff", "start", "bold"))
    for i, (mid, layer, name, val, unit, y1, r1, st, per, memo) in enumerate(rows):
        y = 74 + i * 26
        s.append(rect(60, y, 900, 26, "#f7f9fc" if i % 2 else "#ffffff", 1, 0))
        s.append(line(60, y + 26, 960, y + 26, GRID))
        s.append(txt(70, y + 17, f"{mid}　{name}", 10.5, INK, "start", "bold"))
        s.append(txt(300, y + 17, layer, 10.5, MUTED))
        s.append(txt(372, y + 17, per, 10.5, MUTED))
        s.append(txt(470, y + 17, (f"{val:,.2f}" if abs(val) >= 1 else f"{val:,.4f}") + unit, 10.5, INK, "start", "bold"))
        s.append(txt(560, y + 17, "—" if y1 is None else f"{y1:g}{unit}", 10.5, MUTED))
        s.append(txt(630, y + 17, "—" if r1 is None else f"{r1:g}{unit}", 10.5, MUTED))
        c = cmap[st]
        s.append(rect(700, y + 5, 90, 16, c, 0.16, 8, c))
        s.append(txt(745, y + 17, st, 9.5, c, "middle", "bold"))
        s.append(txt(800, y + 17, memo[:26], 9.5, MUTED))
    y = 74 + len(rows) * 26 + 10
    s.append(txt(70, y + 12, "触发规则：任一红灯立即触发专题；同一指标连续两期黄灯触发；同期两个关联指标黄灯触发。"
                             "M14标为情景红灯，因为它是敏感性上限而不是实测损失。", 11, INK))
    s.append(note(W, H, "时间：公司结果2026Q1（年度项为2025年度）　单位：随指标列示　"
                        "口径：M01–M08、M16为偿付能力监管口径，M09–M15为集团年报IFRS 17口径，两者不混算　"
                        "来源：01-数据/阶段4_指标体系.csv"))
    s.append("</svg>")
    return "".join(s)


# =========================================================== 图12 行动矩阵
def chart_actions():
    W, H = 1000, 500
    s = [head(W, H, "90天行动矩阵", "按时间窗与预期影响量级放置六项经营动作。")]
    s.append(txt(W / 2, 26, "图12　未来90天行动矩阵（横轴＝完成时点，纵轴＝对COR／利润的预期影响量级）", 15, NAVY, "middle", "bold"))
    L, R2, T, B = 112, 700, 60, 356
    s.append(rect(L, T, R2 - L, B - T, "#f7f9fc", 1, 6, "#dce5f0"))
    for i in range(1, 3):
        s.append(line(L + (R2 - L) * i / 3, T, L + (R2 - L) * i / 3, B, GRID))
        s.append(line(L, T + (B - T) * i / 3, R2, T + (B - T) * i / 3, GRID))
    for i, lb in enumerate(["0–30天", "31–60天", "61–90天"]):
        s.append(txt(L + (R2 - L) * (i + 0.5) / 3, B + 20, lb, 11.5, NAVY, "middle", "bold"))
    for i, lb in enumerate(["影响：高", "影响：中", "影响：低"]):
        s.append(txt(L - 10, T + (B - T) * (i + 0.5) / 3 + 4, lb, 11, BLUE, "end", "bold"))
    s.append(txt((L + R2) / 2, B + 40, "完成时点", 11, BLUE, "middle", "bold"))

    slot = {"0至30天": 0, "31至60天": 1, "61至90天": 2}
    rowi = {"高": 0, "中": 1, "低": 2}
    used = {}

    def clip(t, k):
        return t if len(t) <= k else t[:k] + "…"

    for win, obj, urg, imp, act, kpi, eff, mids in ACTIONS:
        ci, ri = slot[win], rowi[imp]
        k = used.get((ci, ri), 0)
        used[(ci, ri)] = k + 1
        cw = (R2 - L) / 3 - 20
        x = L + (R2 - L) * ci / 3 + 10
        y = T + (B - T) * ri / 3 + 6 + k * 46
        col = {"高": RED, "中": YELLOW, "低": GREEN}[imp]
        s.append(rect(x, y, cw, 40, col, 0.13, 6, col))
        s.append(txt(x + 8, y + 15, obj, 11, NAVY, "start", "bold"))
        s.append(txt(x + 8, y + 27, "验收：" + clip(kpi, 14), 8.8, MUTED))
        s.append(txt(x + 8, y + 36, "对应 " + clip(mids, 16), 8.8, MUTED))

    s.append(rect(722, T, 238, B - T, "#ffffff", 1, 6, "#dce5f0"))
    s.append(txt(736, T + 22, "影响量级的判断依据", 11.5, NAVY, "start", "bold"))
    for i, t in enumerate([
        "高：对应指标已是红灯，或涉及核心",
        "　　非车、非车增长质量、投资桥接",
        "　　等直接改变整体判断的环节。",
        "中：对应指标为黄灯或情景红灯。",
        "低：口径与流程类动作，不直接",
        "　　改变当期比率。",
        "",
        "所有动作只承诺信号方向和可复核指标，",
        "不承诺精确的利润或 COR 改善百分点：",
        "公开数据没有经营动作到结果的弹性",
        "系数。责任单元只到职能条线，落到",
        "具体机构需要内部数据。",
    ]):
        s.append(txt(736, T + 46 + i * 19, t, 10.5, INK if i < 6 else MUTED))

    s.append(notes(W, H, [
        "时间：自数据截止日 2026-08-16 起 90 天　单位：不适用（管理矩阵）",
        "口径：影响量级为管理判断，来自阶段4指标体系的红黄灯状态；“非车增长质量”对应的两项观察指标尚未设定阈值，需作者确认",
        "来源：01-数据/阶段4_指标体系.csv；本报告第四节、第七节、第八节",
    ]))
    s.append("</svg>")
    return "".join(s)


CHARTS = {
    "dashboard": chart_dashboard,
    "structure": chart_structure,
    "scale": chart_scale,
    "cor_trend": chart_cor_trend,
    "cor_waterfall": chart_cor_waterfall,
    "profit_bridge": chart_profit_bridge,
    "matrix": chart_matrix,
    "guarantee": chart_guarantee,
    "nev": chart_nev,
    "peers": chart_peers,
    "heatmap": chart_heatmap,
    "actions": chart_actions,
}
