import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs/stage3_4_nonauto");
await fs.mkdir(outputDir, { recursive: true });
const xlsxPath = path.join(outputDir, "阶段3-4_非车反向压力.xlsx");
const csvPath = path.join(outputDir, "阶段3-4_非车反向压力.csv");
const dataMdPath = path.join(outputDir, "阶段3-4_非车反向压力.md");
const reportMdPath = path.join(outputDir, "阶段3-4_非车反向压力报告.md");

const periods = [2023, 2024, 2025];
const raw = {
  2023: {
    totalRevenue: 313457.529726,
    autoRevenue: 209538,
    healthRevenue: 10655,
    accidentRevenue: 11224,
    ahCombinedRevenue: null,
    guaranteeRevenue: 22002.723838,
    liabilityRevenue: 21848,
    liabilityProfit: -1373,
    liabilityCor: 1.063,
    op: [4855.286223, -159.017177, 252.923080, -6834.353175],
    oi: [122.862529, 0.003959, 74.707846, 0.133849],
  },
  2024: {
    totalRevenue: 328146.308886,
    autoRevenue: 220026,
    healthRevenue: 14865,
    accidentRevenue: 11323,
    ahCombinedRevenue: null,
    guaranteeRevenue: 11532.507005,
    liabilityRevenue: 23978,
    liabilityProfit: -644,
    liabilityCor: 1.027,
    op: [4397.770028, 1097.803331, 465.268033, -247.854406],
    oi: [197.267158, 0.038053, 52.293138, 0.034672],
  },
  2025: {
    totalRevenue: 338912.305427,
    autoRevenue: 228495,
    healthRevenue: null,
    accidentRevenue: null,
    ahCombinedRevenue: 32769,
    guaranteeRevenue: 4415.533885,
    liabilityRevenue: 24052,
    liabilityProfit: -1642,
    liabilityCor: 1.068,
    op: [9697.115678, 188.643174, -1004.709604, 2094.629644],
    oi: [200.736847, 0.018383, 57.917186, 0.022190],
  },
};

const source = {
  group2023: "中国平安_年报_2023.pdf，PDF第29页（报告印刷页码25），按险种划分的经营业绩表",
  group2024: "中国平安_年报_2024.pdf，PDF第45页（报告印刷页码41），按险种划分的经营业绩表",
  group2025: "中国平安_年报_2025.pdf，PDF第56页（报告印刷页码52），按险种划分的经营业绩表",
  legal2023: "平安产险_年度信息披露报告_2023.pdf，PDF第118页，分部报告（2023年度）",
  legal2024: "平安产险_年度信息披露报告_2025.pdf，PDF第119页，分部报告（2024年度比较数）",
  legal2025: "平安产险_年度信息披露报告_2025.pdf，PDF第117页，分部报告（2025年度）",
  corDef: "中国平安_年报_2025.pdf，PDF第56页（报告印刷页码52），综合成本率公式",
};
const groupSource = { 2023: source.group2023, 2024: source.group2024, 2025: source.group2025 };
const legalSource = { 2023: source.legal2023, 2024: source.legal2024, 2025: source.legal2025 };
const sourceRoot = new URL("../00-原始材料/", import.meta.url).pathname;

const calc = {};
for (const y of periods) {
  const d = raw[y];
  const ahRevenue = d.ahCombinedRevenue ?? (d.healthRevenue + d.accidentRevenue);
  const autoProfit = d.op[0] - d.oi[0];
  const ahProfit = d.op[1] - d.oi[1];
  const otherPcProfit = d.op[2] - d.oi[2];
  const guaranteeProfit = d.op[3] - d.oi[3];
  const totalProfit = autoProfit + ahProfit + otherPcProfit + guaranteeProfit;
  const otherPcRevenue = d.totalRevenue - d.autoRevenue - ahRevenue - d.guaranteeRevenue;
  const coreNonautoRevenue = ahRevenue + otherPcRevenue;
  const coreNonautoProfit = ahProfit + otherPcProfit;
  const cor = (p, r) => 1 - p / r;
  calc[y] = {
    ahRevenue, autoProfit, ahProfit, otherPcProfit, guaranteeProfit, totalProfit,
    otherPcRevenue, coreNonautoRevenue, coreNonautoProfit,
    overallCor: cor(totalProfit, d.totalRevenue),
    autoCor: cor(autoProfit, d.autoRevenue),
    ahCor: cor(ahProfit, ahRevenue),
    otherPcCor: cor(otherPcProfit, otherPcRevenue),
    guaranteeCor: cor(guaranteeProfit, d.guaranteeRevenue),
    coreNonautoCor: cor(coreNonautoProfit, coreNonautoRevenue),
  };
}

const effect = (start, end, profitStart, profitEnd) =>
  (-profitStart / raw[start].totalRevenue) * 100 - (-profitEnd / raw[end].totalRevenue) * 100;

function bridge(start, end) {
  const auto = effect(start, end, calc[start].autoProfit, calc[end].autoProfit);
  const guarantee = effect(start, end, calc[start].guaranteeProfit, calc[end].guaranteeProfit);
  const ah = effect(start, end, calc[start].ahProfit, calc[end].ahProfit);
  const liability = effect(start, end, raw[start].liabilityProfit, raw[end].liabilityProfit);
  const residual = effect(
    start,
    end,
    calc[start].otherPcProfit - raw[start].liabilityProfit,
    calc[end].otherPcProfit - raw[end].liabilityProfit,
  );
  return {
    auto, guarantee, ah, liability, residual,
    otherPc: liability + residual,
    coreNonauto: ah + liability + residual,
    total: auto + guarantee + ah + liability + residual,
    directTotal: (calc[start].overallCor - calc[end].overallCor) * 100,
  };
}
const b2425 = bridge(2024, 2025);
const b2325 = bridge(2023, 2025);
const gross2425 = b2425.auto + b2425.guarantee;
const offset2425 = -b2425.coreNonauto / gross2425;
const liabilityShareOtherPc = b2425.liability / b2425.otherPc;
const coreProfitSwing2425 = calc[2025].coreNonautoProfit - calc[2024].coreNonautoProfit;

const fmt = (n, d = 4) => Number(n).toFixed(d);
const pct = (n, d = 4) => `${(n * 100).toFixed(d)}%`;
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
const tag = (value, method, inputs) => `【推算：${value}｜方法：${method}｜输入来源：${inputs}】`;

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const inputs = workbook.worksheets.add("Inputs");
const trend = workbook.worksheets.add("Trend");
const bridgeSheet = workbook.worksheets.add("Bridge");
const checks = workbook.worksheets.add("Checks");
const sources = workbook.worksheets.add("Sources");
workbook.comments.setSelf({ displayName: "User" });

const C = {
  navy: "#17365D", blue: "#1F4E78", white: "#FFFFFF", black: "#000000",
  green: "#008000", red: "#C00000", yellow: "#FFF2CC", gray: "#F2F2F2",
  paleBlue: "#EAF3F8", lightGreen: "#E2F0D9", lightRed: "#FCE4D6", darkGray: "#666666",
};

function title(sheet, range, text, subtitle) {
  sheet.getRange(range).merge();
  const left = range.split(":")[0];
  const endCol = range.split(":")[1].match(/[A-Z]+/)[0];
  const startCol = left.match(/[A-Z]+/)[0];
  const row = Number(left.match(/\d+/)[0]);
  sheet.getRange(left).values = [[text]];
  sheet.getRange(range).format = { fill: C.navy, font: { color: C.white, bold: true, size: 18 }, verticalAlignment: "center" };
  sheet.getRange(`${startCol}${row + 1}:${endCol}${row + 1}`).merge();
  sheet.getRange(`${startCol}${row + 1}`).values = [[subtitle]];
  sheet.getRange(`${startCol}${row + 1}:${endCol}${row + 1}`).format = { fill: C.paleBlue, font: { color: C.darkGray, italic: true, size: 10 }, wrapText: true };
}
function header(range) {
  range.format = { fill: C.blue, font: { color: C.white, bold: true }, borders: { preset: "all", style: "thin", color: "#B4C6E7" }, wrapText: true, verticalAlignment: "center" };
}
function grid(range) {
  range.format.borders = { preset: "all", style: "thin", color: "#D9E2F3" };
  range.format.verticalAlignment = "center";
}

// Inputs
inputs.showGridLines = false;
title(inputs, "A1:F1", "输入与派生口径", "2023–2025 IFRS 17可比序列；蓝色为跨表公式，黑色为源数据；金额单位人民币百万元");
inputs.getRange("A4:D4").values = [["直接输入", 2023, 2024, 2025]];
header(inputs.getRange("A4:D4"));
inputs.getRange("A5:A22").values = [
  ["整体保险服务收入"], ["车险保险服务收入"], ["健康险保险服务收入"], ["意外险保险服务收入"], ["意健险合并收入（2025披露）"],
  ["保证险保险服务收入"], ["责任险保险服务收入"], ["责任险承保利润"], ["责任险COR"], [""],
  ["车险分部营业利润"], ["意健险分部营业利润"], ["其他财产险分部营业利润"], ["保证险分部营业利润"],
  ["车险分部其他收益"], ["意健险分部其他收益"], ["其他财产险分部其他收益"], ["保证险分部其他收益"],
];
for (let i = 0; i < periods.length; i++) {
  const y = periods[i];
  const col = String.fromCharCode(66 + i);
  const d = raw[y];
  inputs.getRange(`${col}5:${col}22`).values = [[d.totalRevenue], [d.autoRevenue], [d.healthRevenue], [d.accidentRevenue], [d.ahCombinedRevenue], [d.guaranteeRevenue], [d.liabilityRevenue], [d.liabilityProfit], [d.liabilityCor], [null], [d.op[0]], [d.op[1]], [d.op[2]], [d.op[3]], [d.oi[0]], [d.oi[1]], [d.oi[2]], [d.oi[3]]];
}
inputs.getRange("B5:D12").format.numberFormat = "#,##0.000";
inputs.getRange("B13:D13").format.numberFormat = "0.0%";
inputs.getRange("B15:D22").format.numberFormat = "#,##0.000";
inputs.getRange("A24:D24").values = [["派生指标", 2023, 2024, 2025]];
header(inputs.getRange("A24:D24"));
inputs.getRange("A25:A39").values = [
  ["意健险保险服务收入"], ["整体承保利润"], ["车险承保利润"], ["意健险承保利润"], ["其他财产险承保利润"], ["保证险承保利润"],
  ["其他财产险保险服务收入"], ["核心非车收入（剔除保证险）"], ["核心非车承保利润（剔除保证险）"],
  ["整体COR"], ["车险COR"], ["意健险COR"], ["其他财产险COR"], ["保证险COR"], ["核心非车COR（剔除保证险）"],
];
inputs.getRange("B25").formulas = [["=IF(B9>0,B9,B7+B8)"]];
inputs.getRange("B25:D25").fillRight();
inputs.getRange("B26").formulas = [["=SUM(B15:B18)-SUM(B19:B22)"]];
inputs.getRange("B26:D26").fillRight();
inputs.getRange("B27").formulas = [["=B15-B19"]];
inputs.getRange("B27:D27").fillRight();
inputs.getRange("B28").formulas = [["=B16-B20"]];
inputs.getRange("B28:D28").fillRight();
inputs.getRange("B29").formulas = [["=B17-B21"]];
inputs.getRange("B29:D29").fillRight();
inputs.getRange("B30").formulas = [["=B18-B22"]];
inputs.getRange("B30:D30").fillRight();
inputs.getRange("B31").formulas = [["=B5-B6-B25-B10"]];
inputs.getRange("B31:D31").fillRight();
inputs.getRange("B32").formulas = [["=B25+B31"]];
inputs.getRange("B32:D32").fillRight();
inputs.getRange("B33").formulas = [["=B28+B29"]];
inputs.getRange("B33:D33").fillRight();
for (const [row, formula] of [[34, "=1-B26/B5"], [35, "=1-B27/B6"], [36, "=1-B28/B25"], [37, "=1-B29/B31"], [38, "=1-B30/B10"], [39, "=1-B33/B32"]]) {
  inputs.getRange(`B${row}`).formulas = [[formula]];
  inputs.getRange(`B${row}:D${row}`).fillRight();
}
inputs.getRange("B25:D33").format.numberFormat = "#,##0.000";
inputs.getRange("B34:D39").format.numberFormat = "0.0000%";
inputs.getRange("B25:D39").format.font = { color: C.black };
grid(inputs.getRange("A4:D22"));
grid(inputs.getRange("A24:D39"));
inputs.freezePanes.freezeRows(4);

for (let i = 0; i < periods.length; i++) {
  const y = periods[i];
  const col = String.fromCharCode(66 + i);
  const g = groupSource[y];
  const l = legalSource[y];
  for (const row of [6,7,8,9,11,12,13]) {
    if (inputs.getRange(`${col}${row}`).values[0][0] !== null) workbook.comments.addThread({ cell: inputs.getRange(`${col}${row}`) }, `Source: ${g}`);
  }
  for (const row of [5,10,15,16,17,18,19,20,21,22]) workbook.comments.addThread({ cell: inputs.getRange(`${col}${row}`) }, `Source: ${l}`);
}

// Trend
trend.showGridLines = false;
title(trend, "A1:J1", "2023–2025分部承保趋势", "核心非车=意健险+其他财产险，剔除保证险；用于观察可持续压力，不与旧准则2022相连");
trend.getRange("A4:J4").values = [["年度", "整体COR", "车险COR", "核心非车COR", "意健险COR", "其他财产险COR", "保证险COR", "责任险COR", "核心非车收入", "核心非车利润"]];
header(trend.getRange("A4:J4"));
trend.getRange("A5:A7").values = periods.map((y) => [y]);
for (let r = 5; r <= 7; r++) {
  const inputCol = String.fromCharCode(66 + (r - 5));
  trend.getRange(`B${r}:J${r}`).formulas = [[
    `='Inputs'!${inputCol}34`, `='Inputs'!${inputCol}35`, `='Inputs'!${inputCol}39`, `='Inputs'!${inputCol}36`, `='Inputs'!${inputCol}37`, `='Inputs'!${inputCol}38`, `='Inputs'!${inputCol}13`, `='Inputs'!${inputCol}32`, `='Inputs'!${inputCol}33`,
  ]];
}
trend.getRange("B5:H7").format.numberFormat = "0.00%";
trend.getRange("I5:J7").format.numberFormat = "#,##0.0;[Red](#,##0.0);-";
trend.getRange("B5:J7").format.font = { color: C.green };
grid(trend.getRange("A4:J7"));
trend.getRange("A10:E10").values = [["年度", "整体COR", "车险COR", "核心非车COR", "其他财产险COR"]];
header(trend.getRange("A10:E10"));
for (let r = 11; r <= 13; r++) {
  const sourceRow = r - 6;
  trend.getRange(`A${r}:E${r}`).formulas = [[`=A${sourceRow}`, `=B${sourceRow}`, `=C${sourceRow}`, `=D${sourceRow}`, `=F${sourceRow}`]];
}
trend.getRange("B11:E13").format.numberFormat = "0.0%";
const trendChart = trend.charts.add("line", trend.getRange("A10:E13"));
trendChart.title = "核心非车COR在2025年升破100%";
trendChart.hasLegend = true;
trendChart.xAxis = { axisType: "textAxis" };
trendChart.yAxis = { numberFormatCode: "0.0%", min: 0.94, max: 1.03 };
trendChart.setPosition("A15", "J31");
trend.getRange("A33:J36").merge(true);
trend.getRange("A33:A36").values = [
  ["核心非车COR：2023年接近盈亏平衡，2024年改善，2025年升至100%以上。"],
  ["意健险：2025年仍盈利，但COR较2024年明显反弹。"],
  ["其他财产险：2025年从承保盈利转为承保亏损，是核心非车压力的主要来源。"],
  ["责任险为其他财产险下钻，不得与其他财产险重复加总。"],
];
trend.getRange("A33:J36").format = { fill: C.paleBlue, wrapText: true, borders: { preset: "all", style: "thin", color: "#B4C6E7" } };
trend.freezePanes.freezeRows(4);

// Bridge
bridgeSheet.showGridLines = false;
title(bridgeSheet, "A1:H1", "车险改善与非车反向压力桥接", "正数=改善整体COR；负数=抵消整体改善；责任险是其他财产险的下钻项");
bridgeSheet.getRange("A4:F4").values = [["2024→2025驱动", "起点整体影响", "终点整体影响", "改善贡献(pp)", "方向", "说明"]];
header(bridgeSheet.getRange("A4:F4"));
bridgeSheet.getRange("A5:A10").values = [["车险"], ["保证险"], ["意健险"], ["责任险"], ["其他财产险（剔除责任险）"], ["合计"]];
const profitRows = { 5: [27, 27], 6: [30, 30], 7: [28, 28], 8: [12, 12] };
for (const [rText, [startRow, endRow]] of Object.entries(profitRows)) {
  const r = Number(rText);
  bridgeSheet.getRange(`B${r}`).formulas = [[`=-'Inputs'!C${startRow}/'Inputs'!C5*100`]];
  bridgeSheet.getRange(`C${r}`).formulas = [[`=-'Inputs'!D${endRow}/'Inputs'!D5*100`]];
  bridgeSheet.getRange(`D${r}`).formulas = [[`=B${r}-C${r}`]];
}
bridgeSheet.getRange("B9").formulas = [["=-('Inputs'!C29-'Inputs'!C12)/'Inputs'!C5*100"]];
bridgeSheet.getRange("C9").formulas = [["=-('Inputs'!D29-'Inputs'!D12)/'Inputs'!D5*100"]];
bridgeSheet.getRange("D9").formulas = [["=B9-C9"]];
bridgeSheet.getRange("B10:D10").formulas = [["=SUM(B5:B9)", "=SUM(C5:C9)", "=SUM(D5:D9)"]];
bridgeSheet.getRange("E5:E10").formulas = [["=IF(D5>=0,\"改善\",\"拖累\")"], ["=IF(D6>=0,\"改善\",\"拖累\")"], ["=IF(D7>=0,\"改善\",\"拖累\")"], ["=IF(D8>=0,\"改善\",\"拖累\")"], ["=IF(D9>=0,\"改善\",\"拖累\")"], ["=IF(D10>=0,\"净改善\",\"净拖累\")"]];
bridgeSheet.getRange("F5:F10").values = [["车险COR下降"], ["保证险转为盈利"], ["利润率回落"], ["责任险亏损扩大；为其他财产险子集"], ["其他财产险剩余部分增益下降"], ["与整体COR变化勾稽"]];
bridgeSheet.getRange("B5:D10").format.numberFormat = "0.0000;[Red](0.0000);-";
bridgeSheet.getRange("B5:D10").format.font = { color: C.green };
bridgeSheet.getRange("D5:D10").conditionalFormats.add("cellIs", { operator: "lessThan", formula: 0, format: { fill: C.lightRed, font: { color: C.red, bold: true } } });
bridgeSheet.getRange("D5:D10").conditionalFormats.add("cellIs", { operator: "greaterThanOrEqual", formula: 0, format: { fill: C.lightGreen, font: { color: C.green, bold: true } } });
grid(bridgeSheet.getRange("A4:F10"));

bridgeSheet.getRange("A13:D13").values = [["桥接摘要", "结果", "单位", "公式"]];
header(bridgeSheet.getRange("A13:D13"));
bridgeSheet.getRange("A14:A19").values = [["整体COR实际改善"], ["车险+保证险毛改善"], ["核心非车反向压力"], ["核心非车抵消毛改善比例"], ["核心非车COR变化"], ["核心非车承保利润变动"]];
bridgeSheet.getRange("B14").formulas = [["=('Inputs'!C34-'Inputs'!D34)*100"]];
bridgeSheet.getRange("B15").formulas = [["=D5+D6"]];
bridgeSheet.getRange("B16").formulas = [["=D7+D8+D9"]];
bridgeSheet.getRange("B17").formulas = [["=-B16/B15"]];
bridgeSheet.getRange("B18").formulas = [["=('Inputs'!D39-'Inputs'!C39)*100"]];
bridgeSheet.getRange("B19").formulas = [["='Inputs'!D33-'Inputs'!C33"]];
bridgeSheet.getRange("C14:C19").values = [["pp"], ["pp"], ["pp"], ["%"], ["pp"], ["百万元"]];
bridgeSheet.getRange("D14:D19").values = [["2024整体COR−2025整体COR"], ["车险贡献+保证险贡献"], ["意健险+责任险+其他财产险剩余"], ["−核心非车压力/毛改善"], ["2025核心非车COR−2024核心非车COR"], ["2025核心非车利润−2024核心非车利润"]];
bridgeSheet.getRange("B14:B16").format.numberFormat = "0.0000;[Red](0.0000);-";
bridgeSheet.getRange("B17").format.numberFormat = "0.0%";
bridgeSheet.getRange("B18").format.numberFormat = "0.0000";
bridgeSheet.getRange("B19").format.numberFormat = "#,##0.0;[Red](#,##0.0);-";
bridgeSheet.getRange("B14:B19").format.font = { color: C.green, bold: true };
grid(bridgeSheet.getRange("A13:D19"));

bridgeSheet.getRange("A22:F22").values = [["2023→2025驱动", "2023整体影响", "2025整体影响", "改善贡献(pp)", "方向", "说明"]];
header(bridgeSheet.getRange("A22:F22"));
bridgeSheet.getRange("A23:A28").values = [["车险"], ["保证险"], ["意健险"], ["责任险"], ["其他财产险（剔除责任险）"], ["合计"]];
for (const [rText, row] of Object.entries({ 23: 27, 24: 30, 25: 28, 26: 12 })) {
  const r = Number(rText);
  bridgeSheet.getRange(`B${r}`).formulas = [[`=-'Inputs'!B${row}/'Inputs'!B5*100`]];
  bridgeSheet.getRange(`C${r}`).formulas = [[`=-'Inputs'!D${row}/'Inputs'!D5*100`]];
  bridgeSheet.getRange(`D${r}`).formulas = [[`=B${r}-C${r}`]];
}
bridgeSheet.getRange("B27").formulas = [["=-('Inputs'!B29-'Inputs'!B12)/'Inputs'!B5*100"]];
bridgeSheet.getRange("C27").formulas = [["=-('Inputs'!D29-'Inputs'!D12)/'Inputs'!D5*100"]];
bridgeSheet.getRange("D27").formulas = [["=B27-C27"]];
bridgeSheet.getRange("B28:D28").formulas = [["=SUM(B23:B27)", "=SUM(C23:C27)", "=SUM(D23:D27)"]];
bridgeSheet.getRange("E23:E28").formulas = [["=IF(D23>=0,\"改善\",\"拖累\")"], ["=IF(D24>=0,\"改善\",\"拖累\")"], ["=IF(D25>=0,\"改善\",\"拖累\")"], ["=IF(D26>=0,\"改善\",\"拖累\")"], ["=IF(D27>=0,\"改善\",\"拖累\")"], ["=IF(D28>=0,\"净改善\",\"净拖累\")"]];
bridgeSheet.getRange("F23:F28").values = [["车险改善"], ["保证险为主要累计改善来源"], ["较2023略改善"], ["2025仍维持高亏损"], ["累计压力集中于责任险以外剩余部分"], ["与整体COR变化勾稽"]];
bridgeSheet.getRange("B23:D28").format.numberFormat = "0.0000;[Red](0.0000);-";
bridgeSheet.getRange("B23:D28").format.font = { color: C.green };
grid(bridgeSheet.getRange("A22:F28"));

bridgeSheet.getRange("H4:I4").values = [["驱动", "改善贡献(pp)"]];
header(bridgeSheet.getRange("H4:I4"));
for (let r = 5; r <= 10; r++) bridgeSheet.getRange(`H${r}:I${r}`).formulas = [[`=A${r}`, `=D${r}`]];
bridgeSheet.getRange("I5:I10").format.numberFormat = "0.00";
const bridgeChart = bridgeSheet.charts.add("bar", bridgeSheet.getRange("H4:I10"));
bridgeChart.title = "2024→2025整体COR改善桥接（百分点）";
bridgeChart.hasLegend = false;
bridgeChart.xAxis = { axisType: "textAxis" };
bridgeChart.yAxis = { numberFormatCode: "0.00" };
bridgeChart.setPosition("H12", "N29");
bridgeSheet.freezePanes.freezeRows(4);

// Summary
summary.showGridLines = false;
title(summary, "A1:H1", "阶段3-4｜非车反向压力", "结论口径：2023–2025 IFRS 17可比；2024→2025桥接为当前经营反转重点");
summary.getRange("A4:H4").values = [["指标", "结果", "单位", "期间", "判断", "经营含义", "状态", "来源"]];
header(summary.getRange("A4:H4"));
summary.getRange("A5:A11").values = [["整体COR改善"], ["车险+保证险毛改善"], ["核心非车反向压力"], ["核心非车抵消比例"], ["核心非车COR恶化"], ["核心非车利润变动"], ["责任险占其他财产险拖累"]];
summary.getRange("B5").formulas = [["='Bridge'!B14"]];
summary.getRange("B6").formulas = [["='Bridge'!B15"]];
summary.getRange("B7").formulas = [["=-'Bridge'!B16"]];
summary.getRange("B8").formulas = [["='Bridge'!B17"]];
summary.getRange("B9").formulas = [["='Bridge'!B18"]];
summary.getRange("B10").formulas = [["='Bridge'!B19"]];
summary.getRange("B11").formulas = [["='Bridge'!D8/('Bridge'!D8+'Bridge'!D9)"]];
summary.getRange("C5:C11").values = [["pp"], ["pp"], ["pp"], ["%"], ["pp"], ["百万元"], ["%"]];
summary.getRange("D5:D11").values = [["2024→2025"], ["2024→2025"], ["2024→2025"], ["2024→2025"], ["2024→2025"], ["2024→2025"], ["2024→2025"]];
summary.getRange("E5:E11").values = [["整体仍改善"], ["改善来源集中"], ["明显抵消"], ["约三分之一"], ["升破100%"], ["由盈转亏"], ["主要明细压力"]];
summary.getRange("F5:F11").values = [["净改善小于车险+保证险毛改善"], ["不能把全部改善归因于普遍能力"], ["核心非车是反向项"], ["改善持续性受非车约束"], ["承保结果由正转负"], ["需优先分解量价与赔付"], ["责任险需单独治理"]];
summary.getRange("G5:G11").values = [["已勾稽"], ["已勾稽"], ["已勾稽"], ["推算"], ["推算"], ["推算"], ["推算"]];
summary.getRange("H5:H11").values = [["S24B/S25B"], ["S24B/S25B"], ["S24A/S25A/S24B/S25B"], ["同左"], ["同左"], ["同左"], ["S24A/S25A/S24B/S25B"]];
summary.getRange("B5:B7").format.numberFormat = "0.0000";
summary.getRange("B8").format.numberFormat = "0.0%";
summary.getRange("B9").format.numberFormat = "0.0000";
summary.getRange("B10").format.numberFormat = "#,##0.0;[Red](#,##0.0);-";
summary.getRange("B11").format.numberFormat = "0.0%";
summary.getRange("B5:B11").format.font = { color: C.green, bold: true };
grid(summary.getRange("A4:H11"));
summary.getRange("A14:H14").merge();
summary.getRange("A14").values = [["核心判断"]];
header(summary.getRange("A14:H14"));
summary.getRange("A15:H19").merge(true);
summary.getRange("A15:A19").values = [
  ["1. 2024→2025，车险与保证险合计带来约2.22pp毛改善，但核心非车抵消约0.72pp，最终整体只改善约1.50pp。"],
  ["2. 核心非车COR从约98.44%升至100.82%，承保利润由约15.11亿元转为约8.74亿元亏损。"],
  ["3. 其他财产险反向贡献约0.44pp，其中责任险约占66%；意健险另造成约0.28pp反向压力。"],
  ["4. 责任险保险服务收入基本持平，但亏损由6.44亿元扩大至16.42亿元，问题更接近单位经济性恶化，而非单纯规模增长。"],
  ["5. 2025核心非车COR也高于2023年近盈亏平衡水平，不能只解释为2024高基数回归。"],
];
summary.getRange("A15:H19").format = { fill: C.paleBlue, wrapText: true, borders: { preset: "all", style: "thin", color: "#B4C6E7" } };
summary.getRange("A22:H22").merge();
summary.getRange("A22").values = [["下一步内部诊断动作（不含效果假设）"]];
header(summary.getRange("A22:H22"));
summary.getRange("A23:H26").merge(true);
summary.getRange("A23:A26").values = [
  ["责任险：按产品/地区/渠道/保单年度拆出频次、案均赔款、准备金发展与续保提价，优先检查亏损扩大来源。"],
  ["意健险：核对2025收入扩张是否集中于高赔付渠道或产品，并区分赔付率反弹与费用投放。"],
  ["其他财产险：责任险以外部分仍减少整体增益，需建立企业财产、货运、农险等分险种利润桥接。"],
  ["整体监控：同时呈现车险毛改善、保证险一次性/存量改善和核心非车压力，避免只看整体COR得出普遍改善结论。"],
];
summary.getRange("A23:H26").format = { fill: C.yellow, wrapText: true, borders: { preset: "all", style: "thin", color: "#C9B458" } };
summary.freezePanes.freezeRows(4);

// Checks
checks.showGridLines = false;
title(checks, "A1:G1", "模型检查", "PASS只表示公式、勾稽、来源口径与单位通过，不表示因果识别完成");
checks.getRange("A4:G4").values = [["检查项", "实际值", "期望值", "差异", "容差", "状态", "说明"]];
header(checks.getRange("A4:G4"));
checks.getRange("A5:A12").values = [["2023分部利润勾稽"], ["2024分部利润勾稽"], ["2025分部利润勾稽"], ["2023收入勾稽"], ["2024收入勾稽"], ["2025收入勾稽"], ["2024→2025桥接勾稽"], ["2023→2025桥接勾稽"]];
for (let i = 0; i < 3; i++) {
  const col = String.fromCharCode(66 + i);
  checks.getRange(`B${5 + i}`).formulas = [[`='Inputs'!${col}26`]];
  checks.getRange(`C${5 + i}`).formulas = [[`=SUM('Inputs'!${col}27:${col}30)`]];
  checks.getRange(`B${8 + i}`).formulas = [[`='Inputs'!${col}5`]];
  checks.getRange(`C${8 + i}`).formulas = [[`='Inputs'!${col}6+'Inputs'!${col}25+'Inputs'!${col}31+'Inputs'!${col}10`]];
}
checks.getRange("B11").formulas = [["='Bridge'!D10"]];
checks.getRange("C11").formulas = [["=('Inputs'!C34-'Inputs'!D34)*100"]];
checks.getRange("B12").formulas = [["='Bridge'!D28"]];
checks.getRange("C12").formulas = [["=('Inputs'!B34-'Inputs'!D34)*100"]];
checks.getRange("D5").formulas = [["=ABS(B5-C5)"]];
checks.getRange("D5:D12").fillDown();
checks.getRange("E5:E12").values = [[0.000001], [0.000001], [0.000001], [0.001], [0.001], [0.001], [0.000001], [0.000001]];
checks.getRange("F5").formulas = [["=IF(D5<=E5,\"PASS\",\"FAIL\")"]];
checks.getRange("F5:F12").fillDown();
checks.getRange("G5:G12").values = [["营业利润−其他收益"], ["营业利润−其他收益"], ["营业利润−其他收益"], ["四分部收入合计"], ["四分部收入合计"], ["四分部收入合计"], ["五项贡献等于整体变化"], ["五项贡献等于整体变化"]];
checks.getRange("B5:E12").format.numberFormat = "0.000000";
checks.getRange("F5:F12").conditionalFormats.add("containsText", { text: "PASS", format: { fill: C.lightGreen, font: { color: C.green, bold: true } } });
checks.getRange("F5:F12").conditionalFormats.add("containsText", { text: "FAIL", format: { fill: C.lightRed, font: { color: C.red, bold: true } } });
grid(checks.getRange("A4:G12"));
checks.getRange("A15:B15").values = [["整体状态", null]];
header(checks.getRange("A15:B15"));
checks.getRange("B15").formulas = [["=IF(COUNTIF(F5:F12,\"FAIL\")=0,\"PASS\",\"FAIL\")"]];
checks.getRange("B15").format = { fill: C.lightGreen, font: { color: C.green, bold: true, size: 14 } };
checks.freezePanes.freezeRows(4);

// Sources
sources.showGridLines = false;
title(sources, "A1:H1", "来源索引", "直接输入来自中国平安年报及平安产险年度信息披露报告；旧准则原报2022未接入");
sources.getRange("A4:H4").values = [["来源ID", "文件", "PDF页码", "报告页码", "期间", "用途", "本地路径", "备注"]];
header(sources.getRange("A4:H4"));
sources.getRange("A5:H11").values = [
  ["S23A", "中国平安_年报_2023.pdf", "29", "25", "2023", "险种收入、利润、COR", `${sourceRoot}中国平安_年报_2023.pdf`, "按险种经营业绩"],
  ["S24A", "中国平安_年报_2024.pdf", "45", "41", "2024", "险种收入、利润、COR", `${sourceRoot}中国平安_年报_2024.pdf`, "按险种经营业绩"],
  ["S25A", "中国平安_年报_2025.pdf", "56", "52", "2025", "险种收入、利润、COR及公式", `${sourceRoot}中国平安_年报_2025.pdf`, "按险种经营业绩"],
  ["S23B", "平安产险_年度信息披露报告_2023.pdf", "118", "—", "2023", "四分部收入与营业利润", `${sourceRoot}平安产险_年度信息披露报告_2023.pdf`, "分部报告"],
  ["S24B", "平安产险_年度信息披露报告_2025.pdf", "119", "—", "2024比较数", "四分部收入与营业利润", `${sourceRoot}平安产险_年度信息披露报告_2025.pdf`, "分部报告"],
  ["S25B", "平安产险_年度信息披露报告_2025.pdf", "117", "—", "2025", "四分部收入与营业利润", `${sourceRoot}平安产险_年度信息披露报告_2025.pdf`, "分部报告"],
  ["M1", "阶段3-2_保证保险贡献.csv", "—", "—", "2023–2025", "精确分部底数复用", "01-数据/阶段3-2_保证保险贡献.csv", "阶段3-2已完成勾稽"],
];
grid(sources.getRange("A4:H11"));
sources.freezePanes.freezeRows(4);

// Column widths and row heights
for (const [sheet, widths] of [
  [summary, [["A:A", 31], ["B:B", 16], ["C:C", 11], ["D:D", 15], ["E:E", 18], ["F:F", 38], ["G:G", 14], ["H:H", 24]]],
  [inputs, [["A:A", 38], ["B:D", 18], ["E:F", 4]]],
  [trend, [["A:A", 12], ["B:H", 17], ["I:J", 20]]],
  [bridgeSheet, [["A:A", 34], ["B:D", 18], ["E:E", 14], ["F:F", 38], ["G:G", 3], ["H:I", 20]]],
  [checks, [["A:A", 30], ["B:E", 17], ["F:F", 12], ["G:G", 34]]],
  [sources, [["A:A", 12], ["B:B", 34], ["C:D", 13], ["E:E", 14], ["F:F", 34], ["G:G", 74], ["H:H", 22]]],
]) {
  for (const [r, w] of widths) sheet.getRange(r).format.columnWidth = w;
  sheet.getUsedRange().format.autofitRows();
}
summary.getRange("A15:H19").format.rowHeight = 34;
summary.getRange("A23:H26").format.rowHeight = 34;
trend.getRange("A33:J36").format.rowHeight = 30;

// Compact verification before export
for (const [sheetName, range] of [["Summary", "A1:H26"], ["Inputs", "A1:F39"], ["Trend", "A1:J36"], ["Bridge", "A1:N29"], ["Checks", "A1:G15"], ["Sources", "A1:H11"]]) {
  const region = await workbook.inspect({ kind: "region", sheetId: sheetName, range, maxChars: 5000, tableMaxRows: 40, tableMaxCols: 14 });
  console.log(`REGION_${sheetName}`, region.ndjson.slice(0, 4500));
  const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, `preview_${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const errors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" });
console.log("FORMULA_ERRORS", errors.ndjson);
const trace = workbook.trace("Summary!B7");
console.log("TRACE_SUMMARY_B7", JSON.stringify(trace).slice(0, 3000));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(xlsxPath);

// CSV
const rows = [["record_type", "period", "scope", "metric", "value", "unit", "status", "formula", "input_sources", "note"]];
for (const y of periods) {
  const d = raw[y];
  const c = calc[y];
  for (const [scope, metric, value, unit, src] of [
    ["整体", "保险服务收入", d.totalRevenue, "人民币百万元", legalSource[y]],
    ["车险", "保险服务收入", d.autoRevenue, "人民币百万元", groupSource[y]],
    ["保证险", "保险服务收入", d.guaranteeRevenue, "人民币百万元", legalSource[y]],
    ["责任险", "保险服务收入", d.liabilityRevenue, "人民币百万元", groupSource[y]],
    ["责任险", "承保利润", d.liabilityProfit, "人民币百万元", groupSource[y]],
    ["责任险", "综合成本率", d.liabilityCor * 100, "%", groupSource[y]],
  ]) rows.push(["input", y, scope, metric, value, unit, "直接披露", "直接读取", src, `直接披露；来源：${src}`]);
  for (const [scope, metric, value, unit, formula] of [
    ["整体", "承保利润", c.totalProfit, "人民币百万元", "四分部营业利润合计−四分部其他收益合计"],
    ["整体", "综合成本率", c.overallCor * 100, "%", "(1−整体承保利润/整体保险服务收入)×100"],
    ["车险", "承保利润", c.autoProfit, "人民币百万元", "车险分部营业利润−车险其他收益"],
    ["车险", "综合成本率", c.autoCor * 100, "%", "(1−车险承保利润/车险保险服务收入)×100"],
    ["意健险", "保险服务收入", c.ahRevenue, "人民币百万元", y === 2025 ? "直接合并披露" : "健康险收入+意外险收入"],
    ["意健险", "承保利润", c.ahProfit, "人民币百万元", "意健险分部营业利润−其他收益"],
    ["意健险", "综合成本率", c.ahCor * 100, "%", "(1−意健险承保利润/意健险保险服务收入)×100"],
    ["其他财产险", "保险服务收入", c.otherPcRevenue, "人民币百万元", "整体收入−车险−意健险−保证险"],
    ["其他财产险", "承保利润", c.otherPcProfit, "人民币百万元", "其他财产险分部营业利润−其他收益"],
    ["其他财产险", "综合成本率", c.otherPcCor * 100, "%", "(1−其他财产险承保利润/其他财产险收入)×100"],
    ["核心非车_剔除保证险", "保险服务收入", c.coreNonautoRevenue, "人民币百万元", "意健险收入+其他财产险收入"],
    ["核心非车_剔除保证险", "承保利润", c.coreNonautoProfit, "人民币百万元", "意健险利润+其他财产险利润"],
    ["核心非车_剔除保证险", "综合成本率", c.coreNonautoCor * 100, "%", "(1−核心非车利润/核心非车收入)×100"],
  ]) {
    const src = `${groupSource[y]}；${legalSource[y]}；${source.corDef}`;
    rows.push(["derived", y, scope, metric, value, unit, "推算", formula, src, tag(`${fmt(value, 6)}${unit}`, formula, src)]);
  }
}

for (const [period, b] of [["2024→2025", b2425], ["2023→2025", b2325]]) {
  const [s, e] = period.split("→").map(Number);
  const src = `${groupSource[s]}；${groupSource[e]}；${legalSource[s]}；${legalSource[e]}`;
  for (const [scope, value, formula] of [
    ["车险", b.auto, "起点车险整体影响−终点车险整体影响"],
    ["保证险", b.guarantee, "起点保证险整体影响−终点保证险整体影响"],
    ["意健险", b.ah, "起点意健险整体影响−终点意健险整体影响"],
    ["责任险", b.liability, "起点责任险整体影响−终点责任险整体影响"],
    ["其他财产险_剔除责任险", b.residual, "起点剩余其他财产险整体影响−终点整体影响"],
    ["整体", b.total, "五项贡献合计"],
  ]) rows.push(["bridge", period, scope, "整体COR改善贡献_正值改善负值拖累", value, "个百分点", "推算", formula, src, tag(`${fmt(value, 6)}个百分点`, formula, src)]);
}
await fs.writeFile(csvPath, rows.map((r) => r.map(esc).join(",")).join("\n") + "\n", "utf8");

// Markdown artifacts
const reportSource2425 = `${source.group2024}；${source.group2025}；${source.legal2024}；${source.legal2025}`;
const reportSource2325 = `${source.group2023}；${source.group2025}；${source.legal2023}；${source.legal2025}`;
const dataMd = `# 阶段3-4｜非车反向压力数据说明

## 口径

- 可比期间为2023–2025 IFRS 17序列；旧准则原报2022不接入。
- 核心非车=意健险+其他财产险，剔除保证险；责任险属于其他财产险，只作下钻，不重复加总。
- 本块没有新增主观参数。承保利润=分部营业利润−其他收益；COR=(1−承保利润/保险服务收入)×100%。

## 年度趋势

${periods.map((y) => `- ${y}：${tag(`核心非车COR ${pct(calc[y].coreNonautoCor,4)}`, `(1−核心非车利润${fmt(calc[y].coreNonautoProfit,6)}/核心非车收入${fmt(calc[y].coreNonautoRevenue,6)})×100`, `${groupSource[y]}；${legalSource[y]}；${source.corDef}`)}；${tag(`核心非车承保利润${fmt(calc[y].coreNonautoProfit,6)}人民币百万元`, `意健险利润${fmt(calc[y].ahProfit,6)}+其他财产险利润${fmt(calc[y].otherPcProfit,6)}`, legalSource[y])}`).join("\n")}

## 2024→2025桥接

| 驱动 | 对整体COR改善的贡献 |
|---|---:|
| 车险 | ${tag(`${fmt(b2425.auto,4)}个百分点`, "起点车险整体影响−终点车险整体影响", reportSource2425)} |
| 保证险 | ${tag(`${fmt(b2425.guarantee,4)}个百分点`, "起点保证险整体影响−终点保证险整体影响", reportSource2425)} |
| 意健险 | ${tag(`${fmt(b2425.ah,4)}个百分点`, "起点意健险整体影响−终点意健险整体影响", reportSource2425)} |
| 责任险 | ${tag(`${fmt(b2425.liability,4)}个百分点`, "起点责任险整体影响−终点责任险整体影响", reportSource2425)} |
| 其他财产险（剔除责任险） | ${tag(`${fmt(b2425.residual,4)}个百分点`, "起点剩余其他财产险整体影响−终点整体影响", reportSource2425)} |
| 合计 | ${tag(`${fmt(b2425.total,4)}个百分点`, "五项贡献合计", reportSource2425)} |

## 限制

1. 责任险下钻使用集团年报百万元整数，与年度信息披露报告精确分部底数存在四舍五入差异。
2. 公开数据没有责任险的频次、案均赔款、费用率和准备金发展分拆，本块只能定位压力，不能精确解释成因。
3. 其他财产险剩余项仍包含多个险种，需内部管理数据进一步拆解。
`;
await fs.writeFile(dataMdPath, dataMd, "utf8");

const reportMd = `# 阶段3-4｜非车反向压力：抵消了约三分之一的车险与保证险毛改善

## 结论先行

2024→2025，车险与保证险合计提供【推算：${fmt(gross2425,4)}个百分点｜方法：车险贡献${fmt(b2425.auto,4)}+保证险贡献${fmt(b2425.guarantee,4)}｜输入来源：${reportSource2425}】的整体COR毛改善；核心非车产生【推算：${fmt(-b2425.coreNonauto,4)}个百分点反向压力｜方法：−(意健险贡献${fmt(b2425.ah,4)}+责任险贡献${fmt(b2425.liability,4)}+其他财产险剩余贡献${fmt(b2425.residual,4)})｜输入来源：${reportSource2425}】，抵消比例为【推算：${(offset2425*100).toFixed(1)}%｜方法：核心非车反向压力${fmt(-b2425.coreNonauto,4)}/毛改善${fmt(gross2425,4)}｜输入来源：${reportSource2425}】。因此整体COR最终只改善【推算：${fmt(b2425.total,4)}个百分点｜方法：车险+保证险+意健险+责任险+其他财产险剩余｜输入来源：${reportSource2425}】。

这意味着本轮最新改善不是“各业务线普遍变好”：车险与保证险把整体往下拉，核心非车则把整体往上推。

## 核心非车已由盈利转为亏损

核心非车COR由【推算：${pct(calc[2024].coreNonautoCor,4)}｜方法：(1−利润${fmt(calc[2024].coreNonautoProfit,6)}/收入${fmt(calc[2024].coreNonautoRevenue,6)})×100｜输入来源：${source.group2024}；${source.legal2024}；${source.corDef}】升至【推算：${pct(calc[2025].coreNonautoCor,4)}｜方法：(1−利润${fmt(calc[2025].coreNonautoProfit,6)}/收入${fmt(calc[2025].coreNonautoRevenue,6)})×100｜输入来源：${source.group2025}；${source.legal2025}；${source.corDef}】，恶化【推算：${fmt((calc[2025].coreNonautoCor-calc[2024].coreNonautoCor)*100,4)}个百分点｜方法：2025核心非车COR−2024核心非车COR｜输入来源：${reportSource2425}】。

承保利润由【推算：${fmt(calc[2024].coreNonautoProfit,3)}人民币百万元｜方法：意健险利润+其他财产险利润｜输入来源：${source.legal2024}】变为【推算：${fmt(calc[2025].coreNonautoProfit,3)}人民币百万元｜方法：意健险利润+其他财产险利润｜输入来源：${source.legal2025}】，变动【推算：${fmt(coreProfitSwing2425,3)}人民币百万元｜方法：2025核心非车利润−2024核心非车利润｜输入来源：${source.legal2024}；${source.legal2025}】。

## 压力来自哪里

1. **其他财产险是主要反向项。** 对整体改善的贡献为【推算：${fmt(b2425.otherPc,4)}个百分点｜方法：责任险贡献${fmt(b2425.liability,4)}+其他财产险剩余贡献${fmt(b2425.residual,4)}｜输入来源：${reportSource2425}】。其中责任险贡献为【推算：${fmt(b2425.liability,4)}个百分点｜方法：2024责任险整体影响−2025责任险整体影响｜输入来源：${source.group2024}；${source.group2025}】，约占其他财产险反向压力的【推算：${(liabilityShareOtherPc*100).toFixed(1)}%｜方法：责任险反向贡献${fmt(b2425.liability,4)}/其他财产险反向贡献${fmt(b2425.otherPc,4)}｜输入来源：${reportSource2425}】。
2. **责任险单位经济性恶化。** 责任险收入由23,978增至24,052百万元，承保亏损由644扩大至1,642百万元，COR由102.7%升至106.8%。来源：${source.group2024}；${source.group2025}。收入基本持平而亏损扩大，不能用规模增长单独解释。
3. **意健险盈利缓冲明显收窄。** 贡献为【推算：${fmt(b2425.ah,4)}个百分点｜方法：2024意健险整体影响−2025意健险整体影响｜输入来源：${reportSource2425}】；其COR由【推算：${pct(calc[2024].ahCor,4)}｜方法：(1−利润/收入)×100｜输入来源：${source.group2024}；${source.legal2024}】升至【推算：${pct(calc[2025].ahCor,4)}｜方法：(1−利润/收入)×100｜输入来源：${source.group2025}；${source.legal2025}】。

## 放回2023→2025完整周期

从2023到2025，整体COR改善【推算：${fmt(b2325.total,4)}个百分点｜方法：五项贡献合计｜输入来源：${reportSource2325}】。车险贡献【推算：${fmt(b2325.auto,4)}个百分点｜方法：起终点车险整体影响差｜输入来源：${reportSource2325}】，保证险贡献【推算：${fmt(b2325.guarantee,4)}个百分点｜方法：起终点保证险整体影响差｜输入来源：${reportSource2325}】，核心非车净贡献为【推算：${fmt(b2325.coreNonauto,4)}个百分点｜方法：意健险+责任险+其他财产险剩余｜输入来源：${reportSource2325}】。因此完整周期同样不支持“非车普遍改善”的判断。

## 内部经营动作

- 责任险：按产品、地区、渠道和保单年度拆分频次、案均赔款、准备金发展与续保提价，先解释亏损扩大来源。
- 意健险：检查2025收入扩张是否集中于高赔付渠道或产品，区分赔付率反弹与费用投放。
- 其他财产险：责任险以外的剩余部分也减少整体增益，应补企业财产、货运、农险等分险种利润桥接。
- 整体看板：同时呈现车险毛改善、保证险贡献和核心非车压力，避免只看整体COR形成普遍改善错觉。

## 限制

本块未新增主观参数。责任险明细为百万元整数披露；公开数据没有频次、案均赔款、费用率和准备金发展分拆，因此目前能定位压力，不能精确识别因果。
`;
await fs.writeFile(reportMdPath, reportMd, "utf8");

console.log(JSON.stringify({ xlsxPath, csvPath, dataMdPath, reportMdPath, b2425, b2325, offset2425, liabilityShareOtherPc }, null, 2));
