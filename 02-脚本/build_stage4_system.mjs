import fs from "node:fs/promises";
import path from "node:path";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = path.resolve("outputs/stage4_system");
await fs.mkdir(outputDir, { recursive: true });
const xlsxPath = path.join(outputDir, "阶段4_指标体系与预警.xlsx");
const csvPath = path.join(outputDir, "阶段4_指标体系.csv");
const dataMdPath = path.join(outputDir, "阶段4_指标体系.md");
const reportMdPath = path.join(outputDir, "平安产险经营分析报告.md");
const reportHtmlPath = path.join(outputDir, "平安产险经营分析报告.html");

const S = {
  Q25: "平安产险_偿付能力报告_2025Q1.pdf，PDF第18页，主要经营指标表",
  Q26: "平安产险_偿付能力报告_2026Q1.pdf，PDF第18页，主要经营指标表",
  A23: "中国平安_年报_2023.pdf，PDF第27页（报告印刷页码23），经营业绩/产险业务分析表",
  A24: "中国平安_年报_2024.pdf，PDF第46页（报告印刷页码42），经营业绩/产险业务分析表",
  A25: "中国平安_年报_2025.pdf，PDF第57页（报告印刷页码53），经营业绩/产险业务分析表",
  SEG24: "中国平安_年报_2024.pdf，PDF第45页（报告印刷页码41），按险种划分的经营业绩表",
  SEG25: "中国平安_年报_2025.pdf，PDF第56页（报告印刷页码52），按险种划分的经营业绩表及COR公式",
  L23: "平安产险_年度信息披露报告_2023.pdf，PDF第118页，分部报告（2023年度）",
  L25A: "平安产险_年度信息披露报告_2025.pdf，PDF第117页，分部报告（2025年度）",
  L25B: "平安产险_年度信息披露报告_2025.pdf，PDF第119页，分部报告（2024年度比较数）",
  PI25: "人保财险_年报_2025.pdf，PDF第14页（报告印刷页码12），承保业绩表",
  CP25: "中国太保_年报_2025.pdf，PDF第44页（报告印刷页码27），产险业务经营指标",
  IND25: "监管总局_保险业经营情况表_2025-03.xlsx，工作表《保险业经营数据（月度）》第7行（财产险）",
  IND26: "监管总局_保险业经营情况表_2026-03.xls，工作表《保险业经营数据（月度）》第8行（财产险）",
  EV: "中国平安_年报_2025.pdf，PDF第54页（报告印刷页码50），车险经营数据；中国平安_年报_2025.pdf，PDF第58页（报告印刷页码54），原保险保费按险种；中国平安_年报_2024.pdf，PDF第44至45页（报告印刷页码40至41），车险经营数据；用户确认假设A1",
};
const tag = (value, method, inputs) => `【推算：${value}｜方法：${method}｜输入来源：${inputs}】`;
const assumption = (text, basis, impact) => `【假设：${text}｜依据：${basis}｜影响：${impact}｜用户已于2026-08-16授权AI判断】`;
const fmt = (n, d = 2) => Number(n).toFixed(d);
const esc = (v) => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replaceAll('"', '""')}"` : s;
};

const raw = {
  q25: { signed: 89313.338367, autoSigned: 56950.864116, avgPremium: 2817, cor: 95.6, loss: 68.3, expense: 27.3, netProfit: 3370.23453 },
  q26: { signed: 95423.370140, autoSigned: 56664.100758, avgPremium: 2757, cor: 94.9, loss: 68.8, expense: 26.1, netProfit: 2788.855722 },
  industry: { mar25: 3867.00, mar26: 3815.05 },
  annual24: { serviceRevenue: 328146, cor: 98.3, underwritingProfit: 5463, investmentIncome: 16125, netProfit: 15021 },
  annual25: { serviceRevenue: 338912, cor: 96.8, underwritingProfit: 10717, investmentIncome: 11927, netProfit: 14597, autoCor: 95.8, liabilityCor: 106.8 },
  specials: { coreNonautoCor: 100.824516, guaranteeReliance: 73.129, nevMaxDrag: 0.3195, peerCorGap: -0.7 },
};

const calc = {
  signedGrowth: raw.q26.signed / raw.q25.signed - 1,
  industryGrowth: raw.industry.mar26 / raw.industry.mar25 - 1,
  growthGap: raw.q26.signed / raw.q25.signed - raw.industry.mar26 / raw.industry.mar25,
  autoSignedGrowth: raw.q26.autoSigned / raw.q25.autoSigned - 1,
  avgPremiumGrowth: raw.q26.avgPremium / raw.q25.avgPremium - 1,
  volume25: raw.q25.autoSigned * 1_000_000 / raw.q25.avgPremium,
  volume26: raw.q26.autoSigned * 1_000_000 / raw.q26.avgPremium,
  lossChange: raw.q26.loss - raw.q25.loss,
  expenseChange: raw.q26.expense - raw.q25.expense,
  netProfitGrowth: raw.q26.netProfit / raw.q25.netProfit - 1,
  revenueGrowth: raw.annual25.serviceRevenue / raw.annual24.serviceRevenue - 1,
  underwritingGrowth: raw.annual25.underwritingProfit / raw.annual24.underwritingProfit - 1,
  investmentGrowth: raw.annual25.investmentIncome / raw.annual24.investmentIncome - 1,
  annualNetGrowth: raw.annual25.netProfit / raw.annual24.netProfit - 1,
};
calc.volumeGrowth = calc.volume26 / calc.volume25 - 1;

const thresholds = [
  { id: "T01", metric: "整体COR", direction: "higher_bad", yellow: 98, red: 100, unit: "%", rationale: "100%是承保盈亏线；98%保留2pp缓冲，便于在滑向亏损前动作" },
  { id: "T02", metric: "车险COR", direction: "higher_bad", yellow: 97, red: 99, unit: "%", rationale: "车险是主体业务，需要给波动更大的非车业务留出承保缓冲" },
  { id: "T03", metric: "核心非车COR", direction: "higher_bad", yellow: 99, red: 100, unit: "%", rationale: "非车跨过100%即承保亏损，99%作为提前一格的黄线" },
  { id: "T04", metric: "责任险COR", direction: "higher_bad", yellow: 103, red: 105, unit: "%", rationale: "2024为102.7%，2025为106.8%；103%提示持续亏损，105%要求立即处置" },
  { id: "T05", metric: "赔付率或费用率同比恶化", direction: "higher_bad", yellow: 0.5, red: 1.0, unit: "pp", rationale: "0.5pp足以改变利润，1.0pp不应等待下一次年报再处理" },
  { id: "T06", metric: "COR落后同业均值", direction: "higher_bad", yellow: 0.5, red: 1.0, unit: "pp", rationale: "同业只校正共同环境，不替代公司绝对盈亏线" },
  { id: "T07", metric: "保费增速对行业差", direction: "lower_bad", yellow: -2.0, red: -5.0, unit: "pp", rationale: "落后2pp要求解释结构，落后5pp需要检查价格、渠道和风险筛选" },
  { id: "T08", metric: "车险签单保费同比", direction: "lower_bad", yellow: 0.0, red: -5.0, unit: "%", rationale: "负增长先拆数量与车均保费；跌幅达到5%进入组合处置" },
  { id: "T09", metric: "车均保费同比", direction: "lower_bad", yellow: -2.0, red: -5.0, unit: "%", rationale: "2%可提示价格或车型结构下移，5%需要检查定价充足性" },
  { id: "T10", metric: "净利润同比", direction: "lower_bad", yellow: -10.0, red: -20.0, unit: "%", rationale: "承保向好但净利润下降时，必须展开投资收益和其他损益桥接" },
  { id: "T11", metric: "保证险占整体改善贡献", direction: "higher_bad", yellow: 30.0, red: 50.0, unit: "%", rationale: "单一阶段性项目解释超过三成需单列，超过一半不得当作普遍能力" },
  { id: "T12", metric: "新能源年度结构拖累上限", direction: "higher_bad", yellow: 0.15, red: 0.30, unit: "pp", rationale: "0.30pp已足以吞掉2024→2025相对同业的0.30pp超额改善" },
  { id: "T13", metric: "总投资收益同比", direction: "lower_bad", yellow: -10.0, red: -20.0, unit: "%", rationale: "投资层会改变承保利润到净利润的传导，下降20%必须单列解释" },
];

const latestMetrics = [
  { id: "M01", layer: "保费增长", metric: "签单保费同比", value: calc.signedGrowth * 100, unit: "%", threshold: null, status: "GREEN", source: `${S.Q25}；${S.Q26}`, note: "同时看行业差" },
  { id: "M02", layer: "保费增长", metric: "保费增速对行业差", value: calc.growthGap * 100, unit: "pp", threshold: "T07", source: `${S.Q25}；${S.Q26}；${S.IND25}；${S.IND26}`, note: "公司签单保费与行业原保费口径不同，仅作方向参照" },
  { id: "M03", layer: "保费增长", metric: "车险签单保费同比", value: calc.autoSignedGrowth * 100, unit: "%", threshold: "T08", source: `${S.Q25}；${S.Q26}`, note: "需拆数量与车均保费" },
  { id: "M04", layer: "保费增长", metric: "车均保费同比", value: calc.avgPremiumGrowth * 100, unit: "%", threshold: "T09", source: `${S.Q25}；${S.Q26}`, note: "价格与车型/渠道结构混合" },
  { id: "M05", layer: "保费增长", metric: "隐含承保车辆数同比", value: calc.volumeGrowth * 100, unit: "%", threshold: null, status: "GREEN", source: `${S.Q25}；${S.Q26}`, note: "签单保费÷件均保费的代理" },
  { id: "M06", layer: "综合成本率", metric: "整体COR", value: raw.q26.cor, unit: "%", threshold: "T01", source: S.Q26, note: "偿付能力季度累计口径" },
  { id: "M07", layer: "综合成本率", metric: "赔付率同比变化", value: calc.lossChange, unit: "pp", threshold: "T05", source: `${S.Q25}；${S.Q26}`, note: "正数表示恶化" },
  { id: "M08", layer: "综合成本率", metric: "费用率同比变化", value: calc.expenseChange, unit: "pp", threshold: "T05", source: `${S.Q25}；${S.Q26}`, note: "正数表示恶化" },
  { id: "M09", layer: "综合成本率", metric: "车险COR", value: raw.annual25.autoCor, unit: "%", threshold: "T02", source: S.SEG25, note: "2025年度" },
  { id: "M10", layer: "综合成本率", metric: "核心非车COR", value: raw.specials.coreNonautoCor, unit: "%", threshold: "T03", source: `${S.SEG24}；${S.SEG25}；${S.L25B}；${S.L25A}`, note: "意健险+其他财产险，剔除保证险" },
  { id: "M11", layer: "综合成本率", metric: "责任险COR", value: raw.annual25.liabilityCor, unit: "%", threshold: "T04", source: S.SEG25, note: "2025年度" },
  { id: "M12", layer: "综合成本率", metric: "2025 COR对同业均值差", value: raw.specials.peerCorGap, unit: "pp", threshold: "T06", source: `${S.A25}；${S.PI25}；${S.CP25}`, note: "平安减同业均值，负数表示更低" },
  { id: "M13", layer: "承保利润", metric: "保证险占整体改善贡献", value: raw.specials.guaranteeReliance, unit: "%", threshold: "T11", source: `${S.L23}；${S.L25A}；${S.SEG25}`, note: "2023→2025阶段性贡献" },
  { id: "M14", layer: "承保利润", metric: "新能源年度结构拖累上限", value: raw.specials.nevMaxDrag, unit: "pp", threshold: "T12", source: S.EV, note: "敏感性上限，不是实测" },
  { id: "M15", layer: "投资与净利润", metric: "总投资收益同比", value: calc.investmentGrowth * 100, unit: "%", threshold: "T13", source: `${S.A24}；${S.A25}`, note: "2025年度" },
  { id: "M16", layer: "投资与净利润", metric: "净利润同比", value: calc.netProfitGrowth * 100, unit: "%", threshold: "T10", source: `${S.Q25}；${S.Q26}`, note: "2026Q1季度累计" },
];

function classify(value, thresholdId) {
  if (!thresholdId) return "GREEN";
  const t = thresholds.find((x) => x.id === thresholdId);
  if (t.direction === "higher_bad") return value >= t.red ? "RED" : value >= t.yellow ? "YELLOW" : "GREEN";
  return value <= t.red ? "RED" : value <= t.yellow ? "YELLOW" : "GREEN";
}
for (const m of latestMetrics) m.status = m.status ?? classify(m.value, m.threshold);
latestMetrics.find((m) => m.id === "M14").status = latestMetrics.find((m) => m.id === "M14").status === "RED" ? "SCENARIO RED" : latestMetrics.find((m) => m.id === "M14").status;

const metricTree = [
  ["L1", "保费增长", "签单保费/保险服务收入增速", "行业增速差、车险/非车险增速", "同比变化；同口径同周期", "月/季", "判断规模是否来自健康扩张"],
  ["L1.1", "保费增长", "量价拆分", "隐含车辆数、车均保费", "车险签单保费=隐含车辆数×车均保费", "季", "区分数量增长与价格/结构变化"],
  ["L1.2", "保费增长", "结构拆分", "新能源占比、保证险权重、非车险种占比", "分险种收入或保费/整体", "季/年", "识别结构效应"],
  ["L2", "综合成本率", "整体COR", "赔付率、费用率", "COR=赔付率+费用率", "季/半年/年", "判断承保是否盈利"],
  ["L2.1", "综合成本率", "赔付率", "频次、案均赔款", "赔付率≈出险频次×案均赔款/车均保费", "月/季", "区分频次与单价；公开数据缺底层字段"],
  ["L2.2", "综合成本率", "费用率", "获客/渠道费用、管理费用", "费用/保险服务收入", "月/季", "区分行业费用政策与自身效率"],
  ["L2.3", "综合成本率", "分险种COR", "车险、核心非车、责任险、保证险", "各险种承保结果/保险服务收入", "月/季/年", "防止整体均值掩盖亏损单元"],
  ["L3", "承保利润", "承保利润", "分险种贡献、一次性与可持续", "保险服务收入×(1-COR)", "季/年", "把比率变化落到金额"],
  ["L4", "加投资收益", "总投资收益", "同比变化、与承保利润桥接", "承保利润+投资收益+其他损益-税费≈净利润", "季/年", "解释承保向好但净利润不一致"],
  ["L4.1", "加投资收益", "净利润", "营运利润、偿付能力", "最终结果与资本约束", "季/年", "检验改善是否传导到最终结果"],
];

const actions = [
  ["A01", "0至30天", "责任险与核心非车", "把责任险按产品×地区×渠道×保单年度拆成亏损单元；冻结红色单元新增业务，逐单复核大额赔案和准备金发展", "责任险/核心非车运行COR、频次、案均赔款、续保调价", "先停止红灯继续扩大，推动责任险回到红线以下"],
  ["A02", "0至30天", "车险量价与赔付", "把车险保费增长拆成隐含车辆数和车均保费；对车均保费下降且赔付率上行的车型、地区和渠道复核费率充足性", "车均保费同比、车辆数同比、赔付率同比", "车均保费和赔付率不再同时处于黄灯"],
  ["A03", "31至60天", "新能源车险", "按车型、车龄、地区和维修网络重做新能源定价分层；扩大直供配件、维修网络和反欺诈规则覆盖", "新能源占比、频次、案均维修成本、敏感性结构拖累", "把结构拖累控制在黄线以内，避免吞掉相对同业的改善"],
  ["A04", "31至60天", "保证险", "固定输出整体COR与剔除保证险COR两套口径；把存量释放、新业务盈利和收入权重变化分开", "保证险贡献占比、剔除保证险COR、保证险新业务COR", "停止把阶段性贡献写入可持续基线"],
  ["A05", "61至90天", "利润与投资桥接", "每月把承保利润、投资收益、其他损益和税费勾稽到净利润；承保改善而净利润下降时自动升级复盘", "承保利润、总投资收益、净利润及桥接差额", "解释利润分化来源，避免用承保指标代替最终利润判断"],
];

const workbook = Workbook.create();
const dashboard = workbook.worksheets.add("Dashboard");
const treeSheet = workbook.worksheets.add("Metric_Tree");
const thresholdSheet = workbook.worksheets.add("Thresholds");
const qSheet = workbook.worksheets.add("Quarterly_Data");
const annualSheet = workbook.worksheets.add("Annual_Data");
const triggerSheet = workbook.worksheets.add("Specialty_Triggers");
const actionSheet = workbook.worksheets.add("Actions_90D");
const checks = workbook.worksheets.add("Checks");
const sourceSheet = workbook.worksheets.add("Sources");
workbook.comments.setSelf({ displayName: "User" });

const C = { navy: "#17365D", blue: "#1F4E78", white: "#FFFFFF", black: "#000000", green: "#008000", red: "#C00000", amber: "#BF9000", yellow: "#FFF2CC", gray: "#F2F2F2", paleBlue: "#EAF3F8", lightGreen: "#E2F0D9", lightRed: "#FCE4D6", lightYellow: "#FFF2CC", darkGray: "#666666" };
function title(sheet, range, text, subtitle) {
  sheet.getRange(range).merge();
  const [left, right] = range.split(":");
  const startCol = left.match(/[A-Z]+/)[0], endCol = right.match(/[A-Z]+/)[0], row = Number(left.match(/\d+/)[0]);
  sheet.getRange(left).values = [[text]];
  sheet.getRange(range).format = { fill: C.navy, font: { color: C.white, bold: true, size: 18 }, verticalAlignment: "center" };
  sheet.getRange(`${startCol}${row + 1}:${endCol}${row + 1}`).merge();
  sheet.getRange(`${startCol}${row + 1}`).values = [[subtitle]];
  sheet.getRange(`${startCol}${row + 1}:${endCol}${row + 1}`).format = { fill: C.paleBlue, font: { color: C.darkGray, italic: true, size: 10 }, wrapText: true };
}
function header(range) { range.format = { fill: C.blue, font: { color: C.white, bold: true }, borders: { preset: "all", style: "thin", color: "#B4C6E7" }, wrapText: true, verticalAlignment: "center" }; }
function grid(range) { range.format.borders = { preset: "all", style: "thin", color: "#D9E2F3" }; range.format.verticalAlignment = "center"; }
function statusCf(range) {
  range.conditionalFormats.add("containsText", { text: "GREEN", format: { fill: C.lightGreen, font: { color: C.green, bold: true } } });
  range.conditionalFormats.add("containsText", { text: "YELLOW", format: { fill: C.lightYellow, font: { color: C.amber, bold: true } } });
  range.conditionalFormats.add("containsText", { text: "RED", format: { fill: C.lightRed, font: { color: C.red, bold: true } } });
}

// Thresholds first so downstream formulas can reference it.
thresholdSheet.showGridLines = false;
title(thresholdSheet, "A1:H1", "管理预警阈值", "蓝字黄底为管理判断；用户已授权AI基于盈亏线、趋势与同业差做出判断，非监管标准");
thresholdSheet.getRange("A4:H4").values = [["阈值ID", "指标", "风险方向", "黄线", "红线", "单位", "判断理由", "假设状态"]];
header(thresholdSheet.getRange("A4:H4"));
for (let i = 0; i < thresholds.length; i++) {
  const r = thresholds[i], row = i + 5;
  thresholdSheet.getRange(`A${row}:H${row}`).values = [[r.id, r.metric, r.direction, r.yellow, r.red, r.unit, r.rationale, "用户授权AI判断"]];
}
thresholdSheet.getRange(`D5:E${4 + thresholds.length}`).format = { fill: C.yellow, font: { color: "#0000FF" } };
thresholdSheet.getRange(`D5:E${4 + thresholds.length}`).format.numberFormat = "0.00;[Red](0.00);-";
grid(thresholdSheet.getRange(`A4:H${4 + thresholds.length}`));
thresholdSheet.getRange(`A${7 + thresholds.length}:H${7 + thresholds.length}`).merge();
thresholdSheet.getRange(`A${7 + thresholds.length}`).values = [[assumption("采用表内黄线、红线及任一红灯/连续两期黄灯/同期两个关联黄灯的专题触发规则", "100%承保盈亏线、2023–2025可比历史、2026Q1最新经营数据和人保/太保同业差", "直接决定Dashboard状态、专题触发和90天动作优先级")]];
thresholdSheet.getRange(`A${7 + thresholds.length}:H${7 + thresholds.length}`).format = { fill: C.yellow, wrapText: true, borders: { preset: "outside", style: "thin", color: "#C9B458" } };
thresholdSheet.freezePanes.freezeRows(4);

// Quarterly data
qSheet.showGridLines = false;
title(qSheet, "A1:H1", "季度经营数据与量价拆分", "2025Q1与2026Q1同季度累计比较；金额单位人民币百万元");
qSheet.getRange("A4:H4").values = [["指标", "2025Q1", "2026Q1", "同比/变化", "单位", "计算口径", "2025来源", "2026来源"]];
header(qSheet.getRange("A4:H4"));
const qRows = [
  ["签单保费", raw.q25.signed, raw.q26.signed, null, "人民币百万元", "同比=(本期/上期)-1"],
  ["车险签单保费", raw.q25.autoSigned, raw.q26.autoSigned, null, "人民币百万元", "同比=(本期/上期)-1"],
  ["车均保费", raw.q25.avgPremium, raw.q26.avgPremium, null, "元/车", "同比=(本期/上期)-1"],
  ["隐含承保车辆数", calc.volume25, calc.volume26, null, "辆", "车险签单保费×1,000,000/车均保费"],
  ["综合成本率", raw.q25.cor / 100, raw.q26.cor / 100, null, "%", "本期-上期"],
  ["赔付率", raw.q25.loss / 100, raw.q26.loss / 100, null, "%", "本期-上期"],
  ["费用率", raw.q25.expense / 100, raw.q26.expense / 100, null, "%", "本期-上期"],
  ["净利润", raw.q25.netProfit, raw.q26.netProfit, null, "人民币百万元", "同比=(本期/上期)-1"],
];
for (let i = 0; i < qRows.length; i++) {
  const row = i + 5, q = qRows[i];
  qSheet.getRange(`A${row}:C${row}`).values = [[q[0], q[1], q[2]]];
  if ([4,5,6].includes(i)) qSheet.getRange(`D${row}`).formulas = [[`=(C${row}-B${row})*100`]];
  else qSheet.getRange(`D${row}`).formulas = [[`=C${row}/B${row}-1`]];
  qSheet.getRange(`E${row}:H${row}`).values = [[q[4], q[5], S.Q25, S.Q26]];
  for (const col of ["B", "C"]) workbook.comments.addThread({ cell: qSheet.getRange(`${col}${row}`) }, `Source: ${col === "B" ? S.Q25 : S.Q26}`);
}
qSheet.getRange("B5:C6").format.numberFormat = "#,##0.0";
qSheet.getRange("B7:C7").format.numberFormat = "#,##0";
qSheet.getRange("B8:C8").format.numberFormat = "#,##0";
qSheet.getRange("B9:C11").format.numberFormat = "0.0%";
qSheet.getRange("B12:C12").format.numberFormat = "#,##0.0";
qSheet.getRange("D5:D8").format.numberFormat = "0.00%;[Red](0.00%);-";
qSheet.getRange("D9:D11").format.numberFormat = "0.00;[Red](0.00);-";
qSheet.getRange("D12").format.numberFormat = "0.00%;[Red](0.00%);-";
qSheet.getRange("D5:D12").format.font = { color: C.black };
grid(qSheet.getRange("A4:H12"));
qSheet.freezePanes.freezeRows(4);

// Annual data
annualSheet.showGridLines = false;
title(annualSheet, "A1:H1", "年度结果链", "2024–2025 IFRS 17可比；承保利润改善未完全传导到净利润");
annualSheet.getRange("A4:H4").values = [["指标", "2024", "2025", "同比/变化", "单位", "公式", "2024来源", "2025来源"]];
header(annualSheet.getRange("A4:H4"));
const annualRows = [
  ["保险服务收入", raw.annual24.serviceRevenue, raw.annual25.serviceRevenue, "人民币百万元", "同比=(本期/上期)-1"],
  ["综合成本率", raw.annual24.cor / 100, raw.annual25.cor / 100, "%", "本期-上期"],
  ["承保利润", raw.annual24.underwritingProfit, raw.annual25.underwritingProfit, "人民币百万元", "同比=(本期/上期)-1"],
  ["总投资收益", raw.annual24.investmentIncome, raw.annual25.investmentIncome, "人民币百万元", "同比=(本期/上期)-1"],
  ["净利润", raw.annual24.netProfit, raw.annual25.netProfit, "人民币百万元", "同比=(本期/上期)-1"],
];
for (let i = 0; i < annualRows.length; i++) {
  const row = i + 5, a = annualRows[i];
  annualSheet.getRange(`A${row}:C${row}`).values = [[a[0], a[1], a[2]]];
  annualSheet.getRange(`D${row}`).formulas = [[i === 1 ? `=(C${row}-B${row})*100` : `=C${row}/B${row}-1`]];
  annualSheet.getRange(`E${row}:H${row}`).values = [[a[3], a[4], S.A24, S.A25]];
}
annualSheet.getRange("B5:C5").format.numberFormat = "#,##0";
annualSheet.getRange("B6:C6").format.numberFormat = "0.0%";
annualSheet.getRange("B7:C9").format.numberFormat = "#,##0";
annualSheet.getRange("D5").format.numberFormat = "0.00%";
annualSheet.getRange("D6").format.numberFormat = "0.00;[Red](0.00);-";
annualSheet.getRange("D7:D9").format.numberFormat = "0.00%;[Red](0.00%);-";
grid(annualSheet.getRange("A4:H9"));
annualSheet.getRange("A12:H12").merge();
annualSheet.getRange("A12").values = [["读法　承保利润同比上升，但总投资收益下降，净利润也下降。报告因此保留“承保利润→投资收益→净利润”这一层，不用COR代替最终结果。"]];
annualSheet.getRange("A12:H12").format = { fill: C.paleBlue, wrapText: true, borders: { preset: "outside", style: "thin", color: "#B4C6E7" } };
annualSheet.freezePanes.freezeRows(4);

// Metric tree
treeSheet.showGridLines = false;
title(treeSheet, "A1:G1", "常态指标分层", "保费增长→综合成本率→承保利润→加投资收益；每层向下拆一级");
treeSheet.getRange("A4:G4").values = [["层级", "主层", "一级指标", "下钻指标", "公式/口径", "更新频率", "经营问题"]];
header(treeSheet.getRange("A4:G4"));
treeSheet.getRange(`A5:G${4 + metricTree.length}`).values = metricTree;
grid(treeSheet.getRange(`A4:G${4 + metricTree.length}`));
treeSheet.freezePanes.freezeRows(4);

// Specialty triggers
triggerSheet.showGridLines = false;
title(triggerSheet, "A1:H1", "专题触发与当前信号", "任一红灯立即触发；连续两期黄灯或同期两个关联黄灯也触发");
triggerSheet.getRange("A4:H4").values = [["专题", "触发条件", "当前值", "状态", "当前判断", "优先下钻", "预期输出", "来源"]];
header(triggerSheet.getRange("A4:H4"));
const triggerRows = [
  ["保证险专题", "保证险贡献>50%或剔除后COR恶化", raw.specials.guaranteeReliance, "%", "RED", "阶段性贡献解释了整体改善的大部分", "存量/新业务、盈利率/权重", "整体与剔除保证险双口径", `${S.L23}；${S.L25A}；${S.SEG25}`],
  ["新能源专题", "结构拖累上限>0.30pp", raw.specials.nevMaxDrag, "pp", "SCENARIO RED", "上限情景足以吞掉最新同业超额改善", "车型/车龄/地区、频次/案均赔款", "结构拖累与效率改善桥接", S.EV],
  ["核心非车专题", "核心非车COR≥100%或责任险COR≥105%", raw.specials.coreNonautoCor, "%", "RED", "核心非车已跨过承保盈亏线", "责任险及其他财产险亏损单元", "频次、案均赔款、费用与准备金桥接", `${S.SEG24}；${S.SEG25}；${S.L25B}；${S.L25A}`],
  ["车险量价专题", "车均保费黄灯且赔付率同比恶化", calc.avgPremiumGrowth * 100, "%", "YELLOW", "数量增长被价格/结构下降部分抵消", "车辆数、车均保费、车型与渠道", "量价和结构效率分解", `${S.Q25}；${S.Q26}`],
  ["利润桥接专题", "投资收益红灯或净利润连续黄灯", calc.investmentGrowth * 100, "%", "RED", "承保改善未完全传导到净利润", "投资收益、其他损益、税费", "承保到净利润勾稽", `${S.A24}；${S.A25}`],
];
for (let i = 0; i < triggerRows.length; i++) {
  const row = i + 5, t = triggerRows[i];
  triggerSheet.getRange(`A${row}:B${row}`).values = [[t[0], t[1]]];
  triggerSheet.getRange(`C${row}:H${row}`).values = [[t[2], t[4], t[5], t[6], t[7], t[8]]];
  triggerSheet.getRange(`C${row}`).format.numberFormat = t[3] === "%" ? "0.00;[Red](0.00);-" : "0.0000";
}
statusCf(triggerSheet.getRange("D5:D9"));
grid(triggerSheet.getRange("A4:H9"));
triggerSheet.freezePanes.freezeRows(4);

// 90-day actions
actionSheet.showGridLines = false;
title(actionSheet, "A1:F1", "未来90天经营动作", "动作只承诺可复核的经营方向，不编造公开数据无法支持的利润或COR弹性");
actionSheet.getRange("A4:F4").values = [["动作ID", "时间", "对象", "动作", "验收指标", "预期影响"]];
header(actionSheet.getRange("A4:F4"));
actionSheet.getRange(`A5:F${4 + actions.length}`).values = actions;
grid(actionSheet.getRange(`A4:F${4 + actions.length}`));
actionSheet.getRange(`A${7 + actions.length}:F${7 + actions.length}`).merge();
actionSheet.getRange(`A${7 + actions.length}`).values = [[assumption("90天动作以方向性目标和可复核指标表达，不承诺缺乏弹性数据支持的精确利润或COR改善百分点", "公开材料没有定价、理赔、费用动作对COR的响应系数", "验收以信号退回黄线/绿线、拆解勾稽完成和恶化停止为准")]];
actionSheet.getRange(`A${7 + actions.length}:F${7 + actions.length}`).format = { fill: C.yellow, wrapText: true, borders: { preset: "outside", style: "thin", color: "#C9B458" } };
actionSheet.freezePanes.freezeRows(4);

// Dashboard, formula driven
dashboard.showGridLines = false;
title(dashboard, "A1:N1", "平安产险常态经营监控", "最新季度2026Q1；年度专题信号使用2025年报；红灯立即触发专题，黄灯观察连续性与关联性");
dashboard.getRange("A4:N4").merge();
dashboard.getRange("A4").values = [["判断　整体COR仍在绿区，但核心非车、责任险、保证险依赖和投资收益已触发红灯；车险量价与赔付端出现黄灯。"]];
dashboard.getRange("A4:N4").format = { fill: C.yellow, font: { bold: true }, wrapText: true, borders: { preset: "outside", style: "thin", color: "#C9B458" } };
dashboard.getRange("A7:H7").values = [["指标ID", "层级", "指标", "当前值", "单位", "阈值ID", "状态", "说明"]];
header(dashboard.getRange("A7:H7"));
for (let i = 0; i < latestMetrics.length; i++) {
  const m = latestMetrics[i], row = i + 8;
  dashboard.getRange(`A${row}:F${row}`).values = [[m.id, m.layer, m.metric, m.value, m.unit, m.threshold ?? "—"]];
  if (m.threshold) {
    const tr = thresholds.findIndex((t) => t.id === m.threshold) + 5;
    if (m.id === "M14") {
      dashboard.getRange(`G${row}`).formulas = [[`=IF(D${row}>='Thresholds'!E${tr},"SCENARIO RED",IF(D${row}>='Thresholds'!D${tr},"YELLOW","GREEN"))`]];
    } else {
      dashboard.getRange(`G${row}`).formulas = [[`=IF('Thresholds'!C${tr}="higher_bad",IF(D${row}>='Thresholds'!E${tr},"RED",IF(D${row}>='Thresholds'!D${tr},"YELLOW","GREEN")),IF(D${row}<='Thresholds'!E${tr},"RED",IF(D${row}<='Thresholds'!D${tr},"YELLOW","GREEN")))`]];
    }
  } else dashboard.getRange(`G${row}`).values = [[m.status]];
  dashboard.getRange(`H${row}`).values = [[m.note]];
  workbook.comments.addThread({ cell: dashboard.getRange(`D${row}`) }, `Source: ${m.source}`);
}
dashboard.getRange("D8:D23").format.numberFormat = "0.00;[Red](0.00);-";
statusCf(dashboard.getRange("G8:G23"));
grid(dashboard.getRange("A7:H23"));

dashboard.getRange("J7:N7").values = [["2025年度结果链", "2024", "2025", "同比/变化", "状态/含义"]];
header(dashboard.getRange("J7:N7"));
dashboard.getRange("J8:J12").values = [["保险服务收入"], ["综合成本率"], ["承保利润"], ["总投资收益"], ["净利润"]];
for (let i = 0; i < 5; i++) {
  const ar = i + 5, dr = i + 8;
  dashboard.getRange(`K${dr}:M${dr}`).formulas = [[`='Annual_Data'!B${ar}`, `='Annual_Data'!C${ar}`, `='Annual_Data'!D${ar}`]];
}
dashboard.getRange("N8:N12").values = [["规模增长"], ["承保改善"], ["承保利润增加"], ["RED"], ["净利润未同步增长"]];
dashboard.getRange("K8:L8").format.numberFormat = "#,##0";
dashboard.getRange("K9:L9").format.numberFormat = "0.0%";
dashboard.getRange("K10:L12").format.numberFormat = "#,##0";
dashboard.getRange("M8").format.numberFormat = "0.00%";
dashboard.getRange("M9").format.numberFormat = "0.00;[Red](0.00);-";
dashboard.getRange("M10:M12").format.numberFormat = "0.00%;[Red](0.00%);-";
dashboard.getRange("K8:M12").format.font = { color: C.green };
statusCf(dashboard.getRange("N8:N12"));
grid(dashboard.getRange("J7:N12"));

dashboard.getRange("J15:N15").values = [["状态", "数量", "触发规则", "专题", "处置时限"]];
header(dashboard.getRange("J15:N15"));
dashboard.getRange("J16:J18").values = [["RED"], ["YELLOW"], ["GREEN"]];
dashboard.getRange("K16").formulas = [["=COUNTIF(G8:G23,\"RED\")+COUNTIF(G8:G23,\"SCENARIO RED\")"]];
dashboard.getRange("K17").formulas = [["=COUNTIF(G8:G23,\"YELLOW\")"]];
dashboard.getRange("K18").formulas = [["=COUNTIF(G8:G23,\"GREEN\")"]];
dashboard.getRange("L16:N18").values = [["任一红灯立即触发", "核心非车/保证险/新能源/利润", "立即"], ["连续两期或同期两个关联黄灯", "车险量价与赔付", "本月复盘"], ["保持监控", "—", "按周期"]];
statusCf(dashboard.getRange("J16:J18"));
grid(dashboard.getRange("J15:N18"));
dashboard.getRange("J21:N21").merge(); dashboard.getRange("J21").values = [["为什么这样判断"]]; header(dashboard.getRange("J21:N21"));
dashboard.getRange("J22:N26").merge(true);
dashboard.getRange("J22:J26").values = [
  ["100%先作为承保盈亏线。整体和核心非车跨线就行动，不等同业也变差。"],
  ["车险红线放在99%，因为主体业务要给责任险等波动业务留缓冲。"],
  ["0.5pp和1.0pp是趋势预警，不把单期小波动直接当成结构问题。"],
  ["同业差只校正共同环境。业务结构不同，不能把同业均值当公司目标。"],
  ["保证险和新能源使用专题阈值，分别控制一次性依赖与结构性逆风。"],
];
dashboard.getRange("J22:N26").format = { fill: C.paleBlue, wrapText: true, borders: { preset: "all", style: "thin", color: "#B4C6E7" } };
dashboard.freezePanes.freezeRows(7);

// Checks
checks.showGridLines = false;
title(checks, "A1:G1", "模型检查", "PASS表示公式、阈值引用、量价勾稽和来源完整性通过，不代表管理阈值是监管标准");
checks.getRange("A4:G4").values = [["检查项", "实际值", "期望值", "差异", "容差", "状态", "说明"]];
header(checks.getRange("A4:G4"));
const checksSpec = [
  ["2025Q1 COR=赔付率+费用率", raw.q25.cor, raw.q25.loss + raw.q25.expense, 0.001, "季度比率勾稽"],
  ["2026Q1 COR=赔付率+费用率", raw.q26.cor, raw.q26.loss + raw.q26.expense, 0.001, "季度比率勾稽"],
  ["2025Q1车险保费量价勾稽", raw.q25.autoSigned, calc.volume25 * raw.q25.avgPremium / 1_000_000, 0.001, "保费=数量×车均保费"],
  ["2026Q1车险保费量价勾稽", raw.q26.autoSigned, calc.volume26 * raw.q26.avgPremium / 1_000_000, 0.001, "保费=数量×车均保费"],
  ["2025同业差", raw.specials.peerCorGap, raw.annual25.cor - (97.5 + 97.5) / 2, 0.000001, "平安COR-同业均值"],
  ["保证险贡献状态", latestMetrics.find((m) => m.id === "M13").status === "RED" ? 1 : 0, 1, 0, "超过50%应为RED"],
  ["新能源情景状态", latestMetrics.find((m) => m.id === "M14").status === "SCENARIO RED" ? 1 : 0, 1, 0, "上限超过0.30pp"],
  ["来源完整性", latestMetrics.filter((m) => m.source).length, latestMetrics.length, 0, "全部指标有来源"],
];
for (let i = 0; i < checksSpec.length; i++) {
  const row = i + 5, q = checksSpec[i];
  checks.getRange(`A${row}:C${row}`).values = [[q[0], q[1], q[2]]];
  checks.getRange(`D${row}`).formulas = [[`=ABS(B${row}-C${row})`]];
  checks.getRange(`E${row}`).values = [[q[3]]];
  checks.getRange(`F${row}`).formulas = [[`=IF(D${row}<=E${row},"PASS","FAIL")`]];
  checks.getRange(`G${row}`).values = [[q[4]]];
}
checks.getRange("B5:E12").format.numberFormat = "0.000000";
statusCf(checks.getRange("F5:F12"));
checks.getRange("F5:F12").conditionalFormats.add("containsText", { text: "PASS", format: { fill: C.lightGreen, font: { color: C.green, bold: true } } });
checks.getRange("F5:F12").conditionalFormats.add("containsText", { text: "FAIL", format: { fill: C.lightRed, font: { color: C.red, bold: true } } });
grid(checks.getRange("A4:G12"));
checks.getRange("A15:B15").values = [["MODEL STATUS", null]]; header(checks.getRange("A15:B15"));
checks.getRange("B15").formulas = [["=IF(COUNTIF(F5:F12,\"FAIL\")=0,\"PASS\",\"FAIL\")"]];
checks.getRange("B15").format = { fill: C.lightGreen, font: { color: C.green, bold: true, size: 14 } };
checks.freezePanes.freezeRows(4);

// Sources
sourceSheet.showGridLines = false;
title(sourceSheet, "A1:G1", "来源索引", "所有实测数字来自项目白名单；管理阈值单独标为判断，不冒充行业标准");
sourceSheet.getRange("A4:G4").values = [["来源ID", "文件", "页码/表号", "期间", "用途", "本地路径", "备注"]];
header(sourceSheet.getRange("A4:G4"));
const sourceRows = [
  ["Q25", "平安产险_偿付能力报告_2025Q1.pdf", "PDF第18页，主要经营指标表", "2025Q1", "季度经营与量价", "00-原始材料/平安产险_偿付能力报告_2025Q1.pdf", "偿付能力口径"],
  ["Q26", "平安产险_偿付能力报告_2026Q1.pdf", "PDF第18页，主要经营指标表", "2026Q1", "季度经营与量价", "00-原始材料/平安产险_偿付能力报告_2026Q1.pdf", "偿付能力口径"],
  ["A24", "中国平安_年报_2024.pdf", "PDF第46页（报告页42）", "2024", "年度结果链", "00-原始材料/中国平安_年报_2024.pdf", "IFRS 17"],
  ["A25", "中国平安_年报_2025.pdf", "PDF第57页（报告页53）", "2025", "年度结果链", "00-原始材料/中国平安_年报_2025.pdf", "IFRS 17"],
  ["SEG24", "中国平安_年报_2024.pdf", "PDF第45页（报告页41）", "2024", "分险种经营", "00-原始材料/中国平安_年报_2024.pdf", "按险种表"],
  ["SEG25", "中国平安_年报_2025.pdf", "PDF第56页（报告页52）", "2025", "分险种经营", "00-原始材料/中国平安_年报_2025.pdf", "按险种表及COR公式"],
  ["L23", "平安产险_年度信息披露报告_2023.pdf", "PDF第118页", "2023", "分部底数", "00-原始材料/平安产险_年度信息披露报告_2023.pdf", "分部报告"],
  ["L25A", "平安产险_年度信息披露报告_2025.pdf", "PDF第117页", "2025", "分部底数", "00-原始材料/平安产险_年度信息披露报告_2025.pdf", "分部报告"],
  ["L25B", "平安产险_年度信息披露报告_2025.pdf", "PDF第119页", "2024比较数", "分部底数", "00-原始材料/平安产险_年度信息披露报告_2025.pdf", "分部报告"],
  ["PI25", "人保财险_年报_2025.pdf", "PDF第14页（报告页12）", "2025", "同业COR", "00-原始材料/人保财险_年报_2025.pdf", "承保业绩表"],
  ["CP25", "中国太保_年报_2025.pdf", "PDF第44页（报告页27）", "2025", "同业COR", "00-原始材料/中国太保_年报_2025.pdf", "产险经营指标"],
  ["IND25", "监管总局_保险业经营情况表_2025-03.xlsx", "月度表第7行", "2025-03", "行业保费", "00-原始材料/监管总局_保险业经营情况表_2025-03.xlsx", "财产险"],
  ["IND26", "监管总局_保险业经营情况表_2026-03.xls", "月度表第8行", "2026-03", "行业保费", "00-原始材料/监管总局_保险业经营情况表_2026-03.xls", "财产险"],
];
sourceSheet.getRange(`A5:G${4 + sourceRows.length}`).values = sourceRows;
grid(sourceSheet.getRange(`A4:G${4 + sourceRows.length}`));
sourceSheet.freezePanes.freezeRows(4);

// Widths and row heights
for (const [sheet, widths] of [
  [dashboard, [["A:A", 11], ["B:B", 18], ["C:C", 28], ["D:E", 14], ["F:G", 15], ["H:H", 34], ["I:I", 3], ["J:J", 24], ["K:M", 15], ["N:N", 28]]],
  [treeSheet, [["A:A", 10], ["B:B", 17], ["C:D", 28], ["E:E", 44], ["F:F", 15], ["G:G", 36]]],
  [thresholdSheet, [["A:A", 11], ["B:B", 30], ["C:C", 16], ["D:F", 14], ["G:G", 58], ["H:H", 20]]],
  [qSheet, [["A:A", 24], ["B:D", 17], ["E:E", 18], ["F:F", 34], ["G:H", 62]]],
  [annualSheet, [["A:A", 24], ["B:D", 17], ["E:E", 18], ["F:F", 30], ["G:H", 60]]],
  [triggerSheet, [["A:A", 20], ["B:B", 38], ["C:D", 16], ["E:E", 38], ["F:G", 36], ["H:H", 70]]],
  [actionSheet, [["A:A", 10], ["B:B", 14], ["C:C", 20], ["D:D", 70], ["E:E", 40], ["F:F", 42]]],
  [checks, [["A:A", 36], ["B:E", 16], ["F:F", 12], ["G:G", 28]]],
  [sourceSheet, [["A:A", 12], ["B:B", 40], ["C:C", 28], ["D:D", 15], ["E:E", 24], ["F:F", 76], ["G:G", 24]]],
]) {
  for (const [range, width] of widths) sheet.getRange(range).format.columnWidth = width;
  sheet.getUsedRange().format.autofitRows();
}
dashboard.getRange("A4:N4").format.rowHeight = 42;
dashboard.getRange("J22:N26").format.rowHeight = 34;
thresholdSheet.getRange(`A${7 + thresholds.length}:H${7 + thresholds.length}`).format.rowHeight = 58;
actionSheet.getRange("D5:F9").format.wrapText = true;
actionSheet.getRange("A5:F9").format.rowHeight = 58;
actionSheet.getRange(`A${7 + actions.length}:F${7 + actions.length}`).format.rowHeight = 58;
triggerSheet.getRange("A5:H9").format.rowHeight = 46;
annualSheet.getRange("A12:H12").format.rowHeight = 48;

// Compact verification and previews
const renderRanges = [
  ["Dashboard", "A1:N26"], ["Metric_Tree", `A1:G${4 + metricTree.length}`], ["Thresholds", `A1:H${7 + thresholds.length}`],
  ["Quarterly_Data", "A1:H12"], ["Annual_Data", "A1:H12"], ["Specialty_Triggers", "A1:H9"],
  ["Actions_90D", `A1:F${7 + actions.length}`], ["Checks", "A1:G15"], ["Sources", `A1:G${4 + sourceRows.length}`],
];
for (const [sheetName, range] of renderRanges) {
  const region = await workbook.inspect({ kind: "region", sheetId: sheetName, range, maxChars: 4000, tableMaxRows: 32, tableMaxCols: 14 });
  console.log(`REGION_${sheetName}`, region.ndjson.slice(0, 3800));
  const preview = await workbook.render({ sheetName, range, scale: 1, format: "png" });
  await fs.writeFile(path.join(outputDir, `preview_${sheetName}.png`), new Uint8Array(await preview.arrayBuffer()));
}
const formulaErrors = await workbook.inspect({ kind: "match", searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A", options: { useRegex: true, maxResults: 300 }, summary: "final formula error scan" });
console.log("FORMULA_ERRORS", formulaErrors.ndjson);
console.log("TRACE_DASHBOARD_G17", JSON.stringify(workbook.trace("Dashboard!G17")).slice(0, 3000));
const xlsx = await SpreadsheetFile.exportXlsx(workbook);
await xlsx.save(xlsxPath);

// CSV indicator system
const csvRows = [["metric_id", "layer", "metric", "current_value", "unit", "threshold_id", "yellow", "red", "status", "frequency", "formula_or_definition", "source", "judgement_note"]];
for (const m of latestMetrics) {
  const t = thresholds.find((x) => x.id === m.threshold);
  const tree = metricTree.find((x) => x[2] === m.metric || m.metric.includes(x[2]));
  csvRows.push([m.id, m.layer, m.metric, m.value, m.unit, m.threshold ?? "", t?.yellow ?? "", t?.red ?? "", m.status, tree?.[5] ?? "季/年", m.note, m.source, t ? assumption(`${t.metric}黄线${t.yellow}${t.unit}、红线${t.red}${t.unit}`, t.rationale, "决定预警颜色与专题触发") : "监控指标，不单独设阈值"]);
}
await fs.writeFile(csvPath, csvRows.map((r) => r.map(esc).join(",")).join("\n") + "\n", "utf8");

const qInputs = `${S.Q25}；${S.Q26}`;
const industryInputs = `${S.IND25}；${S.IND26}`;
const stageInputs = `${S.SEG24}；${S.SEG25}；${S.L25B}；${S.L25A}`;
const thresholdAssumption = assumption("报告采用工作簿Thresholds表中的黄线、红线和专题触发规则", "100%承保盈亏线、公司可比历史、同业差与阶段3结构测算", "阈值用于管理预警，不作为监管标准或行业统一标准");
const actionAssumption = assumption("90天动作使用方向性效果和可复核指标，不承诺精确利润或COR改善百分点", "公开数据没有经营动作对结果的弹性系数", "行动成效用信号退回黄线/绿线、恶化停止和桥接勾稽完成验收");

const reportMd = `# 平安产险经营分析报告

## 常态指标体系

我采用一条从经营动作走到最终利润的链条。保费增长先拆数量、价格和业务结构。综合成本率随后拆成赔付率与费用率，再向下看频次、案均赔款和分险种COR。承保利润把比率变化换成金额。最后加上投资收益及其他损益，检查改善有没有传到净利润。

公开材料可以持续更新签单保费、车均保费、COR、赔付率、费用率、净利润、分险种收入和承保结果。出险频次、案均赔款、渠道费用和准备金发展缺少连续公开分拆，报告把它们列入公司内部下钻字段，不填入任何未经披露的数。

${thresholdAssumption}

### 我对阈值的判断

100%先作为承保盈亏线。整体COR达到100%，继续等待同业数据没有意义。整体黄线放在98%，留出两个百分点的处置窗口。

车险红线放在99%。车险占主体，需要给责任险等波动更大的业务留下缓冲。核心非车跨过100%就直接标红。责任险的黄线和红线定在103%与105%，原因来自它从2024年的102.7%升到2025年的106.8%。出处见${S.SEG24}；${S.SEG25}。

同比变化达到0.5个百分点先标黄，达到1个百分点标红。同业差只负责校正共同环境，不能代替绝对盈亏线。保证险贡献超过整体改善的一半时标红，因为这已经足以改变对普遍经营能力的判断。新能源结构拖累上限达到0.30个百分点时进入情景红灯，因为它与平安2024→2025相对同业的0.30个百分点超额改善处在同一数量级。

## 体系发现的异常

2026Q1签单保费同比${tag(`${fmt(calc.signedGrowth * 100, 2)}%`, `(${fmt(raw.q26.signed, 6)}/${fmt(raw.q25.signed, 6)}-1)×100`, qInputs)}。同期行业财产险原保险保费收入同比${tag(`${fmt(calc.industryGrowth * 100, 2)}%`, `(${fmt(raw.industry.mar26, 2)}/${fmt(raw.industry.mar25, 2)}-1)×100`, industryInputs)}。两套统计口径不同，只能作方向参照。平安并没有规模落后信号。

车险内部出现量价分化。车险签单保费同比${tag(`${fmt(calc.autoSignedGrowth * 100, 2)}%`, `(${fmt(raw.q26.autoSigned, 6)}/${fmt(raw.q25.autoSigned, 6)}-1)×100`, qInputs)}，车均保费同比${tag(`${fmt(calc.avgPremiumGrowth * 100, 2)}%`, `(${raw.q26.avgPremium}/${raw.q25.avgPremium}-1)×100`, qInputs)}。用签单保费除以车均保费得到的隐含车辆数同比${tag(`${fmt(calc.volumeGrowth * 100, 2)}%`, `[(56664.100758×1,000,000/2757)/(56950.864116×1,000,000/2817)-1]×100`, qInputs)}。数量仍在增加，价格或车型、渠道结构把增长抵消了一部分。

整体COR为94.9%，出处见${S.Q26}。它仍在绿区。赔付率同比恶化${tag(`${fmt(calc.lossChange, 2)}个百分点`, `${raw.q26.loss}%-${raw.q25.loss}%`, qInputs)}，费用率同比改善${tag(`${fmt(-calc.expenseChange, 2)}个百分点`, `${raw.q25.expense}%-${raw.q26.expense}%`, qInputs)}。费用下降继续支持整体结果，赔付端已经出现黄灯。

净利润同比${tag(`${fmt(calc.netProfitGrowth * 100, 2)}%`, `(${fmt(raw.q26.netProfit, 6)}/${fmt(raw.q25.netProfit, 6)}-1)×100`, qInputs)}，落入黄区。年度结果给出同一方向的提醒。2024→2025承保利润同比${tag(`${fmt(calc.underwritingGrowth * 100, 2)}%`, `(${raw.annual25.underwritingProfit}/${raw.annual24.underwritingProfit}-1)×100`, `${S.A24}；${S.A25}`)}，总投资收益同比${tag(`${fmt(calc.investmentGrowth * 100, 2)}%`, `(${raw.annual25.investmentIncome}/${raw.annual24.investmentIncome}-1)×100`, `${S.A24}；${S.A25}`)}，净利润同比${tag(`${fmt(calc.annualNetGrowth * 100, 2)}%`, `(${raw.annual25.netProfit}/${raw.annual24.netProfit}-1)×100`, `${S.A24}；${S.A25}`)}。承保利润改善没有按相同方向传到最终利润，投资层必须留在监控链条里。

## 触发的专题

核心非车先触发。2025核心非车COR为${tag(`${fmt(raw.specials.coreNonautoCor, 4)}%`, `(1-核心非车承保利润/核心非车保险服务收入)×100`, stageInputs)}，已经跨过承保盈亏线。责任险COR为106.8%，出处见${S.SEG25}。这两项共同指向非车亏损单元，不能靠整体COR遮住。

保证险继续单列。2023→2025保证险占整体COR改善贡献${tag(`${fmt(raw.specials.guaranteeReliance, 3)}%`, `保证险贡献2.798393/整体改善3.826652×100`, `${S.L23}；${S.L25A}；${S.SEG25}`)}。这项贡献已经超过红线。后续报告应固定同时展示整体COR与剔除保证险COR。

新能源专题使用情景红灯。用户确认的COR差区间对应2024→2025结构拖累上限${tag(`${fmt(raw.specials.nevMaxDrag, 4)}个百分点`, `新能源占比提升5.8737%×COR差上限5.44pp`, S.EV)}。它是一项敏感性边界，没有冒充实测分项COR。这个上限足以抵消最新年度相对同业的改善，因此车型和维修成本需要提前进入月度管理。

## 对核心问题的判断

平安这轮改善里，行业共同费用压降占了很重要的位置。三家公司费用率同步下降支持这一点。平安从同业落后走到领先，差异主要出在赔付端，保证险贡献又解释了其中很大一块。现有公开数据无法把剩余部分全部认定为可持续的自身能力。

可重复的部分来自费用管理、风险筛选和车险经营效率。阶段性部分包括保证险从亏损转为盈利及费用水平重置。新能源结构成本、核心非车亏损和投资收益波动会继续消耗改善。最新年度平安相对同业只多改善0.30个百分点，后续不能照搬2023→2024的速度。

## 未来90天的经营动作

${actions.map((a) => `### ${a[1]}　${a[2]}\n\n${a[3]}\n\n验收看${a[4]}。预期影响是${a[5]}。`).join("\n\n")}

${actionAssumption}

## 口径边界

2022旧准则原报数据没有接入趋势。2022R只使用2023年报中的IFRS 17重述比较期。季度偿付能力口径、集团年报IFRS 17口径和行业监管统计口径分开展示。行业月度保费只作方向参照，不与公司签单保费做精确份额计算。
`;
await fs.writeFile(reportMdPath, reportMd, "utf8");

const dataMd = `# 阶段4指标体系说明

对应工作簿为阶段4_指标体系与预警.xlsx，对应CSV为阶段4_指标体系.csv。

阈值由用户于2026-08-16授权AI判断。判断顺序采用承保盈亏线、趋势变化、同业校正和专题结构风险。阈值不是监管标准，也不是声称存在统一行业标准。

${thresholdAssumption}

专题触发规则为任一红灯立即触发、同一指标连续两期黄灯触发、同期两个关联指标黄灯触发。新能源红灯标记为情景红灯，避免把敏感性上限写成实测结果。
`;
await fs.writeFile(dataMdPath, dataMd, "utf8");

const statusClass = (s) => s.includes("RED") ? "red" : s === "YELLOW" ? "yellow" : "green";
const metricRowsHtml = latestMetrics.map((m) => `<tr><td>${m.layer}</td><td>${m.metric}</td><td>${fmt(m.value, m.unit === "pp" ? 2 : 2)}${m.unit}</td><td><span class="badge ${statusClass(m.status)}">${m.status}</span></td><td>${m.note}</td></tr>`).join("");
const thresholdRowsHtml = thresholds.map((t) => `<tr><td>${t.metric}</td><td>${t.yellow}${t.unit}</td><td>${t.red}${t.unit}</td><td>${t.rationale}</td></tr>`).join("");
const actionRowsHtml = actions.map((a) => `<tr><td>${a[1]}</td><td>${a[2]}</td><td>${a[3]}</td><td>${a[4]}</td><td>${a[5]}</td></tr>`).join("");
const mdToHtmlText = reportMd
  .replace(/^# .*$/gm, "")
  .replace(/^## (.*)$/gm, "<h2>$1</h2>")
  .replace(/^### (.*)$/gm, "<h3>$1</h3>")
  .split(/\n\n+/)
  .map((p) => p.startsWith("<h") ? p : `<p>${p.replaceAll("\n", "<br>")}</p>`)
  .join("\n");
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>平安产险经营分析报告</title><style>
body{margin:0;background:#f4f7fb;color:#1f2937;font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;line-height:1.75}.wrap{max-width:1180px;margin:0 auto;padding:36px 28px 72px}.hero{background:#17365d;color:#fff;padding:34px 40px;border-radius:14px}.hero h1{margin:0 0 10px;font-size:32px}.hero p{margin:0;color:#dbeafe}.callout{margin:24px 0;padding:20px 24px;background:#fff2cc;border-left:5px solid #bf9000;border-radius:8px}.section{background:#fff;margin-top:22px;padding:28px 34px;border-radius:12px;box-shadow:0 4px 20px rgba(23,54,93,.06)}h2{color:#17365d;margin:0 0 18px;font-size:24px}h3{color:#1f4e78;margin-top:26px}table{width:100%;border-collapse:collapse;margin:16px 0;font-size:14px}th{background:#1f4e78;color:#fff;text-align:left;padding:10px}td{border-bottom:1px solid #d9e2f3;padding:10px;vertical-align:top}.badge{display:inline-block;padding:2px 9px;border-radius:999px;font-weight:700;font-size:12px}.green{background:#e2f0d9;color:#008000}.yellow{background:#fff2cc;color:#8a6500}.red{background:#fce4d6;color:#c00000}.small{font-size:12px;color:#667085}.source{word-break:break-all;color:#475467}p{margin:12px 0}.assumption{background:#fff8dc;border:1px solid #e5c95b;padding:14px;border-radius:8px}
</style></head><body><div class="wrap"><div class="hero"><h1>平安产险经营分析报告</h1><p>公开数据与AI工作流　更新至2026Q1</p></div><div class="callout">我的判断采用承保盈亏线、趋势恶化和同业校正三层规则。阈值服务经营管理，不冒充监管标准或统一行业标准。</div><div class="section"><h2>当前预警面板</h2><table><thead><tr><th>层级</th><th>指标</th><th>当前值</th><th>状态</th><th>说明</th></tr></thead><tbody>${metricRowsHtml}</tbody></table></div><div class="section"><h2>管理阈值与理由</h2><table><thead><tr><th>指标</th><th>黄线</th><th>红线</th><th>判断理由</th></tr></thead><tbody>${thresholdRowsHtml}</tbody></table><p class="assumption">${thresholdAssumption}</p></div><div class="section">${mdToHtmlText}</div><div class="section"><h2>未来90天动作表</h2><table><thead><tr><th>时间</th><th>对象</th><th>动作</th><th>验收指标</th><th>预期影响</th></tr></thead><tbody>${actionRowsHtml}</tbody></table></div><div class="section small"><h2>主要来源</h2><p class="source">${Object.values(S).join("<br>")}</p></div></div></body></html>`;
await fs.writeFile(reportHtmlPath, html, "utf8");

console.log(JSON.stringify({ xlsxPath, csvPath, dataMdPath, reportMdPath, reportHtmlPath, alerts: latestMetrics.map((m) => [m.metric, m.status]) }, null, 2));
