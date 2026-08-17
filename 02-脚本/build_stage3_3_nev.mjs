import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs/stage3_3_nev");
await fs.mkdir(outputDir, { recursive: true });

const xlsxPath = path.join(outputDir, "阶段3-3_新能源敏感性.xlsx");
const csvPath = path.join(outputDir, "阶段3-3_新能源敏感性.csv");
const dataMdPath = path.join(outputDir, "阶段3-3_新能源敏感性.md");
const reportMdPath = path.join(outputDir, "阶段3-3_新能源敏感性报告.md");

const values = {
  nevPremium2025: 52480,
  autoPremium2025: 230362,
  nevGrowth2025: 0.39,
  autoPremium2024: 223301,
  carCor2024: 0.981,
  carCor2025: 0.958,
  xMin: 0,
  xMax: 5.44,
  standardShareStep: 0.01,
};

const calc = {
  nevPremium2024: values.nevPremium2025 / (1 + values.nevGrowth2025),
};
calc.nevShare2024 = calc.nevPremium2024 / values.autoPremium2024;
calc.nevShare2025 = values.nevPremium2025 / values.autoPremium2025;
calc.shareChange = calc.nevShare2025 - calc.nevShare2024;
calc.exactGapCeiling = ((1 - values.carCor2025) / (1 - calc.nevShare2025)) * 100;
calc.maxDragPer1pp = values.standardShareStep * values.xMax;
calc.maxActualMixDrag = calc.shareChange * values.xMax;
calc.observedCorImprovement = (values.carCor2024 - values.carCor2025) * 100;
calc.underlyingImprovementAtMax = calc.observedCorImprovement + calc.maxActualMixDrag;
calc.offsetRatio = calc.maxActualMixDrag / calc.observedCorImprovement;

const fmt = (n, d = 4) => Number(n).toFixed(d);
const pct = (n, d = 2) => `${(n * 100).toFixed(d)}%`;
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

const sourceS1 = "中国平安_年报_2025.pdf，PDF第54页（报告印刷页码50），车险经营数据";
const sourceS2 = "中国平安_年报_2025.pdf，PDF第58页（报告印刷页码54），原保险保费按险种";
const sourceS3 = "中国平安_年报_2024.pdf，PDF第44–45页（报告印刷页码40–41），车险经营数据";
const sourceRoot = new URL("../00-原始材料/", import.meta.url).pathname;

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const assumptions = workbook.worksheets.add("Assumptions");
const sensitivity = workbook.worksheets.add("Sensitivity");
const checks = workbook.worksheets.add("Checks");
const sources = workbook.worksheets.add("Sources");
workbook.comments.setSelf({ displayName: "User" });

const C = {
  navy: "#17365D",
  blue: "#1F4E78",
  lightBlue: "#D9EAF7",
  paleBlue: "#EAF3F8",
  green: "#008000",
  lightGreen: "#E2F0D9",
  red: "#C00000",
  lightRed: "#FCE4D6",
  yellow: "#FFF2CC",
  gray: "#F2F2F2",
  darkGray: "#666666",
  white: "#FFFFFF",
  black: "#000000",
};

function styleTitle(sheet, range, title, subtitle) {
  sheet.getRange(range).merge();
  const topLeft = range.split(":")[0];
  sheet.getRange(topLeft).values = [[title]];
  sheet.getRange(range).format = {
    fill: C.navy,
    font: { color: C.white, bold: true, size: 18 },
    verticalAlignment: "center",
  };
  const row = Number(topLeft.match(/\d+/)[0]) + 1;
  const startCol = topLeft.match(/[A-Z]+/)[0];
  const endCol = range.split(":")[1].match(/[A-Z]+/)[0];
  sheet.getRange(`${startCol}${row}:${endCol}${row}`).merge();
  sheet.getRange(`${startCol}${row}`).values = [[subtitle]];
  sheet.getRange(`${startCol}${row}:${endCol}${row}`).format = {
    fill: C.paleBlue,
    font: { color: C.darkGray, italic: true, size: 10 },
    wrapText: true,
  };
  sheet.getRange(range).format.rowHeight = 30;
}

function styleHeader(range) {
  range.format = {
    fill: C.blue,
    font: { color: C.white, bold: true },
    borders: { preset: "all", style: "thin", color: "#B4C6E7" },
    verticalAlignment: "center",
    wrapText: true,
  };
}

function styleGrid(range) {
  range.format.borders = { preset: "all", style: "thin", color: "#D9E2F3" };
  range.format.verticalAlignment = "center";
}

// Summary
summary.showGridLines = false;
styleTitle(summary, "A1:H1", "阶段3-3｜新能源车结构性成本敏感性", "口径：保费占比代理承保占比；x=新能源车COR−燃油车COR；用户已确认 x=0–5.44个百分点");
summary.getRange("A4:H4").values = [["指标", "结果", "单位", "公式/口径", "状态", "结论", "风险提示", "来源"]];
styleHeader(summary.getRange("A4:H4"));
summary.getRange("A5:A10").values = [["2025新能源车险保费占比"], ["2024新能源车险保费占比（重构）"], ["2024→2025占比提升"], ["每+1pct占比的COR拖累"], ["实际占比变化对应累计拖累"], ["扣除结构拖累后的底层改善"]];
summary.getRange("B5").formulas = [["='Assumptions'!B21"]];
summary.getRange("B6").formulas = [["='Assumptions'!B20"]];
summary.getRange("B7").formulas = [["='Assumptions'!B22"]];
summary.getRange("B8").formulas = [["='Assumptions'!B24"]];
summary.getRange("B9").formulas = [["='Assumptions'!B25"]];
summary.getRange("B10").formulas = [["='Assumptions'!B27"]];
summary.getRange("C5:C10").values = [["%"], ["%"], ["pct"], ["pp"], ["pp"], ["pp"]];
summary.getRange("D5:D10").values = [["新能源保费/车险保费"], ["2025新能源保费/(1+39%)/2024车险保费"], ["2025占比−2024占比"], ["1%×x上限"], ["占比提升×x上限"], ["已报告改善+结构拖累"]];
summary.getRange("E5:E10").values = [["披露+推算"], ["推算"], ["推算"], ["用户确认情景"], ["敏感性结果"], ["敏感性结果"]];
summary.getRange("F5:F10").values = [["新能源占比已超过两成"], ["同比口径反推"], ["两年提升约5.87pct"], ["区间为0–0.0544pp"], ["区间为0–约0.3195pp"], ["区间为2.30–约2.62pp"]];
summary.getRange("G5:G10").values = [["保费占比并非车辆数占比"], ["重构值受同比四舍五入影响"], ["结构变化非因果识别"], ["5.44是两类COR差距，不是整体拖累"], ["未控制定价、出险率与车型变化"], ["用于桥接解释，不替代精算拆分"]];
summary.getRange("H5:H10").values = [["S1/S2"], ["S1/S2"], ["S1/S2"], ["A1"], ["S1/S2/A1"], ["S1/S2/S3/A1"]];
summary.getRange("B5:B7").format.numberFormat = "0.00%";
summary.getRange("B8:B10").format.numberFormat = "0.0000";
summary.getRange("B5:B10").format.font = { color: C.green, bold: true };
styleGrid(summary.getRange("A4:H10"));
summary.getRange("A12:H12").merge();
summary.getRange("A12").values = [["核心判断"]];
styleHeader(summary.getRange("A12:H12"));
summary.getRange("A13:H16").merge(true);
summary.getRange("A13:A16").values = [
  ["1. x=5.44pp 时，占比每提高1pct，整体车险COR提高0.0544pp；这是乘法关系：1%×5.44pp。"],
  ["2. 2024→2025新能源保费占比提高约5.87pct，累计结构拖累为0–约0.3195pp。"],
  ["3. 同期车险COR实际改善2.30pp，说明其他因素带来的底层改善约2.30–2.62pp，新能源结构只是抵消其中一部分。"],
  ["4. 5.44pp是由‘新能源业务承保盈利’+保费权重近似得到的条件上限，并非公司披露或实测的新能源/燃油车COR差。"],
];
summary.getRange("A13:H16").format = { fill: C.paleBlue, wrapText: true, borders: { preset: "all", style: "thin", color: "#B4C6E7" } };
summary.getRange("A18:H18").merge();
summary.getRange("A18").values = [["情景假设确认状态"]];
styleHeader(summary.getRange("A18:H18"));
summary.getRange("A19:H20").merge(true);
summary.getRange("A19:A20").values = [
  ["【假设：新能源车COR−燃油车COR取0–5.44个百分点｜依据：用户确认的宽区间；上限为基于2025承保盈利状态与保费权重的条件边界｜影响：每1pct占比提升使整体车险COR增加0–0.0544pp｜需我确认】"],
  ["确认状态：用户已于2026-08-15明确确认，模型据此执行。"],
];
summary.getRange("A19:H20").format = { fill: C.yellow, wrapText: true, borders: { preset: "outside", style: "thin", color: "#C9B458" } };
summary.freezePanes.freezeRows(4);

// Assumptions and formulas
assumptions.showGridLines = false;
styleTitle(assumptions, "A1:F1", "输入、假设与派生口径", "蓝字黄底为用户可编辑情景；绿色公式为跨表链接/派生结果；所有金额单位为人民币百万元");
assumptions.getRange("A4:F4").values = [["指标", "数值", "单位", "类型", "来源ID", "说明"]];
styleHeader(assumptions.getRange("A4:F4"));
assumptions.getRange("A5:F15").values = [
  ["2025新能源车险保费", values.nevPremium2025, "百万元", "公开披露", "S1", "同比增长39.0%"],
  ["2025车险原保险保费", values.autoPremium2025, "百万元", "公开披露", "S2", "险种口径"],
  ["2025新能源车险保费同比", values.nevGrowth2025, "%", "公开披露", "S1", "用于反推2024新能源车险保费"],
  ["2024车险原保险保费", values.autoPremium2024, "百万元", "公开披露", "S2", "2025年报比较数"],
  ["2024车险综合成本率", values.carCor2024, "%", "公开披露", "S3", "历史比较基准"],
  ["2025车险综合成本率", values.carCor2025, "%", "公开披露", "S1", "用于条件上限推导"],
  ["2025新能源车险承保状态", "盈利", "文本", "公开披露", "S1", "只支持NEV COR<100%的方向性约束"],
  ["x下限：新能源COR−燃油COR", values.xMin, "pp", "用户确认假设", "A1", "宽区间下限"],
  ["x上限：新能源COR−燃油COR", values.xMax, "pp", "用户确认假设", "A1", "以5.44pp作为展示上限"],
  ["标准占比增量", values.standardShareStep, "%", "模型参数", "A1", "1pct=1%"],
  ["说明", null, null, null, null, "保费占比用作承保组合权重的可审计代理"]
];
assumptions.getRange("B5:B6").format.numberFormat = "#,##0";
assumptions.getRange("B7").format.numberFormat = "0.0%";
assumptions.getRange("B8").format.numberFormat = "#,##0";
assumptions.getRange("B9:B10").format.numberFormat = "0.0%";
assumptions.getRange("B12:B13").format.numberFormat = "0.00";
assumptions.getRange("B14").format.numberFormat = "0.00%";
assumptions.getRange("B12:B14").format = { fill: C.yellow, font: { color: "#0000FF", bold: true }, borders: { preset: "all", style: "thin", color: "#C9B458" } };
assumptions.getRange("A18:F18").values = [["派生指标", "结果", "单位", "公式", "来源", "审计说明"]];
styleHeader(assumptions.getRange("A18:F18"));
assumptions.getRange("A19:A28").values = [["2024新能源车险保费（重构）"], ["2024新能源保费占比"], ["2025新能源保费占比"], ["2024→2025占比变化"], ["正向COR差距精确条件上限"], ["每+1pct占比最大拖累"], ["实际占比变化最大拖累"], ["观察到的车险COR改善"], ["最大情景下底层改善"], ["最大拖累/已报告改善"]];
assumptions.getRange("B19").formulas = [["=B5/(1+B7)"]];
assumptions.getRange("B20").formulas = [["=B19/B8"]];
assumptions.getRange("B21").formulas = [["=B5/B6"]];
assumptions.getRange("B22").formulas = [["=B21-B20"]];
assumptions.getRange("B23").formulas = [["=(1-B10)/(1-B21)*100"]];
assumptions.getRange("B24").formulas = [["=B14*B13"]];
assumptions.getRange("B25").formulas = [["=B22*B13"]];
assumptions.getRange("B26").formulas = [["=(B9-B10)*100"]];
assumptions.getRange("B27").formulas = [["=B26+B25"]];
assumptions.getRange("B28").formulas = [["=B25/B26"]];
assumptions.getRange("C19:C28").values = [["百万元"], ["%"], ["%"], ["pct"], ["pp"], ["pp"], ["pp"], ["pp"], ["pp"], ["%"]];
assumptions.getRange("D19:D28").values = [["2025 NEV保费/(1+同比)"], ["重构NEV保费/2024车险保费"], ["2025 NEV保费/2025车险保费"], ["2025占比−2024占比"], ["(100%−整体COR)/(1−NEV权重)"], ["1%×x上限"], ["实际占比变化×x上限"], ["2024 COR−2025 COR"], ["观察改善+最大结构拖累"], ["最大结构拖累/观察改善"]];
assumptions.getRange("E19:E28").values = [["S1"], ["S1/S2"], ["S1/S2"], ["S1/S2"], ["S1/A1"], ["A1"], ["S1/S2/A1"], ["S1/S3"], ["S1/S2/S3/A1"], ["S1/S2/S3/A1"]];
assumptions.getRange("F19:F28").values = [["同比为四舍五入披露值"], ["保费占比代理"], ["保费占比代理"], ["百分点变化"], ["令NEV COR=100%的条件边界"], ["线性敏感性"], ["线性敏感性"], ["直接历史差"], ["假设无mix拖累时的改善"], ["相对已报告改善的抵消强度"]];
assumptions.getRange("B20:B22").format.numberFormat = "0.0000%";
assumptions.getRange("B19").format.numberFormat = "#,##0.0000";
assumptions.getRange("B23:B27").format.numberFormat = "0.0000";
assumptions.getRange("B28").format.numberFormat = "0.0%";
assumptions.getRange("B19:B28").format.font = { color: C.black };
styleGrid(assumptions.getRange("A4:F15"));
styleGrid(assumptions.getRange("A18:F28"));
assumptions.freezePanes.freezeRows(4);

for (const [cell, text] of [
  ["B5", `${sourceS1}；2025新能源车险保费52,480百万元。`],
  ["B6", `${sourceS2}；2025车险原保险保费230,362百万元。`],
  ["B7", `${sourceS1}；新能源车险保费同比增长39.0%。`],
  ["B8", `${sourceS2}；2024比较数223,301百万元。`],
  ["B9", `${sourceS3}；2024车险综合成本率98.1%。`],
  ["B10", `${sourceS1}；2025车险综合成本率95.8%。`],
  ["B11", `${sourceS1}；披露“新能源车险业务实现承保盈利”。`],
  ["B12", "用户于2026-08-15确认：x下限为0pp。"],
  ["B13", "用户于2026-08-15确认：x上限为5.44pp；这是两类COR差距上限。"],
  ["B14", "模型定义：占比每增加1个百分点，权重变化为1%=0.01。"],
]) workbook.comments.addThread({ cell: assumptions.getRange(cell) }, text);

// Sensitivity tables and chart
sensitivity.showGridLines = false;
styleTitle(sensitivity, "A1:N1", "敏感性矩阵与2025隐含分项COR", "结构拖累(pp)=新能源保费占比变化(小数)×x(pp)；矩阵全部由输入表公式驱动");
sensitivity.getRange("A4:H4").values = [["x / 占比提升", "1pct", "2pct", "3pct", "4pct", "5pct", "实际5.87pct", "10pct"]];
styleHeader(sensitivity.getRange("A4:H4"));
sensitivity.getRange("G4").formulas = [["='Assumptions'!B22"]];
sensitivity.getRange("B4:F4").values = [[0.01, 0.02, 0.03, 0.04, 0.05]];
sensitivity.getRange("H4").values = [[0.10]];
sensitivity.getRange("B4:H4").format.numberFormat = "0.00%";
sensitivity.getRange("A5:A11").values = [[0], [1], [2], [3], [4], [5], [5.44]];
sensitivity.getRange("A5:A11").format.numberFormat = "0.00\" pp\"";
sensitivity.getRange("B5").formulas = [["=$A5*B$4"]];
sensitivity.getRange("B5:H11").fillRight();
sensitivity.getRange("B5:H11").fillDown();
sensitivity.getRange("B5:H11").format.numberFormat = "0.0000";
sensitivity.getRange("B5:H11").conditionalFormats.add("colorScale", { colors: ["#E2F0D9", "#FFF2CC", "#F4B183"], thresholds: ["min", "50%", "max"] });
styleGrid(sensitivity.getRange("A4:H11"));
sensitivity.getRange("A13:D13").values = [["x情景(pp)", "燃油车COR（隐含）", "新能源车COR（隐含）", "加权回算差"]];
styleHeader(sensitivity.getRange("A13:D13"));
sensitivity.getRange("A14:A20").values = [[0], [1], [2], [3], [4], [5], [5.44]];
sensitivity.getRange("B14").formulas = [["='Assumptions'!$B$10-'Assumptions'!$B$21*A14/100"]];
sensitivity.getRange("B14:B20").fillDown();
sensitivity.getRange("C14").formulas = [["='Assumptions'!$B$10+(1-'Assumptions'!$B$21)*A14/100"]];
sensitivity.getRange("C14:C20").fillDown();
sensitivity.getRange("D14").formulas = [["=(1-'Assumptions'!$B$21)*B14+'Assumptions'!$B$21*C14-'Assumptions'!$B$10"]];
sensitivity.getRange("D14:D20").fillDown();
sensitivity.getRange("B14:D20").format.numberFormat = "0.0000%";
sensitivity.getRange("B14:D20").format.font = { color: C.green };
styleGrid(sensitivity.getRange("A13:D20"));
sensitivity.getRange("A22:D24").merge(true);
sensitivity.getRange("A22:A24").values = [
  ["解释：x=5.44pp并不等于整体COR增加5.44pp。整体变化还要乘以新增权重。"],
  ["条件边界：按精确公式，x上限约5.4391pp；展示采用用户确认的5.44pp，因此隐含NEV COR仅因四舍五入略高于100%。"],
  ["限制：分项COR为代数反推，不是中国平安披露值。"],
];
sensitivity.getRange("A22:D24").format = { fill: C.yellow, wrapText: true, borders: { preset: "all", style: "thin", color: "#C9B458" } };
sensitivity.getRange("K4:N4").values = [["占比提升", "x=1pp", "x=3pp", "x=5.44pp"]];
styleHeader(sensitivity.getRange("K4:N4"));
const helperShares = Array.from({ length: 11 }, (_, i) => [i / 100]);
sensitivity.getRange("K5:K15").values = helperShares;
sensitivity.getRange("L5").formulas = [["=$K5*1"]];
sensitivity.getRange("L5:L15").fillDown();
sensitivity.getRange("M5").formulas = [["=$K5*3"]];
sensitivity.getRange("M5:M15").fillDown();
sensitivity.getRange("N5").formulas = [["=$K5*'Assumptions'!$B$13"]];
sensitivity.getRange("N5:N15").fillDown();
sensitivity.getRange("K5:K15").format.numberFormat = "0%";
sensitivity.getRange("L5:N15").format.numberFormat = "0.000";
styleGrid(sensitivity.getRange("K4:N15"));
const chart = sensitivity.charts.add("line", sensitivity.getRange("K4:N15"));
chart.title = "新能源占比提升对整体车险COR的敏感性";
chart.hasLegend = true;
chart.xAxis = { axisType: "textAxis", title: { text: "新能源保费占比提升" } };
chart.yAxis = { numberFormatCode: "0.000", title: { text: "整体COR拖累（百分点）" } };
chart.setPosition("J17", "N33");
sensitivity.freezePanes.freezeRows(4);

// Checks
checks.showGridLines = false;
styleTitle(checks, "A1:G1", "模型检查", "所有关键关系必须为PASS；容差单位与被检验指标一致");
checks.getRange("A4:G4").values = [["检查项", "实际值", "期望值", "差异", "容差", "状态", "说明"]];
styleHeader(checks.getRange("A4:G4"));
checks.getRange("A5:A10").values = [["2025新能源占比勾稽"], ["2024重构保费滚回2025"], ["精确上限令NEV COR=100%"], ["5.44与精确上限接近"], ["实际mix拖累勾稽"], ["x区间有效"]];
checks.getRange("B5").formulas = [["='Assumptions'!B21"]];
checks.getRange("C5").formulas = [["='Assumptions'!B5/'Assumptions'!B6"]];
checks.getRange("B6").formulas = [["='Assumptions'!B19*(1+'Assumptions'!B7)"]];
checks.getRange("C6").formulas = [["='Assumptions'!B5"]];
checks.getRange("B7").formulas = [["='Assumptions'!B10+(1-'Assumptions'!B21)*'Assumptions'!B23/100"]];
checks.getRange("C7").values = [[1]];
checks.getRange("B8").formulas = [["='Assumptions'!B13"]];
checks.getRange("C8").formulas = [["='Assumptions'!B23"]];
checks.getRange("B9").formulas = [["='Sensitivity'!G11"]];
checks.getRange("C9").formulas = [["='Assumptions'!B25"]];
checks.getRange("B10").formulas = [["=IF(AND('Assumptions'!B12>=0,'Assumptions'!B13>='Assumptions'!B12),1,0)"]];
checks.getRange("C10").values = [[1]];
checks.getRange("D5").formulas = [["=ABS(B5-C5)"]];
checks.getRange("D5:D10").fillDown();
checks.getRange("E5:E10").values = [[0.0000001], [0.01], [0.0000001], [0.01], [0.0000001], [0]];
checks.getRange("F5").formulas = [["=IF(D5<=E5,\"PASS\",\"FAIL\")"]];
checks.getRange("F5:F10").fillDown();
checks.getRange("G5:G10").values = [["同一公式重复验证"], ["允许披露同比四舍五入"], ["条件边界定义"], ["展示值四舍五入"], ["敏感性矩阵与直接公式一致"], ["下限非负且上限不低于下限"]];
checks.getRange("B5:E10").format.numberFormat = "0.000000";
checks.getRange("F5:F10").conditionalFormats.add("containsText", { text: "PASS", format: { fill: C.lightGreen, font: { bold: true, color: C.green } } });
checks.getRange("F5:F10").conditionalFormats.add("containsText", { text: "FAIL", format: { fill: C.lightRed, font: { bold: true, color: C.red } } });
styleGrid(checks.getRange("A4:G10"));
checks.getRange("A12:B12").values = [["整体状态", null]];
styleHeader(checks.getRange("A12:B12"));
checks.getRange("B12").formulas = [["=IF(COUNTIF(F5:F10,\"FAIL\")=0,\"PASS\",\"FAIL\")"]];
checks.getRange("B12").format = { fill: C.lightGreen, font: { color: C.green, bold: true, size: 14 } };
checks.freezePanes.freezeRows(4);

// Sources
sources.showGridLines = false;
styleTitle(sources, "A1:G1", "来源索引", "所有直接输入均来自白名单内的中国平安年报；本地文件路径仅用于审计定位");
sources.getRange("A4:G4").values = [["来源ID", "文件", "PDF页码", "报告页码", "披露项目", "本地路径", "备注"]];
styleHeader(sources.getRange("A4:G4"));
sources.getRange("A5:G8").values = [
  ["S1", "中国平安_年报_2025.pdf", "54", "50", "2025车险COR95.8%；新能源车险保费52,480；同比+39.0%；承保盈利", `${sourceRoot}中国平安_年报_2025.pdf`, "公司年报"],
  ["S2", "中国平安_年报_2025.pdf", "58", "54", "2025/2024车险原保险保费230,362/223,301", `${sourceRoot}中国平安_年报_2025.pdf`, "公司年报"],
  ["S3", "中国平安_年报_2024.pdf", "44–45", "40–41", "2024车险COR98.1%", `${sourceRoot}中国平安_年报_2024.pdf`, "公司年报"],
  ["A1", "用户确认", "—", "—", "x=0–5.44pp；标准占比增量1pct", "本次对话，2026-08-15", "情景假设，非公司披露"],
];
styleGrid(sources.getRange("A4:G8"));
sources.freezePanes.freezeRows(4);

// Widths and row sizing
for (const [sheet, widths] of [
  [summary, [["A:A", 30], ["B:B", 15], ["C:C", 10], ["D:D", 34], ["E:E", 17], ["F:F", 28], ["G:G", 34], ["H:H", 16]]],
  [assumptions, [["A:A", 34], ["B:B", 18], ["C:C", 12], ["D:D", 18], ["E:E", 16], ["F:F", 42]]],
  [sensitivity, [["A:A", 22], ["B:C", 20], ["D:D", 17], ["E:H", 14], ["I:I", 3], ["J:J", 3], ["K:N", 16]]],
  [checks, [["A:A", 32], ["B:E", 16], ["F:F", 12], ["G:G", 38]]],
  [sources, [["A:A", 12], ["B:B", 28], ["C:D", 13], ["E:E", 54], ["F:F", 72], ["G:G", 22]]],
]) {
  for (const [range, width] of widths) sheet.getRange(range).format.columnWidth = width;
  sheet.getUsedRange().format.autofitRows();
}
summary.getRange("A13:H20").format.rowHeight = 34;
sensitivity.getRange("A22:D24").format.rowHeight = 34;

const audit = await workbook.inspect({ kind: "workbook,sheet,formula", maxChars: 12000, tableMaxRows: 8, tableMaxCols: 8, options: { maxResults: 120 } });
console.log("AUDIT_START");
console.log(audit.ndjson.slice(0, 12000));
console.log("AUDIT_END");

for (const [sheetName, range] of [["Summary", "A1:H20"], ["Assumptions", "A1:F28"], ["Sensitivity", "A1:N33"], ["Checks", "A1:G12"], ["Sources", "A1:G8"]]) {
  const region = await workbook.inspect({ kind: "region", sheetId: sheetName, range, maxChars: 5000, tableMaxRows: 30, tableMaxCols: 14 });
  const text = region.ndjson;
  if (/#[A-Z]+[!?\/0-9]/.test(text)) throw new Error(`Potential formula error in ${sheetName}: ${text}`);
  console.log(`REGION_${sheetName}`, text.slice(0, 3500));
  const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, `preview_${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
}

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(xlsxPath);

const rows = [["record_type", "scenario_x_pp", "share_change_pp", "metric", "value", "unit", "status", "formula", "input_sources", "note"]];
rows.push(["input", "", "", "2025新能源汽车保费", values.nevPremium2025, "RMB mn", "direct", "", "S1", sourceS1]);
rows.push(["input", "", "", "2025车险原保险保费", values.autoPremium2025, "RMB mn", "direct", "", "S2", sourceS2]);
rows.push(["derived", "", "", "2025新能源保费占比", calc.nevShare2025, "%", "derived", "NEV premium / total auto premium", "S1/S2", `【推算：${pct(calc.nevShare2025, 4)}｜方法：52,480/230,362｜输入来源：${sourceS1}；${sourceS2}】`]);
rows.push(["derived", "", "", "2024新能源保费占比", calc.nevShare2024, "%", "derived", "52,480/(1+39.0%)/223,301", "S1/S2", `【推算：${pct(calc.nevShare2024, 4)}｜方法：52,480/(1+39.0%)/223,301｜输入来源：${sourceS1}；${sourceS2}】`]);
rows.push(["derived", "", "", "2024→2025新能源保费占比提升", calc.shareChange * 100, "pct", "derived", "2025 share - 2024 share", "S1/S2", `【推算：${fmt(calc.shareChange * 100, 4)}pct｜方法：${pct(calc.nevShare2025, 4)}-${pct(calc.nevShare2024, 4)}｜输入来源：${sourceS1}；${sourceS2}】`]);
for (const x of [0, 1, 2, 3, 4, 5, 5.44]) {
  const per1 = x * 0.01;
  const actual = x * calc.shareChange;
  const fuelCor = values.carCor2025 - calc.nevShare2025 * x / 100;
  const nevCor = values.carCor2025 + (1 - calc.nevShare2025) * x / 100;
  rows.push(["scenario", x, 1, "每+1pct占比的整体COR拖累", per1, "pp", "sensitivity", "1% * x", "A1", `【推算：${fmt(per1,4)}pp｜方法：1%×${x}pp｜输入来源：用户确认假设A1】`]);
  rows.push(["scenario", x, calc.shareChange * 100, "2024→2025实际占比变化的整体COR拖累", actual, "pp", "sensitivity", "actual share change * x", "S1/S2/A1", `【推算：${fmt(actual,4)}pp｜方法：${fmt(calc.shareChange*100,4)}%×${x}pp｜输入来源：${sourceS1}；${sourceS2}；用户确认假设A1】`]);
  rows.push(["scenario", x, "", "2025隐含燃油车COR", fuelCor, "%", "algebraic", "total COR - NEV share*x", "S1/S2/A1", `【推算：${pct(fuelCor,4)}｜方法：95.8%−${pct(calc.nevShare2025,4)}×${x}pp｜输入来源：${sourceS1}；${sourceS2}；用户确认假设A1】`]);
  rows.push(["scenario", x, "", "2025隐含新能源车COR", nevCor, "%", "algebraic", "total COR + (1-NEV share)*x", "S1/S2/A1", `【推算：${pct(nevCor,4)}｜方法：95.8%+(1−${pct(calc.nevShare2025,4)})×${x}pp｜输入来源：${sourceS1}；${sourceS2}；用户确认假设A1】`]);
}
await fs.writeFile(csvPath, rows.map((r) => r.map(esc).join(",")).join("\n") + "\n", "utf8");

const dataMd = `# 阶段3-3｜新能源车结构性成本敏感性数据\n\n## 模型定义\n\n整体车险COR = (1−w)×燃油车COR + w×新能源车COR = 燃油车COR + w×x，其中 w 为新能源车险保费占比，x=新能源车COR−燃油车COR（百分点）。因此，新能源占比每增加1个百分点，整体车险COR变化=1%×x。\n\n【假设：新能源车COR−燃油车COR取0–5.44个百分点｜依据：用户确认的宽区间；上限为基于2025承保盈利状态与保费权重的条件边界｜影响：每1pct占比提升使整体车险COR增加0–0.0544pp｜需我确认】\n\n确认状态：用户已于2026-08-15明确确认。\n\n## 关键输入与推算\n\n- 2025新能源车险保费：52,480百万元；同比增长39.0%。来源：${sourceS1}。\n- 2025/2024车险原保险保费：230,362/223,301百万元。来源：${sourceS2}。\n- 2025/2024车险COR：95.8%/98.1%。来源：${sourceS1}；${sourceS3}。\n- 【推算：${pct(calc.nevShare2025, 4)}｜方法：52,480/230,362｜输入来源：${sourceS1}；${sourceS2}】\n- 【推算：${pct(calc.nevShare2024, 4)}｜方法：52,480/(1+39.0%)/223,301｜输入来源：${sourceS1}；${sourceS2}】\n- 【推算：${fmt(calc.shareChange * 100, 4)}个百分点｜方法：${pct(calc.nevShare2025, 4)}−${pct(calc.nevShare2024, 4)}｜输入来源：${sourceS1}；${sourceS2}】\n- 【推算：${fmt(calc.exactGapCeiling, 4)}个百分点｜方法：(100%−95.8%)/(1−${pct(calc.nevShare2025, 4)})｜输入来源：${sourceS1}；${sourceS2}】\n- 【推算：0–${fmt(calc.maxDragPer1pp, 4)}个百分点｜方法：1%×(0–5.44pp)｜输入来源：用户确认假设A1】\n- 【推算：0–${fmt(calc.maxActualMixDrag, 4)}个百分点｜方法：${fmt(calc.shareChange * 100, 4)}%×(0–5.44pp)｜输入来源：${sourceS1}；${sourceS2}；用户确认假设A1】\n\n## x情景表\n\n| x（pp） | 每+1pct占比拖累（pp） | 实际5.8737pct占比提升拖累（pp） | 2025隐含燃油COR | 2025隐含新能源COR |\n|---:|---:|---:|---:|---:|\n${[0,1,2,3,4,5,5.44].map((x) => `| ${x.toFixed(2)} | ${(x*0.01).toFixed(4)} | ${(x*calc.shareChange).toFixed(4)} | ${pct(values.carCor2025-calc.nevShare2025*x/100,4)} | ${pct(values.carCor2025+(1-calc.nevShare2025)*x/100,4)} |`).join("\n")}\n\n## 限制\n\n1. w使用保费占比代理承保组合权重，不等同车辆数占比。\n2. x不是公司披露值；5.44pp是条件边界，不是实测差距。\n3. 线性敏感性未单独控制车型、地区、定价、维修成本、出险率与渠道变化。\n`;
const strictDataMd = `# 阶段3-3｜新能源车结构性成本敏感性数据

## 模型定义

整体车险COR = (1−w)×燃油车COR + w×新能源车COR = 燃油车COR + w×x。w 为新能源车险保费占比，x=新能源车COR−燃油车COR（百分点），所以新能源占比每增加1个百分点，整体车险COR变化=1%×x。

【假设：新能源车COR−燃油车COR取0–5.44个百分点｜依据：用户确认的宽区间；上限为基于2025承保盈利状态与保费权重的条件边界｜影响：每1pct占比提升使整体车险COR增加0–0.0544pp｜需我确认】

确认状态：用户已于2026-08-15明确确认。

## 直接输入

- 2025新能源车险保费52,480百万元、同比增长39.0%；2025车险COR95.8%；新能源车险业务承保盈利。来源：${sourceS1}。
- 2025/2024车险原保险保费230,362/223,301百万元。来源：${sourceS2}。
- 2024车险COR98.1%。来源：${sourceS3}。

## 关键推算

- 【推算：${pct(calc.nevShare2025,4)}｜方法：52,480/230,362｜输入来源：${sourceS1}；${sourceS2}】
- 【推算：${pct(calc.nevShare2024,4)}｜方法：52,480/(1+39.0%)/223,301｜输入来源：${sourceS1}；${sourceS2}】
- 【推算：${fmt(calc.shareChange*100,4)}个百分点｜方法：2025占比−2024占比｜输入来源：${sourceS1}；${sourceS2}】
- 【推算：${fmt(calc.exactGapCeiling,4)}个百分点｜方法：(100%−95.8%)/(1−${pct(calc.nevShare2025,4)})｜输入来源：${sourceS1}；${sourceS2}】
- 【推算：0–${fmt(calc.maxDragPer1pp,4)}个百分点｜方法：1%×(0–5.44pp)｜输入来源：用户确认假设A1】
- 【推算：0–${fmt(calc.maxActualMixDrag,4)}个百分点｜方法：${fmt(calc.shareChange*100,4)}%×(0–5.44pp)｜输入来源：${sourceS1}；${sourceS2}；用户确认假设A1】

## x情景表

| x情景 | 每+1pct占比拖累 | 实际占比提升拖累 | 2025隐含燃油COR | 2025隐含新能源COR |
|---:|---:|---:|---:|---:|
${[0,1,2,3,4,5,5.44].map((x) => `| x=${x.toFixed(2)}pp | 【推算：${(x*0.01).toFixed(4)}pp｜方法：1%×${x}pp｜输入来源：A1】 | 【推算：${(x*calc.shareChange).toFixed(4)}pp｜方法：${fmt(calc.shareChange*100,4)}%×${x}pp｜输入来源：S1/S2/A1】 | 【推算：${pct(values.carCor2025-calc.nevShare2025*x/100,4)}｜方法：95.8%−${pct(calc.nevShare2025,4)}×${x}pp｜输入来源：S1/S2/A1】 | 【推算：${pct(values.carCor2025+(1-calc.nevShare2025)*x/100,4)}｜方法：95.8%+(1−${pct(calc.nevShare2025,4)})×${x}pp｜输入来源：S1/S2/A1】 |`).join("\n")}

## 限制

1. w使用保费占比代理承保组合权重，不等同车辆数占比。
2. x不是公司披露值；5.44pp是条件边界，不是实测差距。
3. 线性敏感性未单独控制车型、地区、定价、维修成本、出险率与渠道变化。
`;
await fs.writeFile(dataMdPath, strictDataMd, "utf8");

const reportMd = `# 阶段3-3｜新能源车结构性成本上移敏感性\n\n## 结论先行\n\n你的最新理解是对的：新能源车险保费占比每提高1个百分点，整体车险COR被拖高的情景区间为 **0–0.0544个百分点**，不是0–5.44个百分点。5.44个百分点描述的是新能源车与燃油车之间的COR差距上限；整体COR只按新增新能源权重承受其中的一小部分。\n\n2024→2025，平安新能源车险保费占比由约${pct(calc.nevShare2024,2)}升至${pct(calc.nevShare2025,2)}，提高约${fmt(calc.shareChange*100,2)}个百分点。因此，结构性拖累约为0–${fmt(calc.maxActualMixDrag,2)}个百分点。同期车险COR却由98.1%降至95.8%，改善2.30个百分点。这意味着新能源结构并未令整体COR实际上升，而是最多抵消了其他经营改善的一部分；扣除结构拖累后，对应的底层改善约为2.30–${fmt(calc.underlyingImprovementAtMax,2)}个百分点。\n\n## 5.44个百分点如何理解\n\n定义 x=新能源车COR−燃油车COR。2025整体车险COR为95.8%，新能源车险业务披露为承保盈利，因此新能源车COR应低于100%。以2025新能源保费占比${pct(calc.nevShare2025,2)}作为权重，令新能源车COR恰好等于100%，反推得到正向差距的条件边界：\n\n【推算：${fmt(calc.exactGapCeiling,4)}个百分点｜方法：(100%−95.8%)/(1−${pct(calc.nevShare2025,4)})｜输入来源：${sourceS1}；${sourceS2}】\n\n模型展示采用用户确认的四舍五入值5.44个百分点。它不是平安披露的新能源/燃油车实际COR差，也不是整体车险COR的直接上升幅度。\n\n## 敏感性结果\n\n| 场景 | 每+1pct新能源占比的整体COR拖累 | 2024→2025累计结构拖累 | 对应底层COR改善 |\n|---|---:|---:|---:|\n| x=0pp | 0.0000pp | 0.0000pp | 2.3000pp |\n| x=3pp | 0.0300pp | ${(3*calc.shareChange).toFixed(4)}pp | ${(calc.observedCorImprovement+3*calc.shareChange).toFixed(4)}pp |\n| x=5pp | 0.0500pp | ${(5*calc.shareChange).toFixed(4)}pp | ${(calc.observedCorImprovement+5*calc.shareChange).toFixed(4)}pp |\n| x=5.44pp | ${fmt(calc.maxDragPer1pp,4)}pp | ${fmt(calc.maxActualMixDrag,4)}pp | ${fmt(calc.underlyingImprovementAtMax,4)}pp |\n\n在最大情景下，累计结构拖累相当于已报告2.30个百分点改善的约${(calc.offsetRatio*100).toFixed(1)}%。这只是敏感性桥接：表示如果没有新能源结构上移，同期改善可能更大，不构成对实际因果贡献的精确归因。\n\n## 数据与口径\n\n- 【推算：${pct(calc.nevShare2025,4)}｜方法：52,480/230,362｜输入来源：${sourceS1}；${sourceS2}】\n- 【推算：${pct(calc.nevShare2024,4)}｜方法：52,480/(1+39.0%)/223,301｜输入来源：${sourceS1}；${sourceS2}】\n- 【推算：${fmt(calc.shareChange*100,4)}个百分点｜方法：2025占比−2024占比｜输入来源：${sourceS1}；${sourceS2}】\n- 【假设：新能源车COR−燃油车COR取0–5.44个百分点｜依据：用户确认的宽区间；上限为基于2025承保盈利状态与保费权重的条件边界｜影响：每1pct占比提升使整体车险COR增加0–0.0544pp｜需我确认】\n- 确认状态：用户已于2026-08-15明确确认。\n\n## 边界与限制\n\n1. 新能源保费占比是可审计代理，不等于车辆数占比或风险暴露占比。\n2. 2024新能源保费由2025披露的同比39.0%反推，受披露四舍五入影响。\n3. x与线性关系是情景假设；实际COR还受定价、车型、车龄、地区、维修成本、零整比、出险率和渠道结构影响。\n4. 5.44pp是“新能源仍处于承保盈利”约束下的正向条件边界，不能表述为实测差距。\n`;
const strictReportMd = `# 阶段3-3｜新能源车结构性成本上移敏感性

## 结论先行

你的最新理解是对的：新能源车险保费占比每提高1个百分点，整体车险COR被拖高的情景区间为【推算：0–${fmt(calc.maxDragPer1pp,4)}个百分点｜方法：1%×(0–5.44pp)｜输入来源：用户确认假设A1】，不是0–5.44个百分点。5.44个百分点描述的是新能源车与燃油车之间的COR差距上限，整体COR只按新增新能源权重承受其中的一小部分。

2024→2025，平安新能源车险保费占比由【推算：${pct(calc.nevShare2024,4)}｜方法：52,480/(1+39.0%)/223,301｜输入来源：${sourceS1}；${sourceS2}】升至【推算：${pct(calc.nevShare2025,4)}｜方法：52,480/230,362｜输入来源：${sourceS1}；${sourceS2}】，提高【推算：${fmt(calc.shareChange*100,4)}个百分点｜方法：2025占比−2024占比｜输入来源：${sourceS1}；${sourceS2}】。对应结构拖累为【推算：0–${fmt(calc.maxActualMixDrag,4)}个百分点｜方法：${fmt(calc.shareChange*100,4)}%×(0–5.44pp)｜输入来源：${sourceS1}；${sourceS2}；用户确认假设A1】。

同期车险COR由98.1%降至95.8%，直接改善2.30个百分点（来源：${sourceS3}；${sourceS1}）。因此新能源结构并未令整体COR实际上升，而是最多抵消了其他经营改善的一部分；扣除结构拖累后的底层改善为【推算：2.3000–${fmt(calc.underlyingImprovementAtMax,4)}个百分点｜方法：已报告改善2.30pp+结构拖累0–${fmt(calc.maxActualMixDrag,4)}pp｜输入来源：${sourceS1}；${sourceS2}；${sourceS3}；用户确认假设A1】。

## 5.44个百分点如何理解

定义 x=新能源车COR−燃油车COR。2025整体车险COR为95.8%，新能源车险业务披露为承保盈利，因此新能源车COR应低于100%（来源：${sourceS1}）。以新能源保费占比作为权重，令新能源车COR恰好等于100%，反推得到：

【推算：${fmt(calc.exactGapCeiling,4)}个百分点｜方法：(100%−95.8%)/(1−${pct(calc.nevShare2025,4)})｜输入来源：${sourceS1}；${sourceS2}】

模型展示采用用户确认的四舍五入值5.44个百分点。它不是平安披露的新能源/燃油车实际COR差，也不是整体车险COR的直接上升幅度。

## 敏感性结果

| 场景 | 每+1pct新能源占比的整体COR拖累 | 2024→2025累计结构拖累 | 对应底层COR改善 |
|---|---:|---:|---:|
| x=0pp | 【推算：0.0000pp｜方法：1%×0pp｜输入来源：A1】 | 【推算：0.0000pp｜方法：${fmt(calc.shareChange*100,4)}%×0pp｜输入来源：S1/S2/A1】 | 【推算：2.3000pp｜方法：2.30pp+0pp｜输入来源：S1/S3/A1】 |
| x=3pp | 【推算：0.0300pp｜方法：1%×3pp｜输入来源：A1】 | 【推算：${(3*calc.shareChange).toFixed(4)}pp｜方法：${fmt(calc.shareChange*100,4)}%×3pp｜输入来源：S1/S2/A1】 | 【推算：${(calc.observedCorImprovement+3*calc.shareChange).toFixed(4)}pp｜方法：2.30pp+结构拖累｜输入来源：S1/S2/S3/A1】 |
| x=5pp | 【推算：0.0500pp｜方法：1%×5pp｜输入来源：A1】 | 【推算：${(5*calc.shareChange).toFixed(4)}pp｜方法：${fmt(calc.shareChange*100,4)}%×5pp｜输入来源：S1/S2/A1】 | 【推算：${(calc.observedCorImprovement+5*calc.shareChange).toFixed(4)}pp｜方法：2.30pp+结构拖累｜输入来源：S1/S2/S3/A1】 |
| x=5.44pp | 【推算：${fmt(calc.maxDragPer1pp,4)}pp｜方法：1%×5.44pp｜输入来源：A1】 | 【推算：${fmt(calc.maxActualMixDrag,4)}pp｜方法：${fmt(calc.shareChange*100,4)}%×5.44pp｜输入来源：S1/S2/A1】 | 【推算：${fmt(calc.underlyingImprovementAtMax,4)}pp｜方法：2.30pp+结构拖累｜输入来源：S1/S2/S3/A1】 |

最大情景下的抵消强度为【推算：${(calc.offsetRatio*100).toFixed(1)}%｜方法：${fmt(calc.maxActualMixDrag,4)}pp/2.30pp｜输入来源：${sourceS1}；${sourceS2}；${sourceS3}；用户确认假设A1】。这只是敏感性桥接，不构成对实际因果贡献的精确归因。

## 假设与限制

【假设：新能源车COR−燃油车COR取0–5.44个百分点｜依据：用户确认的宽区间；上限为基于2025承保盈利状态与保费权重的条件边界｜影响：每1pct占比提升使整体车险COR增加0–0.0544pp｜需我确认】

确认状态：用户已于2026-08-15明确确认。

1. 新能源保费占比是可审计代理，不等于车辆数占比或风险暴露占比。
2. 2024新能源保费由2025披露的同比39.0%反推，受披露四舍五入影响。
3. x与线性关系是情景假设；实际COR还受定价、车型、车龄、地区、维修成本、零整比、出险率和渠道结构影响。
4. 5.44pp是“新能源仍处于承保盈利”约束下的正向条件边界，不能表述为实测差距。
`;
await fs.writeFile(reportMdPath, strictReportMd, "utf8");

console.log(JSON.stringify({ xlsxPath, csvPath, dataMdPath, reportMdPath, calc }, null, 2));
