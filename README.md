<div align="center">

<img src="docs/preview/hero.png" alt="自然急 Peeclock" width="88%">

# 自然急 · Peeclock

白天记吃喝拉撒，睡前倒一杯水，第二天早上看身体和闹钟谁先到。

[在线体验](https://cx.syal.site) · [科学依据](docs/REFERENCES.md) · [预览图](docs/preview) · [本地运行](#本地运行)

![Node](https://img.shields.io/badge/Node-%E2%89%A518-3c873a?style=flat-square)
![依赖](https://img.shields.io/badge/%E4%BE%9D%E8%B5%96-0-1d1c1a?style=flat-square)
![端](https://img.shields.io/badge/%E7%A7%BB%E5%8A%A8%E7%AB%AF-%E4%BC%98%E5%85%88-8B867E?style=flat-square)

</div>

---

闹钟响之前，身体先醒了。

这个经验很老，也有点不好意思讲：睡前多喝一杯水，到点了身体自己会叫你。自然急把它做成了一支能调的闹钟——喝多少、几点睡、想几点醒都由你定，每晚的反馈再让它更了解你一点。

它同时也是一个很轻的健康记录工具：吃了什么、喝了多少、动了多久、去了几趟厕所，都只要点一下。白天不占时间，晚上才轮到真正好玩的部分。

## 预览

截图用的是演示数据，真实使用中所有记录都来自你自己。

<table>
  <tr>
    <td align="center" width="33%"><img src="docs/preview/home.png" alt="今天"><br><sub>今天 · 倾斜手机，杯子里的水会跟着晃</sub></td>
    <td align="center" width="33%"><img src="docs/preview/tonight.png" alt="今晚"><br><sub>今晚 · 拖一下杯子，看几点会被叫醒</sub></td>
    <td align="center" width="33%"><img src="docs/preview/review.png" alt="回顾"><br><sub>回顾 · 误差曲线、21 夜校准、排行榜</sub></td>
  </tr>
</table>

<p align="center">
  <img src="docs/preview/share.png" alt="对决卡" width="290">
  <br><sub>早晨的对决卡，可以直接发给朋友</sub>
</p>

## 每天怎么用

1. 白天喝一杯点一下，去了一趟点一下；吃饭拍张照，认出来之后估个热量，份量可以改。
2. 睡前上下拖杯子，决定今晚喝多少。表盘会告诉你大概几点会被身体叫醒，顺便提醒你定好备用闹钟。
3. 早上 App 只问一句：谁叫醒了你。身体、闹钟、自己，还是半夜被叫醒。
4. 生成一张对决卡，比如身体 06:49、闹钟 07:00，身体赢了 11 分钟。发出去，朋友点开就能一起玩。
5. 回顾页里是每晚的误差、命中次数、称号，以及 21 夜校准计划。

## 几个刻意的设计

**记录只留三个动作。** HCI 的研究里，记录太麻烦是人们放弃健康追踪的主要原因之一（[Epstein et al., 2016](docs/REFERENCES.md)）。所以主界面只有「喝一杯」「去了一趟」「其他」，任何一笔记录都控制在三秒内完成。

**预测交给个人模型，AI 只做小修正。** 每个人对水的反应差别很大，固定公式一定不准。我们让每个人有一个两参数的个人模型，从文献先验出发，用你自己的夜晚数据拟合；大模型只根据傍晚的咖啡因、酒精和最近几晚的情况，在正负 20 分钟里做微调。这样预测稳定、可解释，也不会今天一个说法明天一个说法。

**不需要任何硬件。** DFree 要贴超声传感器，Withings U-Scan 要买尿检设备，它们都在解决「起夜」的一小段。自然急只用手机浏览器，把喝水、上厕所、醒来放在同一条时间线上。

**分享的是一场比赛。** 比起「今天喝了 1800 毫升」，人们更愿意发「我的身体比闹钟早醒了 11 分钟」。这是它作为产品最不像工具的地方，也是传播的入口。

## 科学依据

| 产品里的说法 | 依据 |
| --- | --- |
| 首段睡眠（入睡到第一次起夜）和睡眠质量相关 | [Bliwise et al., Sleep Medicine 2014](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4170006/) |
| 少起一次夜，睡眠明显变长 | [25 万可穿戴用户研究, Int J Clin Pract 2020](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC7317406/) |
| 记录太麻烦会让人放弃健康追踪 | [Epstein et al., CHI 2016](https://dl.acm.org/doi/abs/10.1145/2858036.2858045) |
| 大模型能较快估算餐食营养 | [NutriBench, ICLR 2025](https://arxiv.org/abs/2407.12843) |
| 照片估算存在误差 | [ChatGPT 餐食照片评估, 2025](https://pubmed.ncbi.nlm.nih.gov/40004936/) |
| 夜尿、夜间产尿有临床定义 | [ICS Standards 2023](https://www.ics.org/Publications/ICS%20Standards%202023.pdf) |
| 昼夜节律影响夜间产尿 | [Nocturia 机制综述](https://pubmed.ncbi.nlm.nih.gov/39543359/) |
| 一个人也可以做多夜对照实验 | [StudyMe, Trials 2022](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9793632/) |

这些文献支持的是方向和机制，不足以证明「自然急对每个人都准」。所以产品只给区间，不承诺精确，并且始终保留备用闹钟。完整的引用、链接和适用范围都放在 [docs/REFERENCES.md](docs/REFERENCES.md)。

## 个人模型怎么进化

每个人对水的反应不一样，所以这里没有统一公式，而是每晚重新拟合：

```text
首段睡眠时长 ≈ a − b × 睡前饮水(ml)
```

从文献先验出发，a = 460 分钟，b = 0.075 分钟/毫升，也就是多喝 100 毫升大约早醒 7.5 分钟。夜数少的时候贴近先验，夜数多了就越来越像你自己。

早上的回答决定这一晚的权重：

- 身体叫醒：权重 1，一次完整观测。
- 半夜被叫醒：权重 0.6，第二晚建议的水量自动减 100 毫升。
- 闹钟先响：权重 0.4，当作不完整观测，第二晚建议多喝 50 毫升。
- 自己醒：权重 0.4，同样按不完整观测处理。

## 安全边界

- 睡前两小时饮水硬上限 800 毫升，到顶就不能再加。
- 始终保留系统闹钟，App 会反复提醒你定好。
- 常起夜、孕期、有肾脏或心血管疾病、在服利尿药的人，默认关闭夜间挑战，只保留记录功能。
- 连续翻车会提示暂停，不硬撑。
- 不做医学判断，不推荐药物。AI 连不上时如实提示，不用规则或随机数编结果。

## 技术实现

```text
public/index.html        单文件前端：Canvas 液态杯、陀螺仪、拖动、三视图、自动演示
server.js                零依赖 Node 服务：静态页 + /api/*、个人模型拟合、大模型调用
data/db.json             运行时生成，存夜间记录、分享和昵称（不进仓库）
docs/REFERENCES.md       文献与适用范围
docs/preview/            预览截图
```

- 后端零依赖，`node server.js` 就能跑，没有 `npm install`。
- 模型调用兼容 OpenAI `/chat/completions` 和 Anthropic `/messages`，优先用工具调用拿结构化 JSON，不支持时自动退回「只输出 JSON」。
- 密钥只在服务端，前端拿不到。
- 当天记录存在手机本地，夜间记录、个人模型、排行榜和分享页存在服务器。
- 只有点「自动演示」时才用虚拟数据，演示过程不写入任何真实记录。

## 本地运行

```bash
# 需要 Node 18 或更高版本
cp .env.example .env
node server.js
```

打开 http://localhost:8787 。检查模型连通：

```bash
curl "http://localhost:8787/api/health?ping=1"
```

返回里 `llm` 是对象就说明工具调用正常；是一段报错，就按报错改 `.env`。

## 部署

当前线上版本跑在一台 Ubuntu 小机器上：

| 项 | 值 |
| --- | --- |
| 地址 | https://cx.syal.site |
| 目录 | `/opt/ziranji`，独立用户运行 |
| 进程 | systemd，`Restart=always`，内存上限 256M |
| 数据 | `/opt/ziranji/data/db.json`，SIGTERM 时先落盘再退出 |
| 反向代理 | nginx，源站 HTTPS 证书用 Let's Encrypt 自动续期 |

```bash
sudo systemctl status ziranji
sudo journalctl -u ziranji -f
curl -s "https://cx.syal.site/api/health?ping=1"
```

手机上的陀螺仪需要 HTTPS，iOS 还需要用户点一下授权。放在 nginx 或 Caddy 后面做 TLS 即可。

## 接口

| 方法 | 路径 | 作用 |
| --- | --- | --- |
| GET | `/api/health?ping=1` | 配置与模型连通检查 |
| POST | `/api/parse` | 一句话转成一条记录 |
| POST | `/api/photo` | 照片识别食物或饮品，估算热量 |
| POST | `/api/night` | 今晚建议：个人模型加 AI 微调 |
| POST | `/api/morning` | 早晨反馈：存一晚、重新拟合、生成对决卡 |
| GET | `/api/me?uid=` | 我的夜间记录、称号、模型参数 |
| POST | `/api/nick` | 修改排行榜昵称 |
| GET | `/api/board` | 排行榜 |
| GET | `/s/:id` | 对决卡分享页 |

## 已知限制

- 个体差异很大，预测只给区间，不承诺准确。
- 照片估热量有误差；服务商没有视觉模型时会降级成「写个名字，再用文字估」。
- 起夜和夜尿涉及健康问题，产品只做生活参考，不能替代医生。
- 存储是单机 JSON 文件，适合比赛演示和小规模使用。要上量需要换数据库和任务队列。

## 参考

所有引用、链接和适用范围见 [docs/REFERENCES.md](docs/REFERENCES.md)。宁可少引，不编造；把握不足的结论会标成经验值或相关研究。

---

<p align="center">
  <b>自然急，自然醒的进阶版。</b><br>
  <sub>白天是一个三秒就能记完的健康小工具，晚上是一个有依据、越用越懂你的身体闹钟。</sub>
</p>
