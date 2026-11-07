# 研究依据 · References

> 「自然急」里出现的每一个科学说法，都应该能追到一篇真实文献。
> 这份清单按「我们用到了什么」整理，**不编造引用**；把握不足的地方会明确标成「经验值 / 相关研究」。

## 1. 首段无中断睡眠（FUSP）与睡眠质量

- **Increases in duration of first uninterrupted sleep period are associated with improvements in PSQI-measured sleep quality**
  Bliwise DL, Holm-Larsen T, et al. *Sleep Medicine*, 2014.
  [PMC4170006](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4170006/) · [ScienceDirect](https://www.sciencedirect.com/science/article/abs/pii/S1389945714002445)
- **用法**：FUSP 是「从入睡到第一次起夜」的时长，是临床在用的指标；把它拉长，与 PSQI 睡眠质量改善相关。
- **边界**：相关不等于因果；我们只把它当作「一个值得优化的量」，不做医学判断。

## 2. 25 万可穿戴用户的起夜与睡眠

- **Night-time voids, level of bother and sleep characteristics in a non-patient population of wearable devices users**
  *International Journal of Clinical Practice*, 2020（基于 Withings 可穿戴设备用户数据，Ferring 参与）。
  [PMC7317406](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7317406/) · [PubMed 32100396](https://pubmed.ncbi.nlm.nih.gov/32100396/)
- **用法**：非患者人群里，起夜 0–1 次的人 FUSP 约 243 分钟，3 次以上约 124 分钟 —— 说明「少起一次夜」对睡眠时长的影响是真实可测的。
- **边界**：可穿戴用户是自选择样本，不能直接外推到所有人；我们不承诺个人能精确命中。

## 3. 记录太麻烦，是放弃健康追踪的主因

- **Beyond Abandonment to Next Steps: Understanding and Designing for Life after Personal Informatics Tool Use**
  Epstein DA, Caraway M, Johnston C, Ping A, Fogarty J, Munson SA. *CHI 2016*.
  [DOI 10.1145/2858036.2858045](https://dl.acm.org/doi/abs/10.1145/2858036.2858045)
- **用法**：直接影响产品指标 —— 任何一笔记录必须 3 秒内完成（一键喝水 / 一键上厕所 / 拍张照）。
- **边界**：这是 HCI 的定性研究，不是「3 秒」这个具体数字的实验来源；3 秒是我们给自己定的工程约束。

## 4. 大模型估算餐食营养

- **NutriBench: A Dataset for Evaluating Large Language Models on Nutrition Estimation from Meal Descriptions**
  *ICLR 2025*.
  [arXiv:2407.12843](https://arxiv.org/abs/2407.12843) · [ICLR 2025](https://proceedings.iclr.cc/paper_files/paper/2025/hash/ef3a57e4f26b640e6f90d78cbb011feb-Abstract-Conference.html)
- **用法**：一句话 → 结构化餐食 + 热量估算，是当前模型已经能做得不错的事。
- **边界**：文字描述估热量仍有误差，所以每个数字都标「估算」，份量可手动调。

## 5. 照片估算的误差

- **An Evaluation of ChatGPT for Nutrient Content Estimation from Meal Photographs**
  *2025*. [PubMed 40004936](https://pubmed.ncbi.nlm.nih.gov/40004936/)
- **用法**：照片识别只作为「少打字」的入口，结果一定是「估算 + 可修改」，不做精确承诺。
- **边界**：照片估算受拍摄角度、遮挡、份量影响很大；没有视觉模型时，产品直接降级为「写个名字再用文字估」，不编造识别结果。

## 6. 起夜 / 夜尿的临床定义

- **ICS Standardisation of Terminology in Nocturia**（国际尿控学会，2023 标准文件）
  [ICS Standards 2023 (PDF)](https://www.ics.org/Publications/ICS%20Standards%202023.pdf)
- **用法**：夜里「抗利尿激素升高、产尿变慢」、夜间尿量占比、夜尿指数等概念，按 ICS 的定义来理解。
- **边界**：产品不是诊断工具，不输出「夜尿症」之类的判断。

## 7. 昼夜节律与夜尿

- **Disruption of circadian rhythm as a potential pathogenesis of nocturia**（综述）
  [PubMed 39543359](https://pubmed.ncbi.nlm.nih.gov/39543359/)
- **用法**：解释「为什么夜里产尿会变慢」「为什么咖啡因/酒精会打乱这个节奏」。
- **边界**：机制研究，不等于对每个人都成立。

## 8. 一个人也能做实验（N-of-1）

- **StudyMe: a new mobile app for user-centric N-of-1 trials**
  *Trials*, 2022. [PMC9793632](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9793632/)
- **用法**：个人模型每早根据反馈重新拟合 —— 一个人、多晚、自己和自己对照，就是最小规模的 N-of-1 实验。

## 9. 对标产品：它们都比你多带一件硬件

- **DFree** —— 超声膀胱传感器，预测「该去厕所了」。
  [Toilet-timing wearable 研究（KU Leuven）](https://lirias.kuleuven.be/retrieve/8888ea9d-7e86-4889-a3f0-d6a221a6015b) · [ICS 2020 摘要](https://www.ics.org/2020/abstract/182)
- **Withings U-Scan** —— 马桶内的尿液检测硬件。
  [产品页](https://www.withings.com/nz/en/u-scan) · [FAQ](https://support.withings.com/hc/fr/articles/11656375182097-U-Scan-FAQ-Foire-aux-questions)
- **用法**：它们都在解决「起夜 / 排尿」的一小段；「自然急」不做硬件，第一次把**喝水、上厕所、醒来**放在同一条时间线上。

## 10. 水负荷后的利尿时间窗（经验值）

- 大量饮水后约 30–60 分钟开始利尿、约 2 小时达到高峰，是生理学教材里的常见经验描述，**个体差异很大**，我们没有把它当作严格引用的实验结论。
  可参考水代谢生理教材章节：[Regulation of Water Output (JoVE)](https://www.jove.com/pt/science-education/v/16270/regulation-of-water-output)
- **用法**：只用于解释「为什么睡前喝水会在几小时后把人叫醒」，不作为精确预测公式。

---

## 引用原则

1. 宁可少引，不编造；不确定的结论标成「经验值」或「相关研究」。
2. 每一条都给出可点击链接，方便核验。
3. 产品里的所有数字都标「估算」，医学相关内容都写明「不替代医生」。
