# Interview Replay 最终操作流程说明（流程图输入版）

## 1. 文档用途

这份文档专门用于绘制“完整顺序流程图”。

它关注的是：

- 用户从进入系统到拿到报告的完整操作顺序；
- 每一步用户做什么；
- 前端在每一步保存什么状态；
- 后端在每一步调用什么 API；
- 哪些 Agent 在该阶段开始工作；
- 什么时候复用已有分析结果；
- 面试前模拟和面试后复盘两条分支如何分流；
- 最终报告如何展示和导出。

如果要画流程图，建议以本文件为主；如果要画系统架构图，建议参考 `FinalImplementationArchitecture.md`。

## 2. 总流程一览

完整产品流程可以概括为：

```text
进入首页
↓
填写面试背景
↓
输入或上传背景材料
↓
分析材料，生成证据库
↓
选择模式
├─ 面试前模拟
│  ↓
│  输入或生成面试问题
│  ↓
│  系统提前分析问题意图和期望证据
│  ↓
│  用户进行限时临场回答
│  ↓
│  用户补充冷静回答
│  ↓
│  开始最终评审
│  ↓
│  多 Agent 复盘
│  ↓
│  输出面试前复盘报告
│
└─ 面试后复盘
   ↓
   输入真实面试问题
   ↓
   系统提前分析问题意图和期望证据
   ↓
   输入多个回答版本
   ↓
   开始最终评审
   ↓
   多 Agent 复盘
   ↓
   输出面试后复盘报告
```

## 3. 阶段 0：进入系统

### 用户动作

用户打开 Interview Replay 首页。

### 前端状态

前端从浏览器 localStorage 中读取：

- 面试类型；
- 目标方向；
- 目标院校；
- 背景材料；
- 已上传文件；
- 已有材料分析结果；
- 已有问题分析结果。

### 系统判断

系统判断当前是否已经有可用材料分析：

```text
如果 localStorage 中没有材料分析
→ 首页显示“等待分析材料”

如果 localStorage 中有材料分析，且材料没有变化
→ 首页显示“材料分析完成”

如果 localStorage 中有材料分析，但用户修改过材料
→ 首页提示“材料已变化，需要重新分析”
```

### 流程图节点建议

- 开始
- 读取本地上下文
- 判断是否已有有效材料分析

## 4. 阶段 1：填写背景信息和材料

### 用户动作

用户在首页填写：

- 面试类型；
- 目标方向；
- 目标院校；
- 背景材料。

用户也可以上传材料文件，并给文件添加标签。

### 前端动作

前端会把用户输入保存到 localStorage。

如果用户上传文件：

```text
用户选择文件
↓
前端请求文件解析 API
↓
后端返回文件文本
↓
前端把文件名、标签、文本内容保存到 localStorage
```

最终，前端会把两类材料合并成完整材料：

```text
完整材料 = 手写背景材料 + 已上传文件文本
```

### 系统判断

如果完整材料为空：

```text
不能进入有效材料分析
```

如果完整材料不为空：

```text
允许点击“分析材料”
```

### 流程图节点建议

- 填写面试背景
- 输入背景材料
- 上传文件，可选
- 合并完整材料
- 判断材料是否为空

## 5. 阶段 2：材料分析，生成证据库

### 用户动作

用户点击首页的“分析材料”。

### 前端动作

前端发起请求：

```text
POST /api/agents/material
```

请求携带：

- backgroundMaterials；
- targetDirection；
- targetSchool。

### 后端动作

后端执行：

```text
校验请求
↓
调用 Material Analyst
↓
提取 Evidence Cards
↓
生成材料 fingerprint
↓
组装 MaterialPreAnalysis
↓
返回前端
```

### Agent 工作

此阶段启动：

- Material Analyst。

Material Analyst 的输出包括：

- 材料证据卡；
- 每张证据卡可支持的问题；
- 体现的能力；
- 可能追问；
- 使用风险；
- 建议表达；
- 缺失信息；
- 材料摘要。

### 前端保存

前端把返回结果保存为：

```text
MaterialPreAnalysis
├─ evidenceCards
├─ summary
├─ inputFingerprint
└─ agentTrace
```

### 成功分支

```text
材料分析成功
↓
保存证据库
↓
首页显示证据卡数量
↓
允许进入面试前模拟或面试后复盘
```

### 失败分支

```text
材料分析失败
↓
显示错误信息
↓
用户可以修改材料后重试
```

### 流程图节点建议

- 点击分析材料
- 请求材料预分析 API
- Material Analyst
- 生成材料证据库
- 保存 MaterialPreAnalysis
- 材料分析成功？

## 6. 阶段 3：选择模式

### 用户动作

用户在首页选择一种模式：

- 面试前模拟；
- 面试后复盘。

### 系统分流

```text
如果选择面试前模拟
→ 进入 /pre

如果选择面试后复盘
→ 进入 /post
```

### 共同前置条件

两种模式都优先复用首页生成的材料分析结果。

如果用户没有提前分析材料：

```text
仍可进入页面
但最终复盘阶段 Runner 会自动补跑 Material Analyst
```

### 流程图节点建议

- 选择模式
- 分支：面试前模拟
- 分支：面试后复盘

## 7. 面试前模拟完整流程

## 7.1 进入面试前页面

### 用户动作

用户进入面试前模拟页面。

### 前端动作

前端读取：

- 面试背景；
- 完整材料；
- 材料预分析结果；
- 历史问题预分析结果。

侧边栏显示当前已完成的 Agent 阶段：

```text
如果已有材料分析
→ 材料分析器显示已完成

如果没有材料分析
→ 材料分析器显示待命
```

### 流程图节点建议

- 进入面试前页面
- 读取材料上下文
- 显示 Agent 侧边栏状态

## 7.2 输入或生成面试问题

### 用户动作

用户可以：

- 手动输入面试问题；
- 点击生成练习问题。

如果用户点击生成练习问题：

```text
前端请求问题生成 API
↓
后端根据材料和方向生成一个练习问题
↓
问题填入页面
```

### 系统判断

当问题存在且材料分析结果存在时，系统可以提前进行问题分析。

### 流程图节点建议

- 输入问题
- 或生成练习问题
- 判断问题是否为空
- 判断是否已有材料分析

## 7.3 问题预分析

### 触发时机

用户确定问题后，前端自动或半自动触发问题预分析。

### 前端动作

前端生成问题缓存 key，并判断：

```text
如果已有同一问题 + 同一材料 fingerprint 的 QuestionPreAnalysis
→ 直接复用本地问题分析

如果没有可复用结果
→ 请求问题规划 API
```

### API 请求

```text
POST /api/agents/question-plan
```

请求携带：

- question；
- interviewType；
- targetDirection；
- targetSchool；
- evidenceCards；
- materialFingerprint。

### 后端动作

```text
校验问题
↓
Question Intent Analyst 分析问题真实意图
↓
Evidence Planner 规划这道题应调用的材料证据
↓
生成问题 fingerprint
↓
返回 QuestionPreAnalysis
```

### Agent 工作

此阶段启动：

- Question Intent Analyst；
- Evidence Planner。

### 前端保存

前端保存：

```text
QuestionPreAnalysis
├─ questionIntent
├─ evaluationFocus
├─ idealAnswerLayers
├─ commonPitfalls
├─ expectedEvidence
├─ inputFingerprint
└─ agentTrace
```

### 流程图节点建议

- 检查问题预分析缓存
- 命中缓存？
- Question Intent Analyst
- Evidence Planner
- 保存 QuestionPreAnalysis

## 7.4 临场限时回答

### 用户动作

用户点击开始答题。

### 前端动作

前端进入限时答题状态：

```text
准备状态
↓
开始计时
↓
用户输入临场回答
↓
时间结束或用户手动锁定
↓
临场回答锁定
```

### 系统特点

此阶段不调用复盘 Agent。它模拟真实面试压力，记录用户在限时状态下的回答。

### 流程图节点建议

- 开始限时回答
- 计时中
- 用户输入临场回答
- 时间到或手动锁定
- 锁定临场回答

## 7.5 补充冷静回答

### 用户动作

临场回答锁定后，用户填写冷静回答。

冷静回答用于对比：

- 用户临场没有说出的内容；
- 用户冷静后能补上的证据；
- 用户表达逻辑的恢复情况。

### 系统判断

```text
如果临场回答为空
→ 不建议开始评审

如果冷静回答为空
→ 不建议开始评审

如果两者都存在
→ 可以开始最终评审
```

### 流程图节点建议

- 填写冷静回答
- 判断临场回答是否存在
- 判断冷静回答是否存在
- 允许开始评审

## 7.6 面试前最终评审

### 用户动作

用户点击“开始评审”。

### 前端动作

前端组装 PreReplayRequest：

```text
PreReplayRequest
├─ interviewType
├─ targetDirection
├─ targetSchool
├─ backgroundMaterials
├─ question
├─ liveAnswer
├─ calmAnswer
├─ materialAnalysis，可选
└─ questionPlan，可选
```

然后请求：

```text
POST /api/replay/pre
```

侧边栏在加载中显示：

```text
已完成的材料分析和问题分析保持完成状态
从后续诊断阶段继续显示进度
```

### 后端 Runner 顺序

后端执行完整面试前 Agent 链：

```text
1. 校验 PreReplayRequest
2. resolveMaterialAnalysis
   - 如果材料预分析 fingerprint 匹配，复用
   - 否则补跑 Material Analyst
3. resolveQuestionPlan
   - 如果问题预分析 fingerprint 匹配，复用
   - 否则补跑 Question Intent Analyst 和 Evidence Planner
4. Evidence Mapper
5. 并行运行：
   - Skeptical Professor
   - Gap Diagnoser
6. Answer Synthesizer
7. Verifier / Critic
8. 构建 Quality Summary 和 Answer Maturity
9. Training Planner
10. Report Composer
11. 返回 PreReplayReport 和 copyText
```

### 输出报告

面试前报告突出：

- 临场差距；
- 临场损失；
- 材料召回率；
- 风险；
- 最佳安全回答；
- 救场模板；
- 下一步练习建议；
- 复盘卡片。

### 流程图节点建议

- 点击开始评审
- 组装 PreReplayRequest
- 请求 `/api/replay/pre`
- 复用或补跑材料分析
- 复用或补跑问题分析
- Evidence Mapper
- 并行：Professor + Gap
- Synthesizer
- Verifier
- Training Planner
- Composer
- 返回 PreReplayReport

## 8. 面试后复盘完整流程

## 8.1 进入面试后页面

### 用户动作

用户进入面试后复盘页面。

### 前端动作

前端读取：

- 面试背景；
- 完整材料；
- 材料预分析结果；
- 历史问题预分析结果。

侧边栏显示已有 Agent 状态。

### 流程图节点建议

- 进入面试后页面
- 读取材料上下文
- 显示 Agent 侧边栏状态

## 8.2 输入真实面试问题

### 用户动作

用户输入真实面试中被问到的问题。

### 系统判断

当问题存在且材料分析结果存在时，系统进入问题预分析流程。

这一步和面试前模式相同：

```text
检查问题预分析缓存
↓
没有缓存则请求 /api/agents/question-plan
↓
Question Intent Analyst
↓
Evidence Planner
↓
保存 QuestionPreAnalysis
```

### 流程图节点建议

- 输入真实问题
- 检查问题分析缓存
- 问题意图分析
- 证据规划

## 8.3 输入多个回答版本

### 用户动作

用户输入多个回答版本，例如：

- 现场实际回答；
- 事后补充版本；
- 自己修改后的版本；
- 朋友或 AI 帮忙改写的版本。

### 前端动作

前端维护回答版本列表：

- 新增版本；
- 删除版本；
- 修改版本标签；
- 修改版本内容。

### 系统判断

```text
如果回答版本数量不足
→ 不建议开始评审

如果问题为空
→ 不建议开始评审

如果至少有可比较的回答版本
→ 可以开始最终评审
```

### 流程图节点建议

- 添加回答版本
- 编辑版本内容
- 判断版本数量是否足够
- 允许开始评审

## 8.4 面试后最终评审

### 用户动作

用户点击“开始评审”。

### 前端动作

前端组装 PostReplayRequest：

```text
PostReplayRequest
├─ question
├─ interviewContext
├─ targetDirection
├─ backgroundMaterials
├─ answers
├─ materialAnalysis，可选
└─ questionPlan，可选
```

然后请求：

```text
POST /api/replay/post
```

### 后端 Runner 顺序

后端执行完整面试后 Agent 链：

```text
1. 校验 PostReplayRequest
2. resolveMaterialAnalysis
   - 如果材料预分析 fingerprint 匹配，复用
   - 否则补跑 Material Analyst
3. resolveQuestionPlan
   - 如果问题预分析 fingerprint 匹配，复用
   - 否则补跑 Question Intent Analyst 和 Evidence Planner
4. Evidence Mapper
5. 并行运行：
   - Skeptical Professor
   - Diff Analyst
6. Answer Synthesizer
7. Verifier / Critic
8. 构建 Quality Summary 和 Answer Maturity
9. Training Planner
10. Report Composer
11. 返回 PostReplayReport 和 copyText
```

### 输出报告

面试后报告突出：

- 多版本回答排名；
- 各版本优缺点；
- 逐句诊断；
- 材料召回率；
- 风险；
- 最佳安全回答；
- 可迁移回答公式；
- 下一次面试清单；
- 复盘卡片。

### 流程图节点建议

- 点击开始评审
- 组装 PostReplayRequest
- 请求 `/api/replay/post`
- 复用或补跑材料分析
- 复用或补跑问题分析
- Evidence Mapper
- 并行：Professor + Diff
- Synthesizer
- Verifier
- Training Planner
- Composer
- 返回 PostReplayReport

## 9. 报告展示和导出流程

### 触发时机

当 `/api/replay/pre` 或 `/api/replay/post` 成功返回后，前端进入结果页状态。

### 前端展示顺序

报告展示按“先结论、后细节”的顺序：

```text
质量摘要
↓
最佳安全回答
↓
风险和压力测试
↓
材料召回与证据依据
↓
模式特有诊断
↓
训练建议和复盘卡片
↓
问题意图、材料证据库、Agent Trace
```

### 用户可操作动作

用户可以：

- 复制报告文本；
- 导出 Markdown；
- 展开或收起详细诊断区块；
- 查看多角色诊断链；
- 回到页面继续修改问题或回答后重新评审。

### 流程图节点建议

- 接收 ReplayReport
- 渲染质量摘要
- 渲染最佳安全回答
- 渲染风险与证据
- 渲染模式特有诊断
- 渲染训练建议
- 复制文本
- 导出 Markdown

## 10. 缓存复用流程

### 材料缓存复用

```text
最终评审提交
↓
后端计算当前材料 fingerprint
↓
判断前端传入的 MaterialPreAnalysis fingerprint 是否匹配
├─ 匹配：复用 evidenceCards
└─ 不匹配：重新运行 Material Analyst
```

### 问题缓存复用

```text
最终评审提交
↓
后端计算当前问题 fingerprint
↓
判断前端传入的 QuestionPreAnalysis fingerprint 是否匹配
├─ 匹配：复用 questionIntent 和 expectedEvidence
└─ 不匹配：重新运行 Question Intent Analyst + Evidence Planner
```

### 流程图节点建议

- 计算当前 fingerprint
- 判断缓存是否匹配
- 复用缓存
- 补跑 Agent

## 11. 异常和降级流程

### 11.1 必填字段缺失

```text
用户提交请求
↓
API 校验失败
↓
返回 VALIDATION_ERROR
↓
前端显示错误
↓
用户补充信息后重试
```

### 11.2 缺少 API Key

```text
用户触发 AI 分析
↓
后端读取服务端环境变量
↓
发现缺少 LLM API Key
↓
返回 MISSING_API_KEY
↓
前端显示服务端配置错误
```

### 11.3 模型调用失败

```text
Agent 调用 LLM
↓
模型请求失败
↓
返回 MODEL_REQUEST_FAILED
↓
前端提示稍后重试
```

### 11.4 非核心 Agent 失败

```text
最终复盘流程中
↓
Professor / Gap / Diff / Verifier 等 Agent 失败
↓
Runner 记录 failed trace
↓
使用空结果或安全兜底
↓
继续执行后续 Agent
↓
报告中保留可用部分
```

### 11.5 模型输出格式异常

```text
Agent 收到 LLM 输出
↓
JSON 解析或结构校验异常
↓
normalizer 尝试兜底
↓
如果仍失败，返回 MODEL_RESPONSE_INVALID 或记录 failed trace
```

## 12. Agent 状态展示流程

### 首页状态

```text
未分析材料
→ 材料分析器：待命

分析材料中
→ 材料分析器：运行中

分析完成
→ 材料分析器：已完成
```

### pre/post 页面状态

```text
已有材料分析
→ 材料分析器：已完成

问题分析中
→ 问题意图分析器 / 证据规划器：运行中

问题分析完成
→ 问题意图分析器 / 证据规划器：已完成
```

### 最终评审加载状态

```text
点击开始评审
↓
侧边栏保留已有完成状态
↓
从 Evidence Mapper 或后续诊断阶段继续动画
↓
等待最终报告返回
↓
使用真实 agentTrace 展示完整诊断链
```

### 注意事项

当前没有服务端流式进度推送。加载中的侧边栏是基于已有 trace 和预估阶段的视觉反馈；报告生成后的 AgentTracePanel 展示的是后端真实返回的执行记录。

## 13. 适合直接画图的主流程

如果只画一张完整大流程图，可以使用下面这个版本：

```text
开始
↓
进入首页
↓
读取 localStorage 上下文
↓
用户填写面试背景和材料
↓
是否上传文件？
├─ 是：解析文件文本 → 合并完整材料
└─ 否：直接使用输入材料
↓
用户点击分析材料
↓
Material Analyst 生成材料证据库
↓
保存 MaterialPreAnalysis
↓
用户选择模式
├─ 面试前模拟
│  ↓
│  输入或生成面试问题
│  ↓
│  是否已有有效 QuestionPreAnalysis？
│  ├─ 是：复用问题预分析
│  └─ 否：Question Intent Analyst → Evidence Planner
│  ↓
│  限时临场回答
│  ↓
│  锁定临场回答
│  ↓
│  填写冷静回答
│  ↓
│  提交 PreReplayRequest
│  ↓
│  复用或补跑材料/问题预分析
│  ↓
│  Evidence Mapper
│  ↓
│  Skeptical Professor || Gap Diagnoser
│  ↓
│  Answer Synthesizer
│  ↓
│  Verifier
│  ↓
│  Training Planner
│  ↓
│  Report Composer
│  ↓
│  展示面试前复盘报告
│
└─ 面试后复盘
   ↓
   输入真实面试问题
   ↓
   是否已有有效 QuestionPreAnalysis？
   ├─ 是：复用问题预分析
   └─ 否：Question Intent Analyst → Evidence Planner
   ↓
   输入多个回答版本
   ↓
   提交 PostReplayRequest
   ↓
   复用或补跑材料/问题预分析
   ↓
   Evidence Mapper
   ↓
   Skeptical Professor || Diff Analyst
   ↓
   Answer Synthesizer
   ↓
   Verifier
   ↓
   Training Planner
   ↓
   Report Composer
   ↓
   展示面试后复盘报告
↓
复制报告或导出 Markdown
↓
结束
```

## 14. 流程图绘制建议

### 14.1 推荐泳道

建议使用四条泳道：

- 用户；
- 前端页面；
- API / Runner；
- Agent。

这样可以清楚区分：

- 哪些步骤是用户操作；
- 哪些步骤是前端状态更新；
- 哪些步骤是后端请求；
- 哪些步骤是真正的 Agent 工作。

### 14.2 推荐颜色

如果绘图工具支持颜色，可以这样区分：

- 用户操作：蓝色；
- 前端状态：绿色；
- API 请求：橙色；
- Agent 推理：紫色；
- 判断分支：灰色；
- 错误/降级：红色。

### 14.3 推荐重点突出

流程图中最应该突出三个亮点：

1. 材料先行：用户确认材料后，Material Analyst 就开始工作，不等最终提交。
2. 问题先行：用户确定问题后，Question Intent Analyst 和 Evidence Planner 提前规划。
3. 最终复盘复用预分析：最终评审阶段直接复用前面结果，只补跑缺失或过期部分。

## 15. 一句话流程总结

Interview Replay 的完整操作流程是：用户先在首页建立材料证据库，再选择面试前或面试后模式；系统在问题确定后提前完成问题意图和证据规划，等用户提交回答后，再运行证据匹配、风险审查、差距/差异诊断、回答融合、安全校验和训练规划，最终生成一份可复制、可导出的结构化复盘报告。
