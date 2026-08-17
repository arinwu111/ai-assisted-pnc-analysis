# -*- coding: utf-8 -*-
"""
面试版（作品集短版）：输出
  04-报告/平安产险经营分析报告_面试版.md
  04-报告/平安产险经营分析报告_面试版.html   （离线自包含，内嵌SVG）

数据全部复用已核验的 build_stage4_report_v2_data / _v2（30 项机械校验已 PASS），
本模块只做叙述压缩与专用图表，不引入任何新的数字或假设。
"""
import os, html
import build_stage4_report_v2 as V
from build_stage4_report_v2_data import *
from build_stage4_report_v2_charts import (head, txt, line, rect, notes, NAVY, BLUE, ACC,
                                           GREEN, YELLOW, RED, GRID, MUTED, INK)

d, n, sgn = V.d, V.n, V.sgn
SC_CAR, SC_GUA, SC_NON, SC_NEV = V.SC_CAR, V.SC_GUA, V.SC_NON, V.SC_NEV
A25, A24, q26, q25 = V.A25, V.A24, V.q26, V.q25
OUT = V.OUT
ORANGE = "#a4562f"


# =============================================================== 图 A 核心论证链
def fig_argument():
    W, H = 1000, 446
    s = [head(W, H, "核心论证链",
              "两个窗口下，把保证保险这项一次性贡献剔除后，平安相对同业均值的位置。")]
    s.append(txt(W / 2, 26, "图A　核心论证：把一次性事件剔掉之后，最新一年的改善已经跑不赢同业",
                 15.5, NAVY, "middle", "bold"))
    s.append(txt(W / 2, 46, "整体综合成本率改善的分解（单位：个百分点，向右＝改善越多）　"
                            "两窗口共用同一横轴刻度", 11, MUTED, "middle"))

    x0, wtot, span = 210, 600, 4.0
    def wpx(v): return v / span * wtot

    def block(ytop, win, total, gua, rest, peer, verdict, vcol):
        o = []
        o.append(txt(24, ytop, f"窗口　{win}", 12.5, NAVY, "start", "bold"))
        # 平安：先画“剔除保证险后的剩余”，再画“保证险”，便于与同业条直接对齐比较
        y1 = ytop + 26
        o.append(txt(200, y1 + 13, "平安产险", 11, INK, "end", "bold"))
        o.append(rect(x0, y1, wpx(rest), 22, ACC, 0.9, 3))
        o.append(rect(x0 + wpx(rest), y1, wpx(gua), 22, ORANGE, 0.9, 3))
        if wpx(rest) > 96:
            o.append(txt(x0 + wpx(rest) / 2, y1 + 15, f"剔除保证险后 {rest:.4f}", 10.5, "#ffffff", "middle", "bold"))
        else:
            o.append(txt(x0 + wpx(rest) / 2, y1 + 15, f"{rest:.4f}", 10.5, "#ffffff", "middle", "bold"))
        if wpx(gua) > 96:
            o.append(txt(x0 + wpx(rest) + wpx(gua) / 2, y1 + 15, f"保证保险 {gua:.4f}", 10.5, "#ffffff", "middle", "bold"))
        else:
            o.append(txt(x0 + wpx(rest) + wpx(gua) / 2, y1 + 15, f"{gua:.4f}", 10.5, "#ffffff", "middle", "bold"))
        o.append(txt(x0 + wpx(total) + 10, y1 + 15, f"合计 {total:.4f}", 11, NAVY, "start", "bold"))
        # 对齐参考线
        bx = x0 + wpx(rest)
        o.append(line(bx, y1 - 6, bx, y1 + 62, ACC, 1.4, "4 3"))
        # 同业
        y2 = y1 + 34
        o.append(txt(200, y2 + 13, "同业均值", 11, INK, "end", "bold"))
        o.append(rect(x0, y2, wpx(peer), 22, "#9aa5b1", 0.9, 3))
        o.append(txt(x0 + wpx(peer) / 2, y2 + 15, f"{peer:.4f}", 10.5, "#ffffff", "middle", "bold"))
        o.append(txt(x0 + wpx(peer) + 10, y2 + 15, "人保财险与太保产险的算术平均", 10, MUTED, "start"))
        # 判读
        o.append(rect(24, y2 + 32, 952, 26, vcol, 0.1, 5, vcol))
        o.append(txt(34, y2 + 49, verdict, 11, vcol, "start", "bold"))
        return "".join(o)

    s.append(block(78, "2024→2025（最新一个完整年度）",
                   d["COR精确改善24_25"], SC_GUA, d["情景B"], d["同业COR24_25"][3],
                   f"剔除保证保险后剩余 {d['情景B']:.4f}，低于同业均值 {d['同业COR24_25'][3]:.2f}，"
                   f"差 {d['剔保证险对同业24_25']:.4f} 个百分点　→　最新一年已跑不赢同业", RED))
    s.append(block(256, "2023→2025（三年累计）",
                   d["COR精确改善23_25"], GUA_SHAPLEY["2023→2025"][2], d["剔保证险改善23_25"],
                   d["同业COR23_25"][3],
                   f"剔除保证保险后剩余 {d['剔保证险改善23_25']:.4f}，高于同业均值 {d['同业COR23_25'][3]:.2f}，"
                   f"多 {d['剔保证险对同业23_25']:.4f} 个百分点　→　三年看仍是领先", GREEN))

    s.append(notes(W, H, [
        "读法：蓝段＝剔除保证保险后的改善，橙段＝保证保险这一项的贡献，两段之和＝平安整体改善；蓝色虚线为对齐参考，"
        "落在灰条右侧表示剔除后仍快于同业。",
        "口径：平安为分部报告精确底数（IFRS 17 保险服务收入权重）；同业为各家年报披露的一位小数。"
        "同业未做同口径的一次性项目剔除，两家也未披露可比分部数据，因此这是不对称比较，只作方向提示。",
        "来源：平安产险_年度信息披露报告_2023.pdf PDF第118页、2025.pdf PDF第117及119页；中国平安_年报_2024.pdf PDF第45–46页、2025.pdf PDF第56–57页；"
        "人保财险_年报_2024／2025.pdf PDF第14页；中国太保_年报_2024.pdf PDF第46页、2025.pdf PDF第44页（各表名见完整版附录表23）",
    ]))
    s.append("</svg>")
    return "".join(s)


# =============================================================== 图 B 方法链条
def fig_method():
    W, H = 1000, 224
    s = [head(W, H, "分析链条", "从经营结果到经营动作的八步链条，以及每一步用到的方法。")]
    s.append(txt(W / 2, 26, "图B　这份分析怎么走：结果 → 原因 → 异常 → 专题 → 可持续性 → 动作", 15, NAVY, "middle", "bold"))
    steps = [
        ("经营结果", "规模／承保\n利润／资本"),
        ("驱动拆解", "量×价×结构\n赔付／费用"),
        ("异常识别", "16项指标\n红黄灯触发"),
        ("专题分析", "保证险／新能源\n非车／同业"),
        ("可持续性", "一次性／周期性\n能力性"),
        ("经营动作", "责任单元\n验收指标"),
    ]
    L, R = 30, 970
    sw = (R - L) / len(steps)
    for i, (t, sub) in enumerate(steps):
        x = L + i * sw
        fill = "#eef4fb" if i % 2 == 0 else "#f7f9fc"
        s.append(rect(x + 6, 56, sw - 26, 74, fill, 1, 8, "#c9d6e8"))
        s.append(txt(x + (sw - 20) / 2, 78, t, 12.5, NAVY, "middle", "bold"))
        for j, ln in enumerate(sub.split("\n")):
            s.append(txt(x + (sw - 20) / 2, 96 + j * 15, ln, 10.5, MUTED, "middle"))
        if i < len(steps) - 1:
            ax = x + sw - 16
            s.append(f'<path d="M{ax},93 l10,0 m-4,-4 l4,4 l-4,4" stroke="{ACC}" stroke-width="1.8" fill="none"/>')
    s.append(f'<path d="M950,136 q0,20 -30,20 L580,156 M420,156 L110,156 q-30,0 -30,-20" stroke="{GREEN}" '
             f'stroke-width="1.6" fill="none" stroke-dasharray="5 4"/>')
    s.append(txt(W / 2, 160, "效果复盘：下一期用同一套指标验收，偏差回到第一步", 11, GREEN, "middle", "bold"))
    s.append(notes(W, H, [
        "每一步的输出都是下一步的输入；专题不是独立研究，而是由常态指标越线触发。来源：04-报告/平安产险经营分析框架.md",
    ]))
    s.append("</svg>")
    return "".join(s)


# =============================================================== 图 C 险种瀑布（单窗口紧凑版）
def fig_waterfall():
    W, H = 1000, 380
    s = [head(W, H, "险种贡献瀑布", "2024→2025 整体综合成本率改善按险种拆解。")]
    s.append(txt(W / 2, 26, "图C　整体COR改善 1.4973 个百分点，是几股力量对冲后的净值（2024→2025）",
                 15, NAVY, "middle", "bold"))
    items = SEG_BRIDGE["2024→2025"]
    L, R, T, B = 78, 950, 62, 250
    vmin, vmax = 96.2, 98.8
    def sy(v): return B - (v - vmin) / (vmax - vmin) * (B - T)
    for g in [96.5, 97.0, 97.5, 98.0, 98.5]:
        s.append(line(L, sy(g), R, sy(g), GRID))
        s.append(txt(L - 8, sy(g) + 4, f"{g:.1f}", 10, MUTED, "end"))
    n_items = len(items) + 2
    step = (R - L) / n_items
    bw = step * 0.6
    cum = TOTAL_COR_EXACT["2024"]
    x = L + (step - bw) / 2
    s.append(rect(x, sy(cum), bw, B - sy(cum), "#8fa3bd", 0.9))
    s.append(txt(x + bw / 2, sy(cum) - 8, f"{cum:.2f}", 11, INK, "middle", "bold"))
    s.append(txt(x + bw / 2, B + 18, "2024年COR", 10.5, MUTED, "middle"))
    prev = x + bw
    for i, (nm, v) in enumerate(items):
        x = L + step * (i + 1) + (step - bw) / 2
        top, bot = min(cum, cum - v), max(cum, cum - v)
        col = GREEN if v > 0 else RED
        s.append(line(prev, sy(cum), x, sy(cum), MUTED, 1, "3 3"))
        ry, rh = min(sy(top), sy(bot)), abs(sy(bot) - sy(top))
        s.append(rect(x, ry, bw, rh, col, 0.85))
        if rh >= 24:
            s.append(txt(x + bw / 2, ry + rh / 2 + 4, f"{v:+.4f}", 10.5, "#ffffff", "middle", "bold"))
        else:
            s.append(txt(x + bw / 2, ry - 7, f"{v:+.4f}", 10.5, col, "middle", "bold"))
        for k, part in enumerate(nm.replace("（剔除责任险）", "\n（剔除责任险）").split("\n")):
            s.append(txt(x + bw / 2, B + 18 + k * 13, part, 10.5, MUTED, "middle"))
        if nm == "保证险":
            s.append(rect(x - 4, T - 4, bw + 8, B - T + 8, ORANGE, 0.07, 4, ORANGE))
            s.append(txt(x + bw / 2, T - 12, "一次性", 10.5, ORANGE, "middle", "bold"))
        cum -= v
        prev = x + bw
    x = L + step * (len(items) + 1) + (step - bw) / 2
    s.append(line(prev, sy(cum), x, sy(cum), MUTED, 1, "3 3"))
    s.append(rect(x, sy(cum), bw, B - sy(cum), NAVY, 0.9))
    s.append(txt(x + bw / 2, sy(cum) - 8, f"{cum:.2f}", 11, INK, "middle", "bold"))
    s.append(txt(x + bw / 2, B + 18, "2025年COR", 10.5, MUTED, "middle"))

    s.append(rect(78, 286, 872, 46, "#f7f9fc", 1, 6, "#dce5f0"))
    s.append(txt(92, 306, "车险与保证险合计贡献 2.2155 个百分点，核心非车反向抵消 0.7183 个百分点（抵消 32.4%），"
                          "净改善才是 1.4973 个百分点。", 11.5, INK))
    s.append(txt(92, 324, "橙框内的保证保险，其收入权重已由 7.019% 降至 1.303%——这一项明年无法再来一次。",
                 11.5, ORANGE, "start", "bold"))
    s.append(notes(W, H, [
        "时间：2024、2025 年度　单位：个百分点（正数＝拉低整体COR＝改善）　口径：IFRS 17；责任险为其他财产险的下钻项，已扣除以免重复计算",
        "来源：中国平安_年报_2024.pdf PDF第45页、2025.pdf PDF第56页，按险种划分的经营业绩表；平安产险_年度信息披露报告_2025.pdf PDF第117及119页，分部报告",
    ]))
    s.append("</svg>")
    return "".join(s)


# =============================================================== 图 D 情景边界
def fig_scenario():
    W, H = 1000, 402
    s = [head(W, H, "情景区间", "以2025年为起点的机械情景，全部取自已核验的历史观测值或恒等式。")]
    s.append(txt(W / 2, 26, "图D　下一步能到哪里：机械情景给出的边界（不是预测）", 15, NAVY, "middle", "bold"))
    s.append(txt(W / 2, 46, "起点＝2025年整体COR 96.8378%（分部精确底数）。情景只决定“哪些力量继续、哪些停止”，不新增任何数值假设",
                 11, MUTED, "middle"))

    rows = [
        ("A　延续：上年各险种贡献原样重复一次", d["情景A"], d["情景A_COR"],
         "算术上不成立：需保证险承保利润 4,445 百万元，而该分部全年收入只有 4,416 百万元", ORANGE, True),
        ("B　基准：保证险不再贡献增量，也不回吐", d["情景B"], d["情景B_COR"],
         "车险按上年幅度继续改善，核心非车按上年幅度继续恶化", GREEN, False),
        ("C　压力：B ＋ 保证险 2025 年的增益全部消失", d["情景C"], d["情景C_COR"],
         "保证险回吐 0.6180 个百分点，等于 2025 年它给整体带来的增益", YELLOW, False),
        ("D　强压力：C ＋ 新能源占比再按上年幅度提升、x 取上限", d["情景D"], d["情景D_COR"],
         "车险项由 1.5219 降至 1.2024，新能源结构拖累取 0.3195 个百分点上限", RED, False),
    ]
    L, T = 30, 76
    zero_x, scale = 470, 190.0        # 每 1 个百分点 190px
    for i, (name, delta, cor, memo, col, dead) in enumerate(rows):
        y = T + i * 62
        s.append(rect(L, y, 940, 54, col, 0.07, 7, col))
        s.append(txt(L + 14, y + 20, name, 12, NAVY if not dead else MUTED, "start", "bold"))
        s.append(txt(L + 14, y + 38, memo, 10.5, MUTED))
        w = abs(delta) * scale
        bx = zero_x if delta > 0 else zero_x - w
        s.append(rect(bx, y + 14, w, 20, col, 0.55 if dead else 0.9, 3))
        s.append(txt(zero_x + (w + 8 if delta > 0 else -w - 8), y + 29,
                     f"{delta:+.4f} pp", 11, col, "start" if delta > 0 else "end", "bold"))
        s.append(txt(930, y + 29, f"COR {cor:.2f}%", 11.5, NAVY if not dead else MUTED, "end", "bold"))
        if dead:
            s.append(line(bx, y + 24, bx + w, y + 24, ORANGE, 2))
    s.append(line(zero_x, T - 6, zero_x, T + 4 * 62 - 8, MUTED, 1.2))
    s.append(txt(zero_x, T - 12, "0（与2025持平）", 10, MUTED, "middle"))
    s.append(txt(zero_x - 100, T - 12, "← 恶化", 10.5, RED, "middle", "bold"))
    s.append(txt(zero_x + 100, T - 12, "改善 →", 10.5, GREEN, "middle", "bold"))

    s.append(notes(W, H, [
        "可用区间是 B 到 D：整体 COR 落在 96.03%—96.97%，对应承保利润影响 −454 至 +2,724 百万元。",
        "换算按 2025 年保险服务收入 338,912 百万元，每 1 个百分点 ≈ 3,389 百万元；不含对 2026 年收入的任何预测。",
        "口径：各档幅度直接等于已核验的历史观测值或恒等式结果（险种贡献见图C；保证险回吐＝2025年保证险承保利润÷整体保险服务收入）。投资端不做情景。",
        "来源：平安产险_年度信息披露报告_2025.pdf PDF第117及119页；中国平安_年报_2024.pdf PDF第45页、2025.pdf PDF第54、56、58页",
    ]))
    s.append("</svg>")
    return "".join(s)


# =============================================================== 图 E 结果快照
def fig_snapshot():
    W, H = 1000, 300
    s = [head(W, H, "经营结果快照", "公司结果更新至2026Q1，行业数据更新至2026Q2。")]
    s.append(rect(0, 0, W, 44, NAVY, 1, 0))
    s.append(txt(20, 28, "图E　经营结果快照", 14.5, "#ffffff", "start", "bold"))
    s.append(txt(W - 20, 20, "公司经营结果：2026Q1（最新已披露）", 10.5, "#ffffff", "end", "bold"))
    s.append(txt(W - 20, 35, "行业月度数据：2026Q2（2026年6月）", 10, "#c9dcf5", "end"))
    cards = [
        ("整体COR　2025", "96.80%", "同比 −1.50pp；同业均值 −1.20pp", GREEN),
        ("承保利润　2025", "10,717", "百万元　同比 +96.17%；2023 为 −2,083", GREEN),
        ("总投资收益　2025", "11,927", "百万元　同比 −26.03%", RED),
        ("净利润　2025", "14,597", "百万元　同比 −2.82%", RED),
        ("整体COR　2026Q1", "94.90%", "同比 −0.70pp；赔付率 +0.50pp", YELLOW),
        ("签单保费　2026Q1", "95,423", "百万元　同比 +6.84%；车险 −0.50%", YELLOW),
        ("核心非车COR　2025", "100.82%", "已跨过承保盈亏线；责任险 106.8%", RED),
        ("综合偿付能力　2026Q1", "217.9%", "核心 171.9%；增长不受资本约束", GREEN),
    ]
    tw, th = 232, 78
    for i, (lb, v, sub, col) in enumerate(cards):
        x = 24 + (i % 4) * (tw + 12)
        y = 60 + (i // 4) * (th + 10)
        s.append(rect(x, y, tw, th, "#ffffff", 1, 8, "#dce5f0"))
        s.append(rect(x, y, 4, th, col, 1, 2))
        s.append(txt(x + 14, y + 18, lb, 10, MUTED))
        s.append(txt(x + 14, y + 44, v, 19, col, "start", "bold"))
        s.append(txt(x + 14, y + 63, sub, 9.5, MUTED))
    s.append(notes(W, H, [
        "口径：2025 年度为集团年报 IFRS 17 口径；2026Q1 为偿付能力季度累计（法人单体）监管口径；两套不互换，也不相减。",
        "来源：中国平安_年报_2024.pdf PDF第45–46页、2025.pdf PDF第56–57页；平安产险_偿付能力报告_2025Q1／2026Q1.pdf PDF第18页；"
        "平安产险_年度信息披露报告_2025.pdf PDF第117及119页",
    ]))
    s.append("</svg>")
    return "".join(s)


FIGS = {"snapshot": fig_snapshot, "argument": fig_argument, "method": fig_method,
        "waterfall": fig_waterfall, "scenario": fig_scenario}


# =============================================================== 内容
BLOCKS = []
def h2(t, a):   BLOCKS.append(("h2", t, a))
def h3(t):      BLOCKS.append(("h3", t))
def para(t):    BLOCKS.append(("p", t))
def li(x):      BLOCKS.append(("ul", x))
def fig(k, c):  BLOCKS.append(("fig", k, c))
def tbl(c, hd, rw): BLOCKS.append(("table", c, hd, rw))
def box(k, t):  BLOCKS.append(("box", k, t))

P = d  # 简写

# ---------------------------------------------------------------- 一、结论
h2("一、结论", "s1")

box("key", f"""<b>平安产险这一轮承保利润改善，多少来自自身能力，多少来自外部环境？还能持续多久？</b><br><br>
把最新一个完整年度（2024→2025）单独拿出来看：整体综合成本率改善 {n(P['COR精确改善24_25'],4)} 个百分点，
同期人保财险与太保产险的改善均值是 {n(P['同业COR24_25'][3],2)} 个百分点，平安超额只有 {n(P['同业COR24_25'][4],2)} 个百分点。
而<b>仅保证保险一个分部就贡献了 {n(SC_GUA,4)} 个百分点</b>。把这一项剔掉，平安的剩余改善是
{n(P['情景B'],4)} 个百分点，<b>已经低于同业均值</b>，差 {n(P['剔保证险对同业24_25'],4)} 个百分点。<br><br>
所以：行业共同因素占大头；公司特有的那部分里，又有很大一块是保证保险出清这一阶段性事件；
真正能归到可持续经营能力的部分，在最新年度已经不足以跑赢同业。""")

para(f"""三年窗口（2023→2025）给出的印象正好相反：整体改善 {n(P['COR精确改善23_25'],4)} 个百分点，
剔除保证保险后仍剩 {n(P['剔保证险改善23_25'],4)} 个百分点，高于同业均值 {n(P['同业COR23_25'][3],2)} 个百分点。
两个结论都成立，差别只在起点。我以最新一年为准，因为经营动作要解决的是下一期，不是回顾三年。""")

fig("argument", "图A　核心论证链")

box("warn", f"""<b>这个比较的不对称之处，必须自己先说。</b>我只对平安剔除了保证保险，没有对人保和太保剔除各自可能存在的
一次性项目——两家都没有披露可比的分部数据。所以它是方向提示，不是能力排名。
把局限写在结论旁边，而不是藏在附录里，是我做这份分析的基本习惯。""")

fig("snapshot", "图E　经营结果快照")

# ---------------------------------------------------------------- 二、方法
h2("二、我是怎么拆的", "s2")

para("""这份分析不从「我有哪些数据」出发，而从「管理层要做哪一步判断」出发。
指标体系负责发现异常，异常越线才触发专题，专题结论必须落到有责任单元和验收指标的动作上，下一期再用同一套指标验收。""")

fig("method", "图B　分析链条")

li([
    "<b>先定口径，再取数。</b>2023 年起执行 IFRS 17／新保险合同准则，保险服务收入、承保利润、COR 的计量基础全变了。"
    "先建口径字典（指标／定义／公式／来源页码／可比区间／准则断点），再动手取数——口径没定死，取回来的数没法用。",
    "<b>每个数字带出处，精确到文件名＋页码／表号。</b>做不到出处的数字不进报告，宁可留空。"
    "推算值统一写成「推算值｜方法｜输入来源」三段式，不让推算冒充实测。",
    "<b>所有归因至少切四刀：</b>量 vs 价、频次 vs 单价、结构效应 vs 效率效应、一次性 vs 可持续。"
    "任何同比大幅改善，都要先回答「明年还会再发生一次吗」。",
    "<b>外部因素用同业剥离。</b>行业都在改善的时候，单看自己的改善说明不了任何事。",
])

# ---------------------------------------------------------------- 三、发现
h2("三、三个发现", "s3")

h3("发现一　整体改善是几股力量对冲后的净值，不是「各业务线普遍变好」")
fig("waterfall", "图C　险种贡献瀑布（2024→2025）")
para(f"""车险与保证保险合计带来 {n(SC_CAR+SC_GUA,4)} 个百分点的毛改善，核心非车（意健险＋责任险＋其他财产险）
反向抵消 {n(-SC_NON,4)} 个百分点，抵消掉 {n(-SC_NON/(SC_CAR+SC_GUA)*100,1)}%，净改善才是 {n(P['COR精确改善24_25'],4)} 个百分点。
核心非车 2025 年 COR 已升至 {n(P['核非车25'][2],2)}%，跨过承保盈亏线；责任险 COR 由 102.7% 升到 106.8%，
而收入基本持平（23,978→24,052 百万元）——收入不增而亏损扩大，不能用规模增长解释。""")

h3("发现二　费用率下降主要是行业性的，不能直接写成自身效率提升")
tbl("三家综合费用率与改善（%、个百分点）",
    ["公司", "2023", "2025", "2023→2025 改善", "2024→2025 改善"],
    [[e, n(PEERS[e]['2023'][2],1), n(PEERS[e]['2025'][2],1),
      n(PEERS[e]['2023'][2]-PEERS[e]['2025'][2],1), n(PEERS[e]['2024'][2]-PEERS[e]['2025'][2],1)]
     for e in ["平安产险", "人保财险", "太保产险"]] +
    [["<b>同业均值</b>", "—", "—", f"<b>{n(P['同业费用23_25'][3],2)}</b>", f"<b>{n(P['同业费用24_25'][3],2)}</b>"],
     ["<b>平安超额</b>", "—", "—", f"<b>{n(P['同业费用23_25'][4],2)}</b>",
      f"<b>{n(P['同业费用24_25'][4],2)}</b>"]])
para(f"""三家同步下降，平安相对同业均值的超额三年只有 {n(P['同业费用23_25'][4],2)} 个百分点，最新一年是
{n(P['同业费用24_25'][4],2)} 个百分点。行业共同费用压降的中性参照是 {n(P['同业费用23_25'][3],2)} 个百分点，
相当于平安费用率改善 {n(P['费用改善23_25'],1)} 个百分点中的 {n(P['同业费用23_25'][3]/P['费用改善23_25']*100,1)}%。<br>
但反过来也不能把这个区间命名为「报行合一的纯效应」：它混合了监管政策、渠道结构、业务结构、费用投放和数字化，
公开数据不足以分离。年报没有披露分险种综合费用率，传导比例无法精确推出——这一点我在报告里留成了缺口，没有硬估。""")

h3("发现三　新能源结构成本：先把量纲问对，再谈影响")
box("key", f"""新能源车 COR 与燃油车 COR 的<b>差距</b>上限是 {n(NEV['x_max'],2)} 个百分点，这是车型之间的差距。
新能源保费占比每提高 1 个百分点，<b>整体车险 COR</b> 被拖高的是 1% × {n(NEV['x_max'],2)}pp ＝
{n(NEV['x_max']/100,4)} 个百分点——不是 {n(NEV['x_max'],2)} 个百分点。两者差两个数量级。<br><br>
2024→2025 新能源保费占比提高 {n(NEV['dw'],4)} 个百分点，对应结构拖累区间 0—{n(SC_NEV,4)} 个百分点。
同期车险 COR 实际改善 2.30 个百分点，所以新能源结构没有让车险 COR 上升，它最多抵消了其他改善的
{n(SC_NEV/2.30*100,1)}%。结果写成区间，不写单点；上限 {n(NEV['x_max'],2)} 个百分点是「新能源仍处于承保盈利」
约束下反推的条件边界，不是公司披露的实测差距。""")
para("""把这条单独列出来，是因为它是这个专题最容易出错的地方：把「车型之间的 COR 差距」
和「整体 COR 受到的影响」当成同一个数量级，结论会错两个数量级。""")

# ---------------------------------------------------------------- 四、持续性
h2("四、还能持续多久", "s4")

box("warn", f"""<b>一条不依赖任何假设的边界。</b>如果 2026 年要重复上一年的整体改善 {n(P['COR精确改善24_25'],4)} 个百分点，
保证保险需要再贡献 {n(SC_GUA,4)} 个百分点。按 2025 年的收入规模，这要求该分部承保利润达到
{n(P['情景A所需保证险利润'],0)} 百万元——而它 2025 年<b>全部保险服务收入只有 {n(GUARANTEE['2025'][0],0)} 百万元</b>。
利润不可能超过收入。所以「照上年速度再改善一次」在算术上就不成立。这不是预测，是恒等式。""")

para(f"""保证保险的收入权重已从 2023 年的 {n(GUARANTEE['2023'][2],3)}% 降到 2025 年的 {n(GUARANTEE['2025'][2],3)}%。
即使分部 COR 降到 0，对整体的增益上限也只有 {n(P['保证险算术上限'],4)} 个百分点，其中 {n(P['保证险2025增益'],4)}
个百分点已经在 2025 年兑现——最多再挤出 {n(P['保证险剩余弹药'],4)} 个百分点。这门「弹药」基本打完了。""")

fig("scenario", "图D　情景边界")

tbl("改善来源的可持续性标签",
    ["驱动项", "标签", "明年还会发生吗"],
    [["保证保险出清", '<span class="tag red">一次性</span>', "不会。规模已不足以再贡献同等量级"],
     ["行业费用压降（含报行合一）", '<span class="tag yellow">一次性重置＋周期性</span>', "幅度不会重复。水平已下移，再降需要新抓手"],
     ["车险经营（费用精细化、数字化、风险筛选）", '<span class="tag green">能力性（部分）</span>', "可能延续，但幅度不明；且被新能源结构成本侵蚀"],
     ["赔付端相对优势", '<span class="tag yellow">能力性与一次性混合</span>',
      "部分不会。保证险亏损在 IFRS 17 下计入保险服务费用、落进综合赔付率，其转正会直接压低赔付率"],
     ["核心非车恶化", '<span class="tag red">结构性、持续</span>', "会，且可能加重"],
     ["新能源结构成本", '<span class="tag red">结构性、单向</span>', "会。占比提升是趋势性的"],
     ["投资收益", '<span class="tag yellow">周期性／市场性</span>', "方向不可预判，只能留在监控链条里"]])

para(f"""能明确打上「能力性」标签的只有车险经营一项，而它同时承受新能源结构成本的单向侵蚀；
明确是一次性的（保证险出清）和明确是水平重置的（行业费用压降），恰好是过去两年贡献最大的两项；
明确会继续恶化的（核心非车、新能源结构）没有对应的已实现改善来抵消。
按当前结构，超额改善的来源在最新一年已经基本耗尽。""")

# ---------------------------------------------------------------- 五、动作
h2("五、因此该做什么：未来 90 天", "s5")

tbl("90 天行动表（节选，完整版含验收指标与责任单元）",
    ["时点", "对象", "触发它的异常", "经营动作", "验收指标"],
    [[a[0], f"<b>{a[1]}</b>", a[7], a[4], a[5]] for a in ACTIONS[:4]])

box("note", f"""<b>为什么不承诺具体的改善幅度。</b>公开数据里没有「经营动作→COR／利润」的弹性系数，
硬写一个百分点数就是编。所以每项动作只承诺可复核的信号方向：红灯停止扩大、黄灯退回绿区、桥接勾稽完成。
责任单元也只到职能条线——公开披露不含机构、渠道、人员维度，落到具体单元需要内部数据。<br><br>
其中优先级最高的一条其实是口径建议：<b>把「剔除保证险 COR」变成固定披露口径</b>，与整体 COR 同时出。
否则一次性出清会被写进可持续基线，明年的目标就定错了。""")

# ---------------------------------------------------------------- 六、方法与纪律
h2("六、方法与数据纪律", "s6")

para("""这一节写给评估这份作业的人看：下面每一条都是这个项目实际执行的规则，不是事后总结的口号。""")

tbl("执行规则与本项目的落实情况",
    ["规则", "落实情况"],
    [["只用公开数据，来源白名单化",
      "年报／中报、季度偿付能力报告、年度信息披露报告、金融监管总局月度数据、业绩发布会实录。"
      "券商研报只作口径参照和线索，数字必须回原文核实后才可使用。"],
     ["每个数字带出处，精确到文件名＋页码／表号",
      "完整版正文与图注共 39 处推算标签、26 张表全部标注来源；附录含来源索引与推算清单。"],
     ["推算不冒充实测",
      "统一格式「推算值｜方法｜输入来源」。例如隐含承保车辆数＝车险签单保费÷车均保费，"
      "并注明车均保费按元取整披露会带来误差。"],
     ["跨准则不连线",
      "2022 年为旧准则原报（分母为已赚保费），2023 年起为 IFRS 17；2022R 为重述比较期，处处标注「重述口径」。"
      "所有跨 2022／2023 的图表都画出可见断点，会计指标不连成同一条曲线。"],
     ["不替作者做假设取值",
      "新能源 COR 差区间 x、指标阈值、90 天动作的效果口径，都以「假设｜依据｜影响｜需确认」格式提出并等确认。"
      "量价分解的交互项没有分摊，因为分摊方法（基期法／平均权重／对称分解）尚未确认。"],
     ["机械校验可复现",
      "30 项恒等式校验在每次生成报告时实跑：分部收入与利润勾稽、险种贡献合计＝整体改善、"
      "Shapley 两效应之和＝总贡献、赔付率＋费用率＝COR、四项利润变动＝净利润变动、量价三项＝实际变动等，全部 PASS。"],
     ["数据截止日不含糊",
      "行业月度数据更新至 2026Q2（2026 年 6 月），公司经营结果只到 2026Q1（Q2 尚未披露）。"
      "报告全文分别标注，不用行业 Q2 替代公司 Q2，也不预测后写成实测。"],
     ["不写投资建议",
      "读者定位是公司内部经营分析岗，结论落到「内部该做什么动作」，不落到「这只股票买不买」。"]])

box("note", """<b>关于工具。</b>取数、计算、图表和报告由脚本生成，数据层与图表层分离，重跑即可复现；
所有判断、口径定义和假设取值由我决定。AI 承担的是取数整理、计算、可视化和交叉检验，
每一步的推翻与回查都记在协作日志里——包括我推翻它结论的时刻，和它提数出错被我抓到的时刻。""")

# ---------------------------------------------------------------- 七、局限
h2("七、这份分析回答不了什么", "s7")

li([
    f"<b>非车增速落不到险种。</b>2026Q1 非车签单保费同比 {sgn(P['非车签单yoy'])}%、占比升 {n(P['非车占比变化'],2)} 个百分点，"
    "但偿付能力报告只披露非车前五大险种签单保费合计、不标明具体险种，无法确认增量落在哪里。这也正是第一项经营动作的起点。",
    "<b>分险种赔付率与费用率未披露</b>，无法精确剥离保证保险对综合赔付率的影响，也无法把费用改善按险种归属。",
    "<b>保证保险利润中准备金释放的占比无法确认</b>：回溯偏差报告是公司整体口径，且脚注注明按旧保险合同等准则编制。",
    "<b>季度不披露承保利润与投资收益金额</b>，四项利润桥接只能做到年度。",
    "<b>客户、渠道、车型、地区、赔案维度全部缺失</b>，公开数据只能定位到公司层与部分险种层，"
    "再往下需要内部数据，报告中统一标注「公开数据缺失／需要内部数据验证」。",
])

para("""把这些写清楚，是因为经营分析的价值不在于把每个格子填满，而在于让看的人知道
哪些结论可以直接拿去决策，哪些还需要再取一次数。""")


# =============================================================== 渲染
CSS = """
:root{--navy:#17365d;--blue:#1f4e78;--acc:#2e75b6;--ink:#1e293b;--muted:#5b6472;
--bg:#eef2f7;--card:#fff;--grid:#dde5f0;--green:#2f7a3e;--yellow:#b8860b;--red:#c0392b;--orange:#a4562f}
*{box-sizing:border-box}html{scroll-behavior:smooth}
body{margin:0;background:var(--bg);color:var(--ink);line-height:1.9;font-size:16px;
font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;
-webkit-text-size-adjust:100%}
p,li,td,th,caption,.box,figcaption{overflow-wrap:anywhere}
.wrap{max-width:940px;margin:0 auto;padding:0 20px 72px}
.hero{background:linear-gradient(135deg,#17365d,#28578f);color:#fff;margin:0 -20px 26px;padding:38px 30px 30px;
border-radius:0 0 18px 18px}
.hero .kicker{font-size:12.5px;letter-spacing:.14em;color:#9fc0e8;margin:0 0 10px}
.hero h1{margin:0 0 10px;font-size:clamp(24px,4vw,34px);line-height:1.28}
.hero .q{margin:0 0 18px;color:#d3e3f7;font-size:clamp(13.5px,1.9vw,16px);max-width:720px}
.hero .meta{display:flex;flex-wrap:wrap;gap:8px}
.hero .meta span{background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.24);
padding:4px 12px;border-radius:999px;font-size:12.5px}
nav.toc{background:var(--card);border-radius:12px;padding:14px 18px;margin-bottom:22px;
box-shadow:0 2px 12px rgba(23,54,93,.06);display:flex;flex-wrap:wrap;gap:8px;align-items:center}
nav.toc b{font-size:12px;color:var(--muted);letter-spacing:.1em;margin-right:4px}
nav.toc a{color:var(--blue);text-decoration:none;font-size:13.5px;border:1px solid var(--grid);
padding:4px 11px;border-radius:999px}
nav.toc a:hover{background:#eef4fb;border-color:var(--acc)}
section{background:var(--card);border-radius:14px;padding:28px 32px;margin-bottom:20px;
box-shadow:0 2px 14px rgba(23,54,93,.06)}
h2{color:var(--navy);font-size:clamp(20px,2.6vw,25px);margin:0 0 16px;padding-bottom:12px;border-bottom:2px solid var(--grid)}
h3{color:var(--blue);font-size:17.5px;margin:30px 0 8px}
h3:first-of-type{margin-top:8px}
p{margin:14px 0}ul{margin:14px 0;padding-left:22px}li{margin:10px 0}
b{color:var(--navy)}
figure{margin:24px 0}
.figbox{background:#fff;border:1px solid var(--grid);border-radius:10px;padding:10px;overflow-x:auto}
.figbox svg{display:block;min-width:700px;width:100%;height:auto}
figcaption{font-size:13px;color:var(--muted);margin-top:8px;text-align:center}
.tw{overflow-x:auto;margin:18px 0;border:1px solid var(--grid);border-radius:10px}
table{width:100%;border-collapse:collapse;font-size:14px;min-width:560px}
th{background:var(--blue);color:#fff;text-align:left;padding:10px 13px;font-weight:600;white-space:nowrap}
td{border-bottom:1px solid var(--grid);padding:10px 13px;vertical-align:top}
tbody tr:nth-child(even){background:#f8fafd}
caption{caption-side:top;text-align:left;font-weight:700;color:var(--navy);padding:12px 13px 6px;font-size:14px}
.tag{display:inline-block;padding:2px 9px;border-radius:999px;font-weight:700;font-size:11.5px;white-space:nowrap}
.tag.green{background:#e6f2e6;color:var(--green)}.tag.yellow{background:#fdf3d9;color:var(--yellow)}
.tag.red{background:#fbe6e2;color:var(--red)}
.box{margin:20px 0;padding:18px 22px;border-radius:10px;border-left:5px solid}
.box.key{background:#eef4fb;border-color:var(--acc);font-size:16.5px}
.box.warn{background:#fdf1ec;border-color:var(--red)}
.box.note{background:#f6f8fa;border-color:#9aa5b1}
.box .t{display:block;font-weight:700;color:var(--navy);margin-bottom:6px;font-size:12.5px;letter-spacing:.06em}
.foot{color:var(--muted);font-size:13px;text-align:center;padding:14px 0 0;line-height:1.8}
.foot a{color:var(--blue)}
@media(max-width:720px){
 .wrap{padding:0 12px 56px}.hero{margin:0 -12px 18px;padding:26px 18px 22px}
 section{padding:20px 16px}body{font-size:15.5px}.figbox{padding:6px}
}
@media print{body{background:#fff}nav.toc{display:none}
 section{box-shadow:none;border:1px solid #ddd;page-break-inside:avoid}.figbox svg{min-width:0}}
"""


def E(x): return html.escape(str(x), quote=False)


def strip(t):
    import re
    t = t.replace("<br>", "\n").replace("<br/>", "\n")
    t = re.sub(r"<span[^>]*>|</span>", "", t)
    return re.sub(r"</?b>", "**", t)


def md_render():
    L = ["# 平安产险经营分析报告（面试版）", "",
         "> **作品说明**：仅使用公开数据（年报、季度偿付能力报告、金融监管总局月度数据）完成的一次完整经营分析。",
         "> 核心问题：这一轮承保利润改善，多少来自自身能力，多少来自外部环境？还能持续多久？",
         "> 读者定位为公司内部经营分析岗，不含任何投资建议。",
         "> 数据截止：行业月度数据至 2026Q2（2026 年 6 月）；平安产险公司经营结果至 2026Q1。",
         "> 完整版（含 12 张图、26 张表、30 项机械校验）见 `平安产险经营分析报告_优化版.html`。", "", "---", ""]
    for b in BLOCKS:
        k = b[0]
        if k == "h2":
            L += ["", f"## {b[1]}", ""]
        elif k == "h3":
            L += ["", f"### {b[1]}", ""]
        elif k == "p":
            L += [strip(" ".join(b[1].split())), ""]
        elif k == "ul":
            L += ["- " + strip(" ".join(x.split())) for x in b[1]] + [""]
        elif k == "fig":
            L += [f"**{b[2]}**　（见 HTML 版内嵌 SVG）", ""]
        elif k == "table":
            _, cap, hd, rw = b
            L += [f"**{cap}**", "", "| " + " | ".join(hd) + " |", "|" + "|".join(["---"] * len(hd)) + "|"]
            for r in rw:
                L.append("| " + " | ".join(strip(str(c)).replace("\n", " ") for c in r) + " |")
            L.append("")
        elif k == "box":
            tag = {"key": "结论", "warn": "注意", "note": "说明"}[b[1]]
            L += [f"> **{tag}**　" + strip(" ".join(b[2].split())).replace("\n", " "), ""]
    return "\n".join(L)


def html_render():
    o = ['<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">',
         '<meta name="viewport" content="width=device-width,initial-scale=1">',
         '<title>平安产险经营分析报告（面试版）</title>',
         f'<style>{CSS}</style></head><body><div class="wrap">',
         '<header class="hero">',
         '<p class="kicker">经营分析作品　｜　公开数据 ＋ 可复现脚本</p>',
         '<h1>平安产险这一轮承保利润改善，<br>多少来自自身能力，多少来自外部环境？</h1>',
         '<p class="q">仅使用年报、季度偿付能力报告与金融监管总局月度数据完成的一次完整经营分析：'
         '从经营结果拆到驱动因素，用同业剥离外部环境，再判断改善能不能持续，最后落到 90 天动作。'
         '读者定位是公司内部经营分析岗，不含任何投资建议。</p>',
         '<div class="meta"><span>行业数据：至 2026Q2（2026年6月）</span>'
         '<span>公司经营结果：至 2026Q1</span><span>仅公开数据</span>'
         '<span>30 项机械校验全部 PASS</span><span>离线可打开，无外部依赖</span></div></header>',
         '<nav class="toc"><b>目录</b>']
    for b in BLOCKS:
        if b[0] == "h2":
            o.append(f'<a href="#{b[2]}">{E(b[1])}</a>')
    o.append('</nav>')
    open_sec = False
    for b in BLOCKS:
        k = b[0]
        if k == "h2":
            if open_sec:
                o.append("</section>")
            o.append(f'<section id="{b[2]}"><h2>{E(b[1])}</h2>')
            open_sec = True
        elif k == "h3":
            o.append(f"<h3>{E(b[1])}</h3>")
        elif k == "p":
            o.append(f"<p>{' '.join(b[1].split())}</p>")
        elif k == "ul":
            o.append("<ul>" + "".join(f"<li>{' '.join(x.split())}</li>" for x in b[1]) + "</ul>")
        elif k == "fig":
            o.append(f'<figure><div class="figbox">{FIGS[b[1]]()}</div>'
                     f'<figcaption>{E(b[2])}</figcaption></figure>')
        elif k == "table":
            _, cap, hd, rw = b
            o.append(f'<div class="tw"><table><caption>{E(cap)}</caption><thead><tr>'
                     + "".join(f"<th>{E(x)}</th>" for x in hd) + "</tr></thead><tbody>")
            for r in rw:
                o.append("<tr>" + "".join(f"<td>{c}</td>" for c in r) + "</tr>")
            o.append("</tbody></table></div>")
        elif k == "box":
            tag = {"key": "结论", "warn": "注意", "note": "说明"}[b[1]]
            o.append(f'<div class="box {b[1]}"><span class="t">{tag}</span>{" ".join(b[2].split())}</div>')
    if open_sec:
        o.append("</section>")
    o.append('<div class="foot">完整版（12 张图、26 张表、16 条推算清单、30 项机械校验、来源索引与数据缺口表）'
             '见 <b>平安产险经营分析报告_优化版.html</b>；分析框架见 <b>平安产险经营分析框架.md</b>；'
             '取数、测算与出图脚本见 <b>/02-脚本</b>，重跑即可复现。<br>'
             '仅使用公开数据　｜　行业数据至 2026Q2、公司经营结果至 2026Q1　｜　本报告服务于内部经营管理，不构成任何投资建议</div>')
    o.append('</div></body></html>')
    return "".join(o)


if __name__ == "__main__":
    md, ht = md_render(), html_render()
    with open(os.path.join(OUT, "平安产险经营分析报告_面试版.md"), "w", encoding="utf-8") as f:
        f.write(md)
    with open(os.path.join(OUT, "平安产险经营分析报告_面试版.html"), "w", encoding="utf-8") as f:
        f.write(ht)
    full = open(os.path.join(OUT, "平安产险经营分析报告_优化版.md"), encoding="utf-8").read()
    print(f"MD   {len(md):,} 字符（完整版 {len(full):,}，压缩到 {len(md)/len(full)*100:.0f}%）")
    print(f"HTML {len(ht):,} 字符，图 {sum(1 for b in BLOCKS if b[0]=='fig')} 张，"
          f"表 {sum(1 for b in BLOCKS if b[0]=='table')} 张，章节 {sum(1 for b in BLOCKS if b[0]=='h2')} 节")
