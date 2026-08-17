import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs/stage3_5_peers");
await fs.mkdir(outputDir, { recursive: true });
const xlsxPath = path.join(outputDir, "阶段3-5_同业对标.xlsx");
const csvPath = path.join(outputDir, "阶段3-5_同业对标.csv");
const dataMdPath = path.join(outputDir, "阶段3-5_同业对标.md");
const reportMdPath = path.join(outputDir, "阶段3-5_同业对标报告.md");

const sourceRoot = new URL("../00-原始材料/", import.meta.url).pathname;
const sources = {
  PA23: { file: "中国平安_年报_2023.pdf", page: "PDF 第27页（报告印刷页码23）", table: "经营业绩/产险业务分析表" },
  PA24: { file: "中国平安_年报_2024.pdf", page: "PDF 第46页（报告印刷页码42）", table: "经营业绩/产险业务分析表" },
  PA25: { file: "中国平安_年报_2025.pdf", page: "PDF 第57页（报告印刷页码53）", table: "经营业绩/产险业务分析表" },
  PI23: { file: "人保财险_年报_2023.pdf", page: "PDF 第13页（报告印刷页码11）", table: "承保业绩表" },
  PI24: { file: "人保财险_年报_2024.pdf", page: "PDF 第14页（报告印刷页码12）", table: "承保业绩表" },
  PI25: { file: "人保财险_年报_2025.pdf", page: "PDF 第14页（报告印刷页码12）", table: "承保业绩表" },
  CP23: { file: "中国太保_年报_2023.pdf", page: "PDF 第33页（报告印刷页码16）", table: "产险业务经营指标" },
  CP24: { file: "中国太保_年报_2024.pdf", page: "PDF 第46页（报告印刷页码27）", table: "产险业务经营指标" },
  CP25: { file: "中国太保_年报_2025.pdf", page: "PDF 第44页（报告印刷页码27）", table: "产险业务经营指标" },
  PA24M: { file: "中国平安_年报_2024.pdf", page: "PDF 第44–45页（报告印刷页码40–41）", table: "车险经营数据" },
  PA25M: { file: "中国平安_年报_2025.pdf", page: "PDF 第54页（报告印刷页码50）", table: "车险经营数据" },
  PA25P: { file: "中国平安_年报_2025.pdf", page: "PDF 第58页（报告印刷页码54）", table: "原保险保费按险种" },
  PA24S: { file: "中国平安_年报_2024.pdf", page: "PDF 第45页（报告印刷页码41）", table: "按险种划分的经营业绩表" },
  PA25S: { file: "中国平安_年报_2025.pdf", page: "PDF 第56页（报告印刷页码52）", table: "按险种划分的经营业绩表及COR公式" },
  L23: { file: "平安产险_年度信息披露报告_2023.pdf", page: "PDF 第118页", table: "分部报告（2023年度）" },
  L25A: { file: "平安产险_年度信息披露报告_2025.pdf", page: "PDF 第117页", table: "分部报告（2025年度）" },
  L25B: { file: "平安产险_年度信息披露报告_2025.pdf", page: "PDF 第119页", table: "分部报告（2024年度比较数）" },
};
const src = (id) => `${sources[id].file}，${sources[id].page}，${sources[id].table}`;
const inputSourceByEntityPeriod = {
  "平安产险|2022R": "PA23", "平安产险|2023": "PA23", "平安产险|2024": "PA24", "平安产险|2025": "PA25",
  "人保财险|2022R": "PI23", "人保财险|2023": "PI23", "人保财险|2024": "PI24", "人保财险|2025": "PI25",
  "太保产险|2022R": "CP23", "太保产险|2023": "CP23", "太保产险|2024": "CP24", "太保产险|2025": "CP25",
};

const raw = [
  { entity: "平安产险", period: "2022R", basis: "IFRS 17重述比较期；IFRS 9已先采用并含分类叠加调整", cor: 99.6, loss: 71.3, expense: 28.3, expenseStatus: "直接披露" },
  { entity: "平安产险", period: "2023", basis: "IFRS 17", cor: 100.7, loss: 71.5, expense: 29.2, expenseStatus: "直接披露" },
  { entity: "平安产险", period: "2024", basis: "IFRS 17", cor: 98.3, loss: 71.0, expense: 27.3, expenseStatus: "直接披露" },
  { entity: "平安产险", period: "2025", basis: "IFRS 17", cor: 96.8, loss: 70.4, expense: 26.4, expenseStatus: "直接披露" },
  { entity: "人保财险", period: "2022R", basis: "新准则重述比较期", cor: 96.6, loss: 69.4, expense: 27.2, expenseStatus: "直接披露" },
  { entity: "人保财险", period: "2023", basis: "新准则", cor: 97.8, loss: 70.6, expense: 27.2, expenseStatus: "直接披露" },
  { entity: "人保财险", period: "2024", basis: "新准则", cor: 98.8, loss: 73.0, expense: 25.8, expenseStatus: "直接披露" },
  { entity: "人保财险", period: "2025", basis: "新准则", cor: 97.5, loss: 73.9, expense: 23.6, expenseStatus: "直接披露" },
  { entity: "太保产险", period: "2022R", basis: "新准则重述比较期", cor: 96.9, loss: 68.0, expense: 28.9, expenseStatus: "推算：COR-赔付率" },
  { entity: "太保产险", period: "2023", basis: "新准则", cor: 97.7, loss: 69.1, expense: 28.6, expenseStatus: "推算：COR-赔付率" },
  { entity: "太保产险", period: "2024", basis: "新准则", cor: 98.6, loss: 70.8, expense: 27.8, expenseStatus: "直接披露" },
  { entity: "太保产险", period: "2025", basis: "新准则", cor: 97.5, loss: 70.4, expense: 27.1, expenseStatus: "直接披露" },
];

const idx = new Map(raw.map((r, i) => [`${r.entity}|${r.period}`, i + 5]));
const get = (entity, period) => raw.find((r) => r.entity === entity && r.period === period);
const entities = ["平安产险", "人保财险", "太保产险"];
const intervals = [["2022R", "2023"], ["2023", "2024"], ["2024", "2025"], ["2023", "2025"]];
const improvement = (entity, start, end, metric) => get(entity, start)[metric] - get(entity, end)[metric];
const peerMean = (start, end, metric) => (improvement("人保财险", start, end, metric) + improvement("太保产险", start, end, metric)) / 2;
const peerMin = (start, end, metric) => Math.min(improvement("人保财险", start, end, metric), improvement("太保产险", start, end, metric));
const peerMax = (start, end, metric) => Math.max(improvement("人保财险", start, end, metric), improvement("太保产险", start, end, metric));
const fmt = (n, d = 2) => Number(n).toFixed(d);
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};
const tag = (value, method, inputs) => `【推算：${value}｜方法：${method}｜输入来源：${inputs}】`;

const workbook = Workbook.create();
const summary = workbook.worksheets.add("Summary");
const inputs = workbook.worksheets.add("Inputs");
const changes = workbook.worksheets.add("Annual_Change");
const gaps = workbook.worksheets.add("Gap_2025");
const synthesis = workbook.worksheets.add("Stage3_Synthesis");
const checks = workbook.worksheets.add("Checks");
const sourceSheet = workbook.worksheets.add("Sources");
workbook.comments.setSelf({ displayName: "User" });

const C = {
  navy: "#17365D", blue: "#1F4E78", white: "#FFFFFF", black: "#000000", green: "#008000",
  red: "#C00000", yellow: "#FFF2CC", gray: "#F2F2F2", paleBlue: "#EAF3F8", lightGreen: "#E2F0D9",
  lightRed: "#FCE4D6", darkGray: "#666666", orange: "#ED7D31", cyan: "#5B9BD5",
};
function title(sheet, range, textValue, subtitle) {
  sheet.getRange(range).merge();
  const [left, right] = range.split(":");
  const startCol = left.match(/[A-Z]+/)[0];
  const endCol = right.match(/[A-Z]+/)[0];
  const row = Number(left.match(/\d+/)[0]);
  sheet.getRange(left).values = [[textValue]];
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
title(inputs, "A1:H1", "三家公司年度承保指标输入", "2022R为2023年报重述比较期，可接入2023–2025；旧准则原报2022不接入");
inputs.getRange("A4:H4").values = [["公司", "期间", "会计口径", "综合成本率", "赔付率", "费用率", "费用率状态", "来源ID"]];
header(inputs.getRange("A4:H4"));
for (let i = 0; i < raw.length; i++) {
  const r = raw[i];
  const row = i + 5;
  const id = inputSourceByEntityPeriod[`${r.entity}|${r.period}`];
  inputs.getRange(`A${row}:C${row}`).values = [[r.entity, r.period, r.basis]];
  inputs.getRange(`D${row}:E${row}`).values = [[r.cor / 100, r.loss / 100]];
  if (r.expenseStatus.startsWith("推算")) inputs.getRange(`F${row}`).formulas = [[`=D${row}-E${row}`]];
  else inputs.getRange(`F${row}`).values = [[r.expense / 100]];
  inputs.getRange(`G${row}:H${row}`).values = [[r.expenseStatus, id]];
  const comment = `Source: ${src(id)}`;
  for (const col of ["D", "E", "F"]) workbook.comments.addThread({ cell: inputs.getRange(`${col}${row}`) }, comment);
}
inputs.getRange("D5:F16").format.numberFormat = "0.0%";
inputs.getRange("F13:F14").format.font = { color: C.black };
grid(inputs.getRange("A4:H16"));
inputs.getRange("A19:H19").merge();
inputs.getRange("A19").values = [["口径说明：2022R是按新保险合同准则重述的比较期，不是旧准则原报2022。太保2022R和2023费用率由综合成本率减赔付率推算，其余比率直接披露。"]];
inputs.getRange("A19:H19").format = { fill: C.yellow, wrapText: true, borders: { preset: "outside", style: "thin", color: "#C9B458" } };
inputs.freezePanes.freezeRows(4);

// Annual changes
changes.showGridLines = false;
title(changes, "A1:K1", "同业年度变化与超额改善", "正数=比率下降/改善；同业均值仅作共同趋势代理，不是因果识别结果");
changes.getRange("A4:K4").values = [["期间", "指标", "平安改善(pp)", "人保改善(pp)", "太保改善(pp)", "同业均值(pp)", "同业下限(pp)", "同业上限(pp)", "平安超额(pp)", "同业均值/平安", "解释"]];
header(changes.getRange("A4:K4"));
const metricRows = [];
let cr = 5;
for (const [start, end] of intervals) {
  for (const [metric, label] of [["cor", "综合成本率"], ["loss", "赔付率"], ["expense", "费用率"]]) {
    const row = cr++;
    metricRows.push({ start, end, metric, label, row });
    const pStart = idx.get(`平安产险|${start}`), pEnd = idx.get(`平安产险|${end}`);
    const iStart = idx.get(`人保财险|${start}`), iEnd = idx.get(`人保财险|${end}`);
    const cStart = idx.get(`太保产险|${start}`), cEnd = idx.get(`太保产险|${end}`);
    const col = metric === "cor" ? "D" : metric === "loss" ? "E" : "F";
    changes.getRange(`A${row}:B${row}`).values = [[`${start}→${end}`, label]];
    changes.getRange(`C${row}:E${row}`).formulas = [[`=('Inputs'!${col}${pStart}-'Inputs'!${col}${pEnd})*100`, `=('Inputs'!${col}${iStart}-'Inputs'!${col}${iEnd})*100`, `=('Inputs'!${col}${cStart}-'Inputs'!${col}${cEnd})*100`]];
    changes.getRange(`F${row}:J${row}`).formulas = [[`=AVERAGE(D${row}:E${row})`, `=MIN(D${row}:E${row})`, `=MAX(D${row}:E${row})`, `=C${row}-F${row}`, `=IF(AND(B${row}="综合成本率",C${row}>0),F${row}/C${row},"")`]];
    changes.getRange(`K${row}`).values = [[metric === "cor" ? "整体结果" : metric === "loss" ? "赔付端变化" : "费用端变化"]];
  }
}
changes.getRange(`C5:I${cr - 1}`).format.numberFormat = "0.00;[Red](0.00);-";
changes.getRange(`J5:J${cr - 1}`).format.numberFormat = "0.0%;[Red](0.0%);-";
changes.getRange(`C5:J${cr - 1}`).format.font = { color: C.green };
changes.getRange(`I5:I${cr - 1}`).conditionalFormats.add("cellIs", { operator: "greaterThan", formula: 0, format: { fill: C.lightGreen, font: { color: C.green, bold: true } } });
changes.getRange(`I5:I${cr - 1}`).conditionalFormats.add("cellIs", { operator: "lessThan", formula: 0, format: { fill: C.lightRed, font: { color: C.red, bold: true } } });
grid(changes.getRange(`A4:K${cr - 1}`));
changes.freezePanes.freezeRows(4);

// 2025 gaps
gaps.showGridLines = false;
title(gaps, "A1:H1", "2025年横向差距", "Gap=平安−对标方；比率越低通常越好，因此负数表示平安更优");
gaps.getRange("A4:H4").values = [["对标方", "指标", "平安", "对标方", "Gap(pp)", "平安方向", "数量解释", "来源"]];
header(gaps.getRange("A4:H4"));
const comparisons = [["人保财险", 12], ["太保产险", 16]];
let gr = 5;
for (const [peer, inputRow] of comparisons) {
  for (const [metric, label, col] of [["cor", "综合成本率", "D"], ["loss", "赔付率", "E"], ["expense", "费用率", "F"]]) {
    gaps.getRange(`A${gr}:B${gr}`).values = [[peer, label]];
    gaps.getRange(`C${gr}:E${gr}`).formulas = [[`='Inputs'!${col}8`, `='Inputs'!${col}${inputRow}`, `=(C${gr}-D${gr})*100`]];
    gaps.getRange(`F${gr}`).formulas = [[`=IF(E${gr}<0,"平安更低",IF(E${gr}>0,"平安更高","持平"))`]];
    gaps.getRange(`G${gr}`).values = [[label === "综合成本率" ? "净承保结果差" : label === "赔付率" ? "赔付端差" : "费用端差"]];
    gaps.getRange(`H${gr}`).values = [[`${inputSourceByEntityPeriod["平安产险|2025"]}+${inputSourceByEntityPeriod[`${peer}|2025`]}`]];
    gr++;
  }
}
gaps.getRange("C5:D10").format.numberFormat = "0.0%";
gaps.getRange("E5:E10").format.numberFormat = "0.00;[Red](0.00);-";
gaps.getRange("C5:F10").format.font = { color: C.green };
gaps.getRange("E5:E10").conditionalFormats.add("cellIs", { operator: "lessThan", formula: 0, format: { fill: C.lightGreen, font: { color: C.green, bold: true } } });
gaps.getRange("E5:E10").conditionalFormats.add("cellIs", { operator: "greaterThan", formula: 0, format: { fill: C.lightRed, font: { color: C.red, bold: true } } });
grid(gaps.getRange("A4:H10"));
gaps.getRange("A13:H13").merge();
gaps.getRange("A13").values = [["读法：对人保，平安赔付率低3.5pp但费用率高2.8pp，净得COR低0.7pp；对太保，赔付率持平，费用率低0.7pp，净得COR低0.7pp。"]];
gaps.getRange("A13:H13").format = { fill: C.paleBlue, wrapText: true, borders: { preset: "outside", style: "thin", color: "#B4C6E7" } };
gaps.freezePanes.freezeRows(4);

// Stage 3 synthesis
synthesis.showGridLines = false;
title(synthesis, "A1:H1", "阶段3综合证据图", "不同拆解轴不可相加：同业代理、险种贡献、结构敏感性和非车桥接分别回答不同问题");
synthesis.getRange("A4:H4").values = [["模块", "观察窗口", "核心结果", "数值1", "数值2", "可持续性判断", "归因限制", "来源"]];
header(synthesis.getRange("A4:H4"));
synthesis.getRange("A5:H9").values = [
  ["3-1 COR拆解", "2023→2025", "费用率是整体COR改善的主要算术来源", 2.8, 1.1, "费用重置不宜按原幅度外推", "同业费用代理混合报行合一、渠道、结构与数字化", "阶段3-1及PA23/PA25/PI23/PI25/CP23/CP25"],
  ["3-2 保证险", "2023→2025", "保证险贡献占整体改善的大部分", 2.798393, 1.028259, "出清/扭亏主要是阶段性贡献", "与同业费用代理是不同拆解轴，不可相加", "L23/L25A/PA25S"],
  ["3-3 新能源", "2024→2025", "新能源占比提升形成结构性成本逆风", 0, 0.3195, "随占比继续提升可能延续", "区间为用户确认敏感性，不是实测分项COR差", "PA24M/PA25M/PA25P+用户确认A1"],
  ["3-4 核心非车", "2024→2025", "核心非车抵消车险与保证险毛改善", 2.215527, -0.718271, "责任险等压力未解除", "公开数据缺频次、案均赔款、费用率和准备金分拆", "PA24S/PA25S/L25A/L25B"],
  ["3-5 同业", "2024→2025", "最新一年更接近行业共同改善，平安超额收窄", 1.2, 0.3, "不支持线性外推2023→2024速度", "同业均值是趋势代理，不是纯外部效应", "PA24/PA25/PI24/PI25/CP24/CP25"],
];
synthesis.getRange("D5:E9").format.numberFormat = "0.0000;[Red](0.0000);-";
grid(synthesis.getRange("A4:H9"));
synthesis.getRange("A12:H12").merge();
synthesis.getRange("A12").values = [["综合判断"]];
header(synthesis.getRange("A12:H12"));
synthesis.getRange("A13:H17").merge(true);
synthesis.getRange("A13:A17").values = [
  ["1. 行业共同费用压降能解释平安费用率改善的大部分方向，但不能解释平安从2023年同业落后转为2025年领先。"],
  ["2. 2023→2024是主要分化年；2024→2025三家公司COR均改善，平安相对同业均值只多改善0.3pp。"],
  ["3. 平安2025年COR领先0.7pp的来源并不单一：对人保靠赔付率优势抵收费率劣势；对太保靠费用率优势。"],
  ["4. 保证险阶段性贡献、核心非车反向压力和新能源结构逆风同时存在，不能把全部超额改善定义为可持续自身能力。"],
  ["5. 阶段4应把同业COR差、赔付率差、费用率差与分险种压力一起设为常态监控，而不是只看整体COR。"],
];
synthesis.getRange("A13:H17").format = { fill: C.paleBlue, wrapText: true, borders: { preset: "all", style: "thin", color: "#B4C6E7" } };
synthesis.freezePanes.freezeRows(4);

// Summary dashboard
summary.showGridLines = false;
title(summary, "A1:N1", "阶段3-5｜同业对标与阶段3汇总", "三家公司IFRS 17可比序列；重点观察2023–2025，2022R仅作重述比较期扩展");
summary.getRange("A4:N4").merge();
summary.getRange("A4").values = [["结论：平安2025年COR领先两家同业0.7pp，但领先来源因对手而异；最新一年80%的平安COR改善与同业均值方向一致，超额改善仅0.3pp。"]];
summary.getRange("A4:N4").format = { fill: C.yellow, font: { bold: true }, wrapText: true, borders: { preset: "outside", style: "thin", color: "#C9B458" } };

summary.getRange("A7:C7").merge(); summary.getRange("A7").values = [["2025平安COR"]];
summary.getRange("D7:F7").merge(); summary.getRange("D7").values = [["较人保/太保优势"]];
summary.getRange("G7:I7").merge(); summary.getRange("G7").values = [["2023→2025平安改善"]];
summary.getRange("J7:L7").merge(); summary.getRange("J7").values = [["2024→2025超额改善"]];
summary.getRange("A8:C10").merge(); summary.getRange("A8").formulas = [["='Inputs'!D8"]];
summary.getRange("D8:F10").merge(); summary.getRange("D8").formulas = [["=-'Gap_2025'!E5/100"]];
const rowCor2325 = metricRows.find((x) => x.start === "2023" && x.end === "2025" && x.metric === "cor").row;
const rowCor2425 = metricRows.find((x) => x.start === "2024" && x.end === "2025" && x.metric === "cor").row;
summary.getRange("G8:I10").merge(); summary.getRange("G8").formulas = [[`='Annual_Change'!C${rowCor2325}/100`]];
summary.getRange("J8:L10").merge(); summary.getRange("J8").formulas = [[`='Annual_Change'!I${rowCor2425}/100`]];
for (const r of ["A7:C7", "D7:F7", "G7:I7", "J7:L7"]) header(summary.getRange(r));
for (const r of ["A8:C10", "D8:F10", "G8:I10", "J8:L10"]) summary.getRange(r).format = { fill: C.paleBlue, font: { color: C.green, bold: true, size: 20 }, horizontalAlignment: "center", verticalAlignment: "center", numberFormat: "0.0%" };

summary.getRange("A13:F13").values = [["指标", "平安改善", "人保改善", "太保改善", "同业均值", "平安超额"]];
header(summary.getRange("A13:F13"));
summary.getRange("A14:A16").values = [["综合成本率"], ["赔付率"], ["费用率"]];
for (let i = 0; i < 3; i++) {
  const r = rowCor2325 + i;
  summary.getRange(`B${14 + i}:F${14 + i}`).formulas = [[`='Annual_Change'!C${r}`, `='Annual_Change'!D${r}`, `='Annual_Change'!E${r}`, `='Annual_Change'!F${r}`, `='Annual_Change'!I${r}`]];
}
summary.getRange("B14:F16").format.numberFormat = "0.00;[Red](0.00);-";
summary.getRange("B14:F16").format.font = { color: C.green };
grid(summary.getRange("A13:F16"));

summary.getRange("A19:F19").values = [["期间", "平安COR改善", "人保COR改善", "太保COR改善", "同业均值", "平安超额"]];
header(summary.getRange("A19:F19"));
const corAnnual = metricRows.filter((x) => x.metric === "cor" && x.end !== "2025" ? true : x.start !== "2023").filter((x) => !(x.start === "2023" && x.end === "2025"));
for (let i = 0; i < 3; i++) {
  const r = metricRows.filter((x) => x.metric === "cor")[i].row;
  summary.getRange(`A${20 + i}`).values = [[metricRows.filter((x) => x.metric === "cor")[i].start + "→" + metricRows.filter((x) => x.metric === "cor")[i].end]];
  summary.getRange(`B${20 + i}:F${20 + i}`).formulas = [[`='Annual_Change'!C${r}`, `='Annual_Change'!D${r}`, `='Annual_Change'!E${r}`, `='Annual_Change'!F${r}`, `='Annual_Change'!I${r}`]];
}
summary.getRange("B20:F22").format.numberFormat = "0.00;[Red](0.00);-";
summary.getRange("B20:F22").format.font = { color: C.green };
grid(summary.getRange("A19:F22"));

// Formula-backed chart helpers
summary.getRange("H13:K13").values = [["期间", "平安产险", "人保财险", "太保产险"]];
header(summary.getRange("H13:K13"));
for (let i = 0; i < 4; i++) {
  const row = 14 + i;
  summary.getRange(`H${row}`).values = [[raw[i].period]];
  summary.getRange(`I${row}:K${row}`).formulas = [[`='Inputs'!D${5 + i}`, `='Inputs'!D${9 + i}`, `='Inputs'!D${13 + i}`]];
}
summary.getRange("I14:K17").format.numberFormat = "0.0%";
summary.getRange("I14:K17").format.font = { color: C.green };
const trendChart = summary.charts.add("line", summary.getRange("H13:K17"));
trendChart.title = "COR趋势：平安由落后转为领先（%）";
trendChart.hasLegend = true;
trendChart.xAxis = { axisType: "textAxis" };
trendChart.yAxis = { numberFormatCode: "0.0%", min: 0.95, max: 1.015 };
trendChart.setPosition("H19", "N35");

summary.getRange("A25:F25").merge(); summary.getRange("A25").values = [["管理含义（阶段4的输入，不在本阶段设阈值）"]];
header(summary.getRange("A25:F25"));
summary.getRange("A26:F30").merge(true);
summary.getRange("A26:A30").values = [
  ["同业共同因素：费用率同步下降，应把同业费用率变化作为外部环境代理。"],
  ["自身差异：平安相对同业的超额改善主要体现在赔付端，但包含保证险出清与结构变化，不能全部定义为能力提升。"],
  ["最新边际：2024→2025平安COR改善1.5pp，同业均值1.2pp，超额仅0.3pp，改善速度已明显趋同。"],
  ["脆弱点：核心非车COR升破100%，新能源占比提升仍对车险形成结构性逆风。"],
  ["监控建议：阶段4将COR差、赔付率差、费用率差、保证险贡献、核心非车COR和新能源结构拖累并列监控。"],
];
summary.getRange("A26:F30").format = { fill: C.paleBlue, wrapText: true, borders: { preset: "all", style: "thin", color: "#B4C6E7" } };
summary.freezePanes.freezeRows(4);

// Checks
checks.showGridLines = false;
title(checks, "A1:G1", "模型检查", "PASS表示公式、分解、来源完整性和单位通过；不代表同业代理已识别纯因果");
checks.getRange("A4:G4").values = [["检查项", "实际值", "期望值", "差异", "容差", "状态", "说明"]];
header(checks.getRange("A4:G4"));
const checkRows = [];
let qr = 5;
for (let i = 0; i < raw.length; i++) {
  const inputRow = i + 5;
  checkRows.push({ row: qr, label: `${raw[i].entity} ${raw[i].period} COR=赔付率+费用率`, actual: `='Inputs'!D${inputRow}`, expected: `='Inputs'!E${inputRow}+'Inputs'!F${inputRow}`, tolerance: 0.000001, note: "比率勾稽" });
  qr++;
}
for (const entity of entities) {
  const rows = metricRows.filter((x) => x.metric === "cor");
  const row2324 = rows.find((x) => x.start === "2023" && x.end === "2024").row;
  const row2425 = rows.find((x) => x.start === "2024" && x.end === "2025").row;
  const row2325 = rows.find((x) => x.start === "2023" && x.end === "2025").row;
  const col = entity === "平安产险" ? "C" : entity === "人保财险" ? "D" : "E";
  checkRows.push({ row: qr, label: `${entity} 2023→2025等于两段合计`, actual: `='Annual_Change'!${col}${row2325}`, expected: `='Annual_Change'!${col}${row2324}+'Annual_Change'!${col}${row2425}`, tolerance: 0.000001, note: "期间加总" });
  qr++;
}
for (const q of checkRows) {
  checks.getRange(`A${q.row}`).values = [[q.label]];
  checks.getRange(`B${q.row}:C${q.row}`).formulas = [[q.actual, q.expected]];
  checks.getRange(`D${q.row}`).formulas = [[`=ABS(B${q.row}-C${q.row})`]];
  checks.getRange(`E${q.row}`).values = [[q.tolerance]];
  checks.getRange(`F${q.row}`).formulas = [[`=IF(D${q.row}<=E${q.row},"PASS","FAIL")`]];
  checks.getRange(`G${q.row}`).values = [[q.note]];
}
checks.getRange(`B5:E${qr - 1}`).format.numberFormat = "0.000000";
checks.getRange(`F5:F${qr - 1}`).conditionalFormats.add("containsText", { text: "PASS", format: { fill: C.lightGreen, font: { color: C.green, bold: true } } });
checks.getRange(`F5:F${qr - 1}`).conditionalFormats.add("containsText", { text: "FAIL", format: { fill: C.lightRed, font: { color: C.red, bold: true } } });
grid(checks.getRange(`A4:G${qr - 1}`));
checks.getRange(`A${qr + 2}:B${qr + 2}`).values = [["MODEL STATUS", null]];
header(checks.getRange(`A${qr + 2}:B${qr + 2}`));
checks.getRange(`B${qr + 2}`).formulas = [[`=IF(COUNTIF(F5:F${qr - 1},"FAIL")=0,"PASS","FAIL")`]];
checks.getRange(`B${qr + 2}`).format = { fill: C.lightGreen, font: { color: C.green, bold: true, size: 14 } };
checks.freezePanes.freezeRows(4);

// Sources
sourceSheet.showGridLines = false;
title(sourceSheet, "A1:H1", "来源索引", "全部数字来自白名单中的公司年报；2022R为重述比较期");
sourceSheet.getRange("A4:H4").values = [["来源ID", "文件", "PDF页码", "报告页码", "期间", "用途", "本地路径", "备注"]];
header(sourceSheet.getRange("A4:H4"));
const sourceRows = Object.entries(sources).map(([id, s]) => {
  const pdfPage = (s.page.match(/PDF 第([0-9–-]+)页/) || [])[1] || "—";
  const reportPage = (s.page.match(/报告印刷页码(\d+)/) || [])[1] || "—";
  const period = id === "L23" ? "2023" : id === "L25B" ? "2024比较数" : id.includes("24") ? "2024" : id.includes("25") ? "2025" : "2022R/2023";
  const use = id.startsWith("L") ? "分部收入与利润" : id.endsWith("M") || id.endsWith("P") ? "车险与新能源结构" : id.endsWith("S") ? "分险种收入、利润与COR公式" : "COR、赔付率、费用率";
  return [id, s.file, pdfPage, reportPage, period, use, `${sourceRoot}${s.file}`, s.table];
});
sourceSheet.getRange(`A5:H${4 + sourceRows.length}`).values = sourceRows;
grid(sourceSheet.getRange(`A4:H${4 + sourceRows.length}`));
sourceSheet.getRange(`A${6 + sourceRows.length}:H${9 + sourceRows.length}`).values = [
  ["M31", "阶段3-1_COR拆解.md", "—", "—", "2023–2025", "COR费用/赔付拆解", "04-报告/阶段3-1_COR拆解.md", "已完成阶段"],
  ["M32", "阶段3-2_保证保险贡献.md", "—", "—", "2023–2025", "保证险贡献", "04-报告/阶段3-2_保证保险贡献.md", "已完成阶段"],
  ["M33", "阶段3-3_新能源敏感性.md", "—", "—", "2024–2025", "新能源结构敏感性", "04-报告/阶段3-3_新能源敏感性.md", "用户确认x=0–5.44pp"],
  ["M34", "阶段3-4_非车反向压力.md", "—", "—", "2024–2025", "非车压力桥接", "04-报告/阶段3-4_非车反向压力.md", "已完成阶段"],
];
grid(sourceSheet.getRange(`A${6 + sourceRows.length}:H${9 + sourceRows.length}`));
sourceSheet.freezePanes.freezeRows(4);

// Layout
for (const [sheet, widths] of [
  [summary, [["A:A", 24], ["B:F", 15], ["G:G", 4], ["H:K", 15], ["L:N", 10]]],
  [inputs, [["A:A", 16], ["B:B", 12], ["C:C", 42], ["D:F", 16], ["G:G", 24], ["H:H", 13]]],
  [changes, [["A:A", 15], ["B:B", 16], ["C:J", 16], ["K:K", 22]]],
  [gaps, [["A:B", 18], ["C:E", 16], ["F:G", 18], ["H:H", 22]]],
  [synthesis, [["A:A", 18], ["B:B", 16], ["C:C", 38], ["D:E", 15], ["F:G", 34], ["H:H", 40]]],
  [checks, [["A:A", 38], ["B:E", 16], ["F:F", 12], ["G:G", 20]]],
  [sourceSheet, [["A:A", 12], ["B:B", 34], ["C:D", 13], ["E:E", 14], ["F:F", 26], ["G:G", 72], ["H:H", 28]]],
]) {
  for (const [range, width] of widths) sheet.getRange(range).format.columnWidth = width;
  sheet.getUsedRange().format.autofitRows();
}
summary.getRange("A4:N4").format.rowHeight = 42;
summary.getRange("A26:F30").format.rowHeight = 34;
inputs.getRange("A19:H19").format.rowHeight = 48;
gaps.getRange("A13:H13").format.rowHeight = 42;
synthesis.getRange("A13:H17").format.rowHeight = 36;

// Verification and previews
const renderRanges = [
  ["Summary", "A1:N35"], ["Inputs", "A1:H19"], ["Annual_Change", `A1:K${cr - 1}`], ["Gap_2025", "A1:H13"],
  ["Stage3_Synthesis", "A1:H17"], ["Checks", `A1:G${qr + 2}`], ["Sources", `A1:H${9 + sourceRows.length}`],
];
for (const [sheetName, range] of renderRanges) {
  const region = await workbook.inspect({ kind: "region", sheetId: sheetName, range, maxChars: 4500, tableMaxRows: 35, tableMaxCols: 14 });
  console.log(`REGION_${sheetName}`, region.ndjson.slice(0, 4200));
  const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, `preview_${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const formulaErrors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" });
console.log("FORMULA_ERRORS", formulaErrors.ndjson);
const trace = workbook.trace("Summary!J8");
console.log("TRACE_SUMMARY_J8", JSON.stringify(trace).slice(0, 3000));

const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(xlsxPath);

// CSV
const csvRows = [["record_type", "period", "entity", "metric", "value", "unit", "status", "formula", "input_sources", "note"]];
for (const r of raw) {
  const id = inputSourceByEntityPeriod[`${r.entity}|${r.period}`];
  for (const [metric, value, status, formula] of [
    ["综合成本率", r.cor, "直接披露", "直接读取"],
    ["赔付率", r.loss, "直接披露", "直接读取"],
    ["费用率", r.expense, r.expenseStatus.startsWith("推算") ? "推算" : "直接披露", r.expenseStatus.startsWith("推算") ? "综合成本率-赔付率" : "直接读取"],
  ]) {
    const note = status === "推算" ? tag(`${fmt(value, 1)}%`, `${fmt(r.cor, 1)}%-${fmt(r.loss, 1)}%`, src(id)) : `直接披露；来源：${src(id)}`;
    csvRows.push(["input", r.period, r.entity, metric, value, "%", status, formula, src(id), note]);
  }
}
for (const [start, end] of intervals) {
  for (const [metric, label] of [["cor", "综合成本率改善"], ["loss", "赔付率改善"], ["expense", "费用率改善"]]) {
    for (const entity of entities) {
      const value = improvement(entity, start, end, metric);
      const s1 = src(inputSourceByEntityPeriod[`${entity}|${start}`]);
      const s2 = src(inputSourceByEntityPeriod[`${entity}|${end}`]);
      const method = `${fmt(get(entity, start)[metric], 1)}%-${fmt(get(entity, end)[metric], 1)}%`;
      csvRows.push(["change", `${start}→${end}`, entity, label, value, "个百分点", "推算", method, `${s1}；${s2}`, tag(`${fmt(value, 2)}个百分点`, method, `${s1}；${s2}`)]);
    }
    const mean = peerMean(start, end, metric), min = peerMin(start, end, metric), max = peerMax(start, end, metric);
    const peerSources = `${src(inputSourceByEntityPeriod[`人保财险|${start}`])}；${src(inputSourceByEntityPeriod[`人保财险|${end}`])}；${src(inputSourceByEntityPeriod[`太保产险|${start}`])}；${src(inputSourceByEntityPeriod[`太保产险|${end}`])}`;
    csvRows.push(["peer_proxy", `${start}→${end}`, "人保+太保", `${label}_同业均值`, mean, "个百分点", "推算", "(人保改善+太保改善)/2", peerSources, tag(`${fmt(mean, 2)}个百分点`, `(人保改善${fmt(improvement("人保财险", start, end, metric), 2)}+太保改善${fmt(improvement("太保产险", start, end, metric), 2)})/2`, peerSources)]);
    csvRows.push(["peer_proxy", `${start}→${end}`, "人保+太保", `${label}_同业区间`, `${fmt(min, 2)}–${fmt(max, 2)}`, "个百分点", "推算", "min/max(人保改善,太保改善)", peerSources, tag(`${fmt(min, 2)}–${fmt(max, 2)}个百分点`, "min/max(人保改善,太保改善)", peerSources)]);
    const pingSources = `${src(inputSourceByEntityPeriod[`平安产险|${start}`])}；${src(inputSourceByEntityPeriod[`平安产险|${end}`])}`;
    const excess = improvement("平安产险", start, end, metric) - mean;
    csvRows.push(["peer_excess", `${start}→${end}`, "平安产险", `${label}_相对同业均值超额`, excess, "个百分点", "推算", "平安改善-同业均值改善", `${pingSources}；${peerSources}`, tag(`${fmt(excess, 2)}个百分点`, `平安改善${fmt(improvement("平安产险", start, end, metric), 2)}-同业均值${fmt(mean, 2)}`, `${pingSources}；${peerSources}`)]);
  }
}
for (const peer of ["人保财险", "太保产险"]) {
  for (const [metric, label] of [["cor", "综合成本率"], ["loss", "赔付率"], ["expense", "费用率"]]) {
    const value = get("平安产险", "2025")[metric] - get(peer, "2025")[metric];
    const inSrc = `${src("PA25")}；${src(inputSourceByEntityPeriod[`${peer}|2025`])}`;
    csvRows.push(["gap", "2025", `平安产险-${peer}`, `${label}差_平安减对标`, value, "个百分点", "推算", "平安比率-对标方比率", inSrc, tag(`${fmt(value, 2)}个百分点`, `${fmt(get("平安产险", "2025")[metric], 1)}%-${fmt(get(peer, "2025")[metric], 1)}%`, inSrc)]);
  }
}
await fs.writeFile(csvPath, csvRows.map((r) => r.map(esc).join(",")).join("\n") + "\n", "utf8");

const s2325 = `${src("PA23")}；${src("PA25")}；${src("PI23")}；${src("PI25")}；${src("CP23")}；${src("CP25")}`;
const s2425 = `${src("PA24")}；${src("PA25")}；${src("PI24")}；${src("PI25")}；${src("CP24")}；${src("CP25")}`;
const gapPirc = `${src("PA25")}；${src("PI25")}`;
const gapCpic = `${src("PA25")}；${src("CP25")}`;
const dataMd = `# 阶段3-5｜同业对标数据说明

## 口径

- 使用平安产险、人保财险、太保产险年度整体综合成本率、赔付率和费用率。
- 主分析窗口为2023–2025；2022R是各公司2023年报中的新准则重述比较期，可作扩展趋势。旧准则原报2022不接入。
- 改善=期初比率−期末比率，正数表示改善；Gap=平安−对标方，负数表示平安比率更低。
- 同业均值=(人保改善+太保改善)/2，仅作行业共同趋势代理，不等于纯外部政策效应。

## 核心派生结果

- 2023→2025平安COR改善：${tag(`${fmt(improvement("平安产险", "2023", "2025", "cor"), 2)}个百分点`, "100.7%-96.8%", `${src("PA23")}；${src("PA25")}`)}。
- 同期人保、太保COR改善均值：${tag(`${fmt(peerMean("2023", "2025", "cor"), 2)}个百分点`, `(人保改善${fmt(improvement("人保财险", "2023", "2025", "cor"), 2)}+太保改善${fmt(improvement("太保产险", "2023", "2025", "cor"), 2)})/2`, s2325)}。
- 平安相对同业均值的COR超额改善：${tag(`${fmt(improvement("平安产险", "2023", "2025", "cor") - peerMean("2023", "2025", "cor"), 2)}个百分点`, `平安改善${fmt(improvement("平安产险", "2023", "2025", "cor"), 2)}-同业均值${fmt(peerMean("2023", "2025", "cor"), 2)}`, s2325)}。
- 2024→2025同业COR改善均值：${tag(`${fmt(peerMean("2024", "2025", "cor"), 2)}个百分点`, `(人保改善${fmt(improvement("人保财险", "2024", "2025", "cor"), 2)}+太保改善${fmt(improvement("太保产险", "2024", "2025", "cor"), 2)})/2`, s2425)}；平安超额为${tag(`${fmt(improvement("平安产险", "2024", "2025", "cor") - peerMean("2024", "2025", "cor"), 2)}个百分点`, `平安改善${fmt(improvement("平安产险", "2024", "2025", "cor"), 2)}-同业均值${fmt(peerMean("2024", "2025", "cor"), 2)}`, s2425)}。

## 限制

同业均值只有两家公司，且各家公司业务结构、渠道结构、准备金发展和灾害暴露不同；它只能用于识别共同方向，不能直接命名为“报行合一纯效应”或“宏观环境纯效应”。
`;
await fs.writeFile(dataMdPath, dataMd, "utf8");

const reportMd = `# 阶段3-5｜同业对标：平安从落后转为领先，但最新超额改善已收窄

## 结论先行

2025年平安产险COR为96.8%，人保财险与太保产险均为97.5%。来源：${src("PA25")}；${src("PI25")}；${src("CP25")}。因此平安分别领先两家同业${tag("0.70个百分点", "97.5%-96.8%", `${gapPirc}；${gapCpic}`)}。

但这项领先不是一种能力带来的：对人保，平安赔付率低${tag("3.50个百分点", "73.9%-70.4%", gapPirc)}，同时费用率高${tag("2.80个百分点", "26.4%-23.6%", gapPirc)}，两者抵消后形成COR优势；对太保，双方赔付率均为70.4%（来源：${gapCpic}），平安费用率低${tag("0.70个百分点", "27.1%-26.4%", gapCpic)}。所以“平安COR领先”不能直接简化成“费用能力领先”或“赔付能力领先”。

## 三年变化：行业费用压降解释共同方向，赔付端解释平安分化

2023→2025，平安COR改善${tag("3.90个百分点", "100.7%-96.8%", `${src("PA23")}；${src("PA25")}`)}；人保和太保分别改善${tag("0.30个百分点", "97.8%-97.5%", `${src("PI23")}；${src("PI25")}`)}、${tag("0.20个百分点", "97.7%-97.5%", `${src("CP23")}；${src("CP25")}`)}，同业均值为${tag("0.25个百分点", "(0.30+0.20)/2", s2325)}。平安相对同业均值多改善${tag("3.65个百分点", "3.90-0.25", s2325)}。

费用端，平安改善${tag("2.80个百分点", "29.2%-26.4%", `${src("PA23")}；${src("PA25")}`)}，人保改善${tag("3.60个百分点", "27.2%-23.6%", `${src("PI23")}；${src("PI25")}`)}，太保改善${tag("1.50个百分点", "28.6%-27.1%", `${src("CP23")}；${src("CP25")}`)}，同业均值为${tag("2.55个百分点", "(3.60+1.50)/2", s2325)}。平安只比同业均值多改善${tag("0.25个百分点", "2.80-2.55", s2325)}。这说明费用率下降的大方向具有明显行业共性，但该均值仍混合报行合一、渠道、业务结构、费用投放和数字化，不是纯政策效应。

赔付端，平安改善${tag("1.10个百分点", "71.5%-70.4%", `${src("PA23")}；${src("PA25")}`)}；人保恶化${tag("3.30个百分点", "73.9%-70.6%", `${src("PI23")}；${src("PI25")}`)}，太保恶化${tag("1.30个百分点", "70.4%-69.1%", `${src("CP23")}；${src("CP25")}`)}，同业均值为${tag("-2.30个百分点", "((-3.30)+(-1.30))/2", s2325)}。平安相对同业均值多改善${tag("3.40个百分点", "1.10-(-2.30)", s2325)}。这部分是三年同业分化的主要算术来源，但其中包含保证险出清与业务结构变化，不能全部命名为可持续自身能力。

## 最新一年：改善更趋行业同步

2024→2025，平安、人保、太保COR分别改善${tag("1.50个百分点", "98.3%-96.8%", `${src("PA24")}；${src("PA25")}`)}、${tag("1.30个百分点", "98.8%-97.5%", `${src("PI24")}；${src("PI25")}`)}和${tag("1.10个百分点", "98.6%-97.5%", `${src("CP24")}；${src("CP25")}`)}。同业均值为${tag("1.20个百分点", "(1.30+1.10)/2", s2425)}，相当于平安改善的${tag("80.0%", "1.20/1.50×100", s2425)}；平安超额仅${tag("0.30个百分点", "1.50-1.20", s2425)}。

这个年度切片不支持把2023→2024的差异化改善速度线性外推。平安最新改善仍优于同业均值，但相对优势已经明显收窄。两个窗口都只是描述相对变化，不是严格因果估计。

## 与阶段3-1至3-4合并看

1. 阶段3-1显示，平安COR改善${tag("3.90个百分点", "100.7%-96.8%", `${src("PA23")}；${src("PA25")}`)}，其中费用率贡献${tag("2.80个百分点", "29.2%-26.4%", `${src("PA23")}；${src("PA25")}`)}、赔付率贡献${tag("1.10个百分点", "71.5%-70.4%", `${src("PA23")}；${src("PA25")}`)}。同业对标进一步说明：费用率改善大部分方向与行业一致，差异主要落在赔付端。
2. 阶段3-2按IFRS 17保险服务收入权重测得，保证险贡献${tag("2.798393个百分点", "2023保证险整体影响2.180355-2025保证险整体影响(-0.618038)", `${src("L23")}；${src("L25A")}；${src("PA25S")}`)}，其他业务贡献${tag("1.028259个百分点", "整体改善3.826652-保证险贡献2.798393", `${src("L23")}；${src("L25A")}；${src("PA25S")}`)}；两者合计${tag("3.826652个百分点", "2.798393+1.028259", `${src("L23")}；${src("L25A")}；${src("PA25S")}`)}。该精确底数与年报一位小数COR的直接差存在四舍五入差异。
3. 阶段3-3在用户确认的新能源与燃油车COR差区间下，测得结构拖累为${tag("0–0.3195个百分点", "新能源占比提升5.8737%×COR差0–5.44pp", `${src("PA24M")}；${src("PA25M")}；${src("PA25P")}；用户确认假设A1`)}。该结果是敏感性，不是实测差距。
4. 阶段3-4测得车险与保证险毛改善${tag("2.215527个百分点", "车险改善贡献+保证险改善贡献", `${src("PA24S")}；${src("PA25S")}；${src("L25B")}；${src("L25A")}`)}，核心非车反向压力${tag("0.718271个百分点", "-(意健险贡献+其他财产险贡献)", `${src("PA24S")}；${src("PA25S")}；${src("L25B")}；${src("L25A")}`)}，整体净改善${tag("1.497256个百分点", "毛改善2.215527-反向压力0.718271", `${src("PA24S")}；${src("PA25S")}；${src("L25B")}；${src("L25A")}`)}。

这些数字不能直接相加：同业代理按“公司间共同/差异”切分，保证险和非车按“险种”切分，新能源按“结构敏感性”切分，同一笔改善会在不同轴上重复出现。

## 对核心问题的阶段3答案

- **外部环境有多大？** 三年费用端中性同业代理为${tag("2.55个百分点", "(人保改善3.60+太保改善1.50)/2", s2325)}；最新一年整体COR同业代理占平安改善的${tag("80.0%", "同业均值1.20/平安改善1.50×100", s2425)}。这支持“外部/行业共同因素重要”，但不支持把代理直接命名为某一项政策的纯效果。
- **自身能力有多大？** 平安三年相对同业均值多改善${tag("3.65个百分点", "平安改善3.90-同业均值0.25", s2325)}，主要由赔付端的相对变化形成；但保证险阶段性改善占比很高，且业务结构也在变化，因此这是“差异化结果”，不是“可持续自身能力”的精确估计。
- **还能持续多久？** 公开数据不支持给出精确期限。方向上，保证险出清与费用重置不宜按原幅度重复；新能源结构成本和核心非车亏损会持续消耗改善；最新一年平安相对同业均值只多改善${tag("0.30个百分点", "平安改善1.50-同业均值1.20", s2425)}，说明后续更应观察赔付端是否保持相对优势，而不是外推过去两年的整体COR降幅。

## 本块停点

阶段3五块已全部完成。下一步是阶段4：把这些结论转成常态指标体系、异常触发规则、预警阈值和三个月经营动作；需用户确认后再继续。
`;
await fs.writeFile(reportMdPath, reportMd, "utf8");

console.log(JSON.stringify({ xlsxPath, csvPath, dataMdPath, reportMdPath, rows: csvRows.length - 1 }, null, 2));
