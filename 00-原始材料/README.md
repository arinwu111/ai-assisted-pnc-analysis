# 00-原始材料

本目录在仓库中**不含 PDF 与 Excel 原件**，只保留一份清单。

原因有两条。一是这 125 份文件约 225 MB，放进 Git 会让仓库无法正常克隆；二是年报、偿付能力报告、监管统计表虽然公开可得，但版权属于各披露主体，转发副本和引用数据不是一回事。

## 清单

`原始材料清单.csv`，四列：文件名、类别、字节数、sha256。

自己下载之后可以逐个核对哈希，确认拿到的和本报告用的是同一份文件：

```bash
shasum -a 256 中国平安_年报_2025.pdf
```

## 官方来源

| 类别 | 份数 | 官方页面 |
|---|---:|---|
| 中国平安集团定期报告 | 13 | https://www.pingan.cn/tc/ir/financial-report.shtml |
| 中国平安业绩推介材料 | 17 | https://group.pingan.com/investor_relations/results_and_presentations.html |
| 平安产险偿付能力季度报告 | 17 | https://property.pingan.com/gongkaixinxipilu/changfunenglixinxipilubaogao.shtml |
| 平安产险年度信息披露报告 | 8 | https://property.pingan.com/gongkaixinxipilu/nianduxinxipilubaogao.shtml |
| 人保财险定期报告 | 8 | https://property.picc.com.cn/tzzgx/gsbg/ |
| 中国太保定期报告 | 8 | https://www.cpic.com.cn/ir/gsbgytj/dqbg/ |
| 金融监管总局月度经营数据 | 54 | https://www.nfra.gov.cn/cn/view/pages/ItemListRightList.html?itemId=954 |

覆盖区间：定期报告 2022—2025 年报与中报，外加中国平安 2026Q1 季报；偿付能力季度报告 2022Q1—2026Q1；监管月表 2022-01—2026-06。

## 没有原件能不能跑

能跑大部分。从 PDF 提取出来的结构化数据已经固化在 `01-数据/` 的 CSV 和 `02-脚本/build_stage4_report_v2_data.py` 的常量里，所以生成报告那一步不需要原件。

需要原件的只有阶段 2 的取数与回查脚本（`build_stage2_data.py`、`verify_stage2_audit.py`），把下载好的文件按清单里的文件名放回本目录即可。详见根目录 README 的「复现」一节。
