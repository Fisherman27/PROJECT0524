# Interview Replay 最终实现说明（架构图输入版）

## 1. 文档用途

这份文档用于把当前项目的最终实现形态讲清楚，方便之后交给大模型生成系统架构图、业务流程图、Agent 编排图或 Demo 讲解图。

它不描述具体代码细节，而是描述：

- 产品最终长什么样；
- 前端、后端、Agent、数据状态之间如何协作；
- 用户每一步操作会触发哪些模块；
- 不同 Agent 在什么阶段工作；
- 最终报告由哪些诊断结果组成；
- 当前实现的边界和不做内容。

## 2. 产品最终形态

Interview Replay 是一个面向保研、复试、夏令营、预推免面试场景的 AI 面试复盘工具。

产品不是单纯帮用户润色回答，而是围绕“用户自己的背景材料”做证据驱动的复盘。系统会先把用户材料拆成可复用的证据卡，再结合面试问题、临场回答、冷静回答或多个回答版本，生成一份结构化诊断报告。

当前最终形态包含三个主要入口：

- 首页材料工作台：用户输入或上传背景材料，系统提前运行材料分析，生成材料证据库。
- 面试前模拟：用户进入限时模拟答题，之后补充冷静回答，系统诊断临场损失并生成最佳安全回答。
- 面试后复盘：用户输入真实面试问题和多个回答版本，系统比较版本差异，找出最值得保留和需要规避的表达。

最终报告的核心价值是：

- 告诉用户这道题真正考什么；
- 判断回答有没有调用合适材料；
- 找出临场表达损失；
- 找出回答中的空泛、夸大、追问风险；
- 给出更稳妥的融合回答；
- 给出可复用的救场模板、回答公式、复盘卡片和下一步训练建议。

## 3. 总体系统架构

当前系统是一个 Next.js App Router 应用，前后端在同一个项目中实现。

建议架构图中画出五层：

1. 用户交互层
   - 首页材料工作台
   - 面试前模拟页
   - 面试后复盘页
   - 报告展示组件

2. 浏览器状态层
   - 背景材料上下文
   - 上传文件文本内容
   - 材料预分析结果
   - 问题预分析结果
   - Agent 执行状态展示
   - localStorage 持久化

3. API 路由层
   - 材料预分析 API
   - 问题规划 API
   - 面试前复盘 API
   - 面试后复盘 API
   - 文件解析 API
   - 示例问题生成 API

4. Agent 编排层
   - Material Analyst
   - Question Intent Analyst
   - Evidence Planner
   - Evidence Mapper
   - Skeptical Professor
   - Gap Diagnoser
   - Diff Analyst
   - Answer Synthesizer
   - Verifier / Critic
   - Training Planner
   - Report Composer

5. 模型与规范化层
   - 服务端 LLM Provider
   - JSON 输出解析
   - 输出 normalizer
   - copy / markdown 导出格式化

架构图可以这样表达：

```text
用户
↓
Next.js 前端页面
↓
浏览器上下文与 localStorage
↓
Next.js API Routes
↓
Agent Runner / 分阶段 Agent API
↓
LLM Provider
↓
结构化 Agent 输出
↓
Report Composer / Normalizer
↓
报告 UI / 复制 / Markdown 导出
```

## 4. 前端页面与用户路径

### 4.1 首页材料工作台

首页是用户进入系统后的准备工作台，不只是模式选择页。

首页承担这些任务：

- 输入面试类型、目标方向、目标院校；
- 输入背景材料；
- 上传补充材料文件；
- 合并用户手写材料和文件材料；
- 点击“分析材料”后调用材料预分析 API；
- 展示材料分析状态；
- 展示已生成的证据卡数量；
- 将材料分析结果保存到浏览器上下文；
- 引导用户进入面试前模拟或面试后复盘。

首页触发的核心链路：

```text
用户确认背景材料
↓
前端合并材料文本
↓
POST /api/agents/material
↓
Material Analyst 提取证据卡
↓
返回 MaterialPreAnalysis
↓
保存到 localStorage
↓
侧边栏显示材料分析完成
```

### 4.2 面试前模拟页

面试前模拟页用于训练“真实临场答题”和“冷静复盘后答题”的差距。

页面承担这些任务：

- 读取首页保存的背景材料和材料分析结果；
- 用户输入或生成一个面试问题；
- 问题确定后提前调用问题规划 API；
- 用户开始限时临场回答；
- 临场回答锁定后，用户填写冷静回答；
- 点击开始评审后提交最终复盘请求；
- 展示多 Agent 报告。

面试前模式的业务主线：

```text
背景材料
↓
面试问题
↓
临场限时回答
↓
冷静回答
↓
临场差距诊断
↓
最佳安全回答
↓
救场模板和训练建议
```

### 4.3 面试后复盘页

面试后复盘页用于复盘已经发生过的真实面试。

页面承担这些任务：

- 读取首页保存的背景材料和材料分析结果；
- 用户输入真实面试问题；
- 问题确定后提前调用问题规划 API；
- 用户输入多个回答版本；
- 点击开始评审后提交最终复盘请求；
- 展示多版本 Answer Diff、最佳融合回答、可迁移公式和复盘卡片。

面试后模式的业务主线：

```text
背景材料
↓
真实面试问题
↓
多个回答版本
↓
版本差异诊断
↓
最佳安全回答
↓
可迁移回答公式和下一次面试清单
```

## 5. 浏览器状态与缓存机制

当前项目没有引入数据库，也没有账号体系。用户上下文主要保存在浏览器 localStorage 中。

浏览器状态层包含：

- 基础面试上下文：面试类型、目标方向、目标院校、背景材料；
- 上传文件内容：文件名、标签、解析后的文本；
- 完整材料文本：手写材料和文件内容合并后的文本；
- 材料预分析结果：证据卡、摘要、材料指纹、Agent trace；
- 问题预分析结果：问题意图、考察重点、理想回答层次、常见陷阱、期望调用证据、问题指纹、Agent trace；
- 当前页面中的问题、回答版本、计时状态和复盘结果。

缓存判断依赖 fingerprint：

- 材料 fingerprint：由背景材料、目标方向、目标院校生成；
- 问题 fingerprint：由问题、材料 fingerprint、目标方向生成；
- 如果用户修改材料或问题，旧的预分析会被视为过期；
- 最终复盘提交时，后端仍会重新校验传入的预分析 fingerprint；
- 如果预分析有效，Runner 复用结果；
- 如果预分析缺失或过期，Runner 会在最终复盘阶段自动补跑。

这部分适合在架构图中画成：

```text
localStorage
├─ Interview Context
├─ Parsed Files
├─ MaterialPreAnalysis
└─ QuestionPreAnalysis Map
```

## 6. API 路由层

### 6.1 材料预分析 API

路径：

```text
POST /api/agents/material
```

输入：

- backgroundMaterials
- targetDirection
- targetSchool

职责：

- 校验材料是否为空；
- 调用 Material Analyst；
- 生成材料 fingerprint；
- 返回 MaterialPreAnalysis；
- 在 Agent trace 中记录材料分析阶段。

输出：

- evidenceCards
- summary
- inputFingerprint
- agentTrace

### 6.2 问题规划 API

路径：

```text
POST /api/agents/question-plan
```

输入：

- question
- interviewType
- targetDirection
- targetSchool
- evidenceCards
- materialFingerprint

职责：

- 校验问题是否为空；
- 调用 Question Intent Analyst；
- 调用 Evidence Planner；
- 生成问题 fingerprint；
- 返回 QuestionPreAnalysis；
- 在 Agent trace 中记录问题分析和证据规划阶段。

输出：

- questionIntent
- evaluationFocus
- idealAnswerLayers
- commonPitfalls
- expectedEvidence
- summary
- inputFingerprint
- agentTrace

### 6.3 面试前复盘 API

路径：

```text
POST /api/replay/pre
```

输入：

- interviewType
- targetDirection
- targetSchool
- backgroundMaterials
- question
- liveAnswer
- calmAnswer
- materialAnalysis
- questionPlan

职责：

- 校验请求结构；
- 调用 runPreReplayAgents；
- 生成 PreReplayReport；
- 生成一键复制文本；
- 返回结构化报告。

### 6.4 面试后复盘 API

路径：

```text
POST /api/replay/post
```

输入：

- question
- interviewContext
- targetDirection
- backgroundMaterials
- answers
- materialAnalysis
- questionPlan

职责：

- 校验请求结构；
- 调用 runPostReplayAgents；
- 生成 PostReplayReport；
- 生成一键复制文本；
- 返回结构化报告。

### 6.5 其他辅助 API

当前还包含：

- 文件解析 API：把上传文件解析为可放入背景材料的文本；
- 示例问题生成 API：根据用户材料和目标方向生成练习问题。

这两类 API 不属于核心 Agent 复盘链，但支撑完整产品体验。

## 7. 多 Agent 角色分工

当前实现采用“轻量多角色 Agent 编排”，不是外部复杂 Agent 框架，而是在服务端用多个职责明确的 Agent 函数和 Runner 串并联编排。

### 7.1 Material Analyst

工作阶段：

- 首页用户点击“分析材料”后提前运行；
- 如果用户没有提前分析，最终复盘时由 Runner 自动补跑。

职责：

- 阅读用户背景材料；
- 提取可用于面试回答的证据卡；
- 标注证据类型、可支持的问题、体现的能力、可能追问、使用风险、建议表达和信息缺口；
- 不直接生成面试回答。

输出：

- evidenceCards
- summary

### 7.2 Question Intent Analyst

工作阶段：

- 用户在面试前或面试后页面确定问题后提前运行；
- 如果没有提前运行，最终复盘时由 Runner 自动补跑。

职责：

- 判断这道题真正考察什么；
- 提炼评价重点；
- 给出理想回答层次；
- 提醒常见答题陷阱；
- 不评价用户具体回答。

输出：

- questionIntent
- evaluationFocus
- idealAnswerLayers
- commonPitfalls

### 7.3 Evidence Planner

工作阶段：

- 用户确定问题后，紧跟 Question Intent Analyst 运行。

职责：

- 根据问题意图和材料证据库，提前规划这道题应该调用哪些证据；
- 给每条期望证据标注优先级、使用理由、建议用法和缺失信息；
- 不判断用户是否已经用了这些材料。

输出：

- expectedEvidence

### 7.4 Evidence Mapper

工作阶段：

- 最终复盘提交后运行。

职责：

- 对照 expectedEvidence 和用户回答；
- 判断用户回答实际调用了哪些材料；
- 计算材料召回情况；
- 找出缺失证据；
- 生成带证据引用和置信度的诊断结论。

输出：

- materialRecall
- missingEvidence
- evidenceClaims

### 7.5 Skeptical Professor

工作阶段：

- 最终复盘提交后，与 Gap Diagnoser 或 Diff Analyst 并行运行。

职责：

- 模拟导师视角审查回答；
- 找出空泛表达、证据不足、贡献不清、过度包装、导师方向不匹配、追问承接不足等风险；
- 生成风险雷达；
- 生成真实性风险；
- 生成导师压力测试题和安全承接回答。

输出：

- riskRadar
- followUpRisks
- authenticityWarnings
- pressureTests

### 7.6 Gap Diagnoser

工作阶段：

- 面试前模式最终复盘提交后运行；
- 与 Skeptical Professor 并行。

职责：

- 比较临场回答和冷静回答；
- 找出临场缺失的内容、逻辑、证据和表达；
- 判断临场损失原因；
- 生成临场差距诊断。

输出：

- liveAnswerDiagnosis
- calmAnswerImprovements
- liveLossAnalysis
- gapClaims

### 7.7 Diff Analyst

工作阶段：

- 面试后模式最终复盘提交后运行；
- 与 Skeptical Professor 并行。

职责：

- 比较多个回答版本；
- 排序不同版本的质量；
- 分析每个版本的优点、问题、可保留部分和应避免部分；
- 给出逐句诊断；
- 生成多版本差异结论。

输出：

- answerRanking
- versionReviews
- versionClaims
- sentenceDiagnosis

### 7.8 Answer Synthesizer

工作阶段：

- Evidence Mapper、Professor、Gap/Diff 完成后运行。

职责：

- 根据证据、问题意图、风险审查和差距/差异诊断，生成最佳融合回答；
- 生成更适合口头表达的安全回答；
- 输出 30 秒版、60 秒版、自然版、研究版；
- 标注使用了哪些证据；
- 标注做了哪些风险控制；
- 避免编造材料中没有的信息。

输出：

- bestMergedAnswer
- safeAnswer

### 7.9 Verifier / Critic

工作阶段：

- Answer Synthesizer 之后、Training Planner 之前运行。

职责：

- 校验最终回答是否存在无证据支撑、夸大、贡献不清、偏题、不适合口述、新追问风险等问题；
- 如果发现问题，给出修正版回答；
- 为最终输出增加安全闸门。

输出：

- answerVerification
- revisedAnswer

### 7.10 Training Planner

工作阶段：

- 最终回答和安全校验完成后运行。

职责：

- 面试前模式：生成救场模板、下一步练习建议、复盘卡片；
- 面试后模式：生成可迁移回答公式、下一次面试清单、复盘卡片；
- 将诊断结果转化为下一次训练动作。

输出：

- rescueTemplate
- transferableFormula
- nextPracticeAdvice
- nextInterviewChecklist
- replayCard

### 7.11 Report Composer

工作阶段：

- 所有 Agent 完成后运行。

职责：

- 不是 LLM Agent；
- 把各 Agent 输出组装成最终报告；
- 构建质量摘要；
- 判断回答成熟度；
- 处理安全回答优先级；
- 统一 PreReplayReport 和 PostReplayReport 的结构。

输出：

- PreReplayReport
- PostReplayReport

## 8. Agent 执行时序

### 8.1 首页阶段：材料分析提前运行

```text
用户输入背景材料
↓
用户点击分析材料
↓
前端 POST /api/agents/material
↓
Material Analyst
↓
生成 Evidence Cards
↓
保存 MaterialPreAnalysis
↓
侧边栏显示材料分析完成
```

这一阶段的作用是把“等用户最终提交才分析”提前到“用户确认材料后就分析”，减少最终等待时间，也让后续问题规划可以基于证据库工作。

### 8.2 问题阶段：问题意图和证据规划提前运行

```text
用户进入 pre 或 post 页面
↓
用户输入或生成问题
↓
前端检测问题和材料分析结果
↓
POST /api/agents/question-plan
↓
Question Intent Analyst
↓
Evidence Planner
↓
保存 QuestionPreAnalysis
↓
侧边栏显示问题分析和证据规划完成
```

这一阶段不会评价用户回答，因为用户还没有提交回答。它只判断“这道题应该怎么答、应该调用哪些证据”。

### 8.3 面试前最终复盘阶段

```text
用户提交临场回答 + 冷静回答
↓
POST /api/replay/pre
↓
Runner 校验并复用 MaterialPreAnalysis
↓
Runner 校验并复用 QuestionPreAnalysis
↓
Evidence Mapper 判断材料召回
↓
Skeptical Professor 与 Gap Diagnoser 并行运行
↓
Answer Synthesizer 生成最佳安全回答
↓
Verifier 校验回答安全性
↓
Composer 构建质量摘要和成熟度
↓
Training Planner 生成救场模板和复盘卡片
↓
Composer 输出 PreReplayReport
↓
前端展示报告、复制文本、Markdown 导出
```

面试前模式的关键差异是 Gap Diagnoser，因为它专门比较“临场回答”和“冷静回答”。

### 8.4 面试后最终复盘阶段

```text
用户提交真实问题 + 多个回答版本
↓
POST /api/replay/post
↓
Runner 校验并复用 MaterialPreAnalysis
↓
Runner 校验并复用 QuestionPreAnalysis
↓
Evidence Mapper 判断材料召回
↓
Skeptical Professor 与 Diff Analyst 并行运行
↓
Answer Synthesizer 生成最佳安全回答
↓
Verifier 校验回答安全性
↓
Composer 构建质量摘要和成熟度
↓
Training Planner 生成可迁移公式和复盘卡片
↓
Composer 输出 PostReplayReport
↓
前端展示报告、复制文本、Markdown 导出
```

面试后模式的关键差异是 Diff Analyst，因为它专门比较多个回答版本。

## 9. 并行与复用逻辑

当前实现中有两类效率优化。

第一类是阶段提前：

- 材料分析在首页提前运行；
- 问题意图和证据规划在问题确定后提前运行；
- 最终复盘时优先复用这些结果；
- 如果缓存无效或缺失，再由 Runner 补跑。

第二类是诊断并行：

- 在 Evidence Mapper 完成后，Professor 和 Gap/Diff 之间没有强依赖；
- 面试前模式中，Skeptical Professor 与 Gap Diagnoser 并行；
- 面试后模式中，Skeptical Professor 与 Diff Analyst 并行；
- 任一非核心诊断失败时，Runner 会记录失败 trace，并继续后续流程。

适合画成这样的阶段图：

```text
Material Analyst
↓
Question Intent Analyst → Evidence Planner
↓
Evidence Mapper
↓
┌──────────────────────┬──────────────────────┐
│ Skeptical Professor  │ Gap / Diff Diagnoser  │
└──────────────────────┴──────────────────────┘
↓
Answer Synthesizer
↓
Verifier
↓
Training Planner
↓
Report Composer
```

## 10. 最终报告结构

### 10.1 面试前报告

PreReplayReport 主要包含：

- 问题真实意图；
- 材料证据库；
- 材料召回率；
- 证据依据；
- 临场回答诊断；
- 冷静回答改进点；
- 临场损失分析；
- 风险雷达；
- 真实性风险；
- 导师追问风险；
- 导师压力测试；
- 最佳安全回答；
- 回答安全校验；
- 质量摘要；
- 回答成熟度；
- 下次救场模板；
- 下一步练习建议；
- 复盘卡片；
- 多角色诊断链 trace。

### 10.2 面试后报告

PostReplayReport 主要包含：

- 问题真实意图；
- 材料证据库；
- 材料召回率；
- 证据依据；
- 回答综合排名；
- 各版本优缺点；
- 版本差异诊断；
- 逐句诊断；
- 风险雷达；
- 真实性风险；
- 导师可能追问；
- 导师压力测试；
- 最佳安全回答；
- 回答安全校验；
- 质量摘要；
- 回答成熟度；
- 可迁移回答公式；
- 下一次面试清单；
- 复盘卡片；
- 多角色诊断链 trace。

### 10.3 报告展示顺序

当前前端报告不是平铺所有 Agent 原始输出，而是分层展示：

1. 顶部先展示质量摘要和最佳安全回答；
2. 然后展示风险、压力测试、材料召回、证据依据；
3. 再展示模式特有诊断；
4. 最后展示训练建议、复盘卡片、问题意图、材料证据库和 Agent trace；
5. 复杂内容使用折叠区，避免报告信息过载。

## 11. Agent Trace 与侧边栏状态

系统有两种 Agent 状态展示：

- AgentPipeline：侧边栏流程卡片，展示每个阶段的运行状态；
- AgentTracePanel：报告内部的多角色诊断链详情，展示真实返回的 agentTrace。

AgentPipeline 的状态来源：

- 首页：材料分析完成后展示材料阶段 trace；
- pre/post 页面：读取已有材料分析和问题分析 trace；
- 点击最终评审时：保留前三个已完成阶段，从后续诊断阶段继续动画；
- 报告生成后：使用后端返回的真实 agentTrace 展示完整链路。

需要注意：

- 当前没有实现服务端流式进度推送；
- 最终评审加载中的侧边栏是基于已有 trace 和预估阶段做视觉反馈；
- 报告生成后的 AgentTracePanel 才是后端实际执行结果。

## 12. 质量优化能力

当前质量优化主要体现在四个方面。

### 12.1 证据优先

系统不会只看问题生成答案，而是先从用户材料中提取 EvidenceCard，再判断回答是否调用了这些证据。

关键对象：

- EvidenceCard
- ExpectedEvidenceItem
- EvidenceReference
- DiagnosisClaim
- MaterialRecall

### 12.2 风险优先

Professor Agent 不只给泛泛建议，而是模拟导师追问：

- 哪句话可能被追问；
- 为什么危险；
- 当前材料支撑强不强；
- 应该如何安全回应；
- 缺什么信息。

关键对象：

- RiskRadarItem
- AuthenticityWarning
- ProfessorPressureTest

### 12.3 安全回答优先

Synthesizer 生成的不是“最漂亮”的回答，而是优先保证：

- 不编造；
- 能承接追问；
- 引用用户已有证据；
- 避免过度包装；
- 适合口头表达。

关键对象：

- SafeAnswerOutput

### 12.4 最终校验

Verifier 对融合回答做最后检查：

- 是否有无证据支撑；
- 是否夸大；
- 是否贡献边界不清；
- 是否偏题；
- 是否不适合口述；
- 是否引入新追问风险。

如果 Verifier 给出 revisedAnswer，Composer 会优先采用修正版作为最终 60 秒安全回答。

关键对象：

- AnswerVerification
- AnswerVerificationIssue

## 13. 数据对象关系

适合画成数据模型图的核心对象如下：

```text
InterviewContext
├─ interviewType
├─ targetDirection
├─ targetSchool
└─ backgroundMaterials

MaterialPreAnalysis
├─ evidenceCards: EvidenceCard[]
├─ summary
├─ inputFingerprint
└─ agentTrace

QuestionPreAnalysis
├─ questionIntent
├─ evaluationFocus
├─ idealAnswerLayers
├─ commonPitfalls
├─ expectedEvidence: ExpectedEvidenceItem[]
├─ inputFingerprint
└─ agentTrace

PreReplayReport / PostReplayReport
├─ questionIntent
├─ evidenceCards
├─ materialRecall
├─ evidenceClaims
├─ riskRadar
├─ authenticityWarnings
├─ pressureTests
├─ safeAnswer
├─ answerVerification
├─ qualitySummary
├─ answerMaturity
├─ replayCard
└─ agentTrace
```

模式特有对象：

```text
PreReplayReport
├─ liveAnswerDiagnosis
├─ calmAnswerImprovements
├─ liveLossAnalysis
├─ gapClaims
├─ rescueTemplate
└─ nextPracticeAdvice

PostReplayReport
├─ answerRanking
├─ versionReviews
├─ versionClaims
├─ sentenceDiagnosis
├─ transferableFormula
└─ nextInterviewChecklist
```

## 14. 错误处理与降级

当前实现包含这些降级策略：

- API 请求先做必填字段校验；
- 缺少 LLM API Key 时，服务端返回明确错误；
- 模型请求失败时，API 返回可识别错误码；
- 模型 JSON 异常时，通过解析和 normalizer 尽量保持结构稳定；
- 材料预分析缺失时，最终 Runner 自动补跑；
- 问题预分析缺失时，最终 Runner 自动补跑；
- Professor、Gap、Diff、Verifier 等非核心 Agent 失败时，Runner 记录 failed trace，并继续后续流程；
- Composer 对部分可选字段做兜底，确保前端报告结构可渲染。

## 15. 当前实现边界

当前项目为了适合比赛 Demo 和本地/服务器快速部署，刻意保持轻量。

已经实现：

- 双模式复盘；
- 首页材料工作台；
- 材料证据库；
- 材料召回率；
- 问题意图分析；
- 证据规划；
- 多角色 Agent 编排；
- 临场损失分析；
- 多版本 Answer Diff；
- 风险雷达；
- 导师压力测试；
- 真实性风险；
- 最佳安全回答；
- Verifier 安全校验；
- 回答成熟度；
- 救场模板；
- 可迁移回答公式；
- 复盘卡片；
- Agent trace；
- 报告复制；
- Markdown 导出；
- localStorage 状态保存。

当前没有实现：

- 用户账号；
- 数据库；
- 云端长期训练档案；
- 多用户权限系统；
- 真实向量检索库；
- 语音输入；
- 视频回放；
- 服务端流式 Agent 进度；
- 外部重型 Agent 框架；
- 复杂 RAG 或导师知识库。

这些边界可以在架构图中标注为“暂不纳入当前版本”。

## 16. 推荐绘图方式

### 16.1 系统分层架构图

推荐节点：

- User
- Next.js UI Pages
- Browser Context / localStorage
- API Routes
- Agent Runner
- Agent Modules
- LLM Provider
- Report Composer
- Report UI / Export

推荐边：

- User -> UI Pages：输入材料、问题、回答；
- UI Pages -> localStorage：保存材料、文件、预分析；
- UI Pages -> API Routes：发起材料分析、问题规划、最终复盘；
- API Routes -> Agent Runner：执行复盘链；
- Agent Runner -> Agent Modules：串并联调用；
- Agent Modules -> LLM Provider：模型推理；
- Agent Runner -> Report Composer：聚合结构化结果；
- Report Composer -> UI Pages：返回报告；
- UI Pages -> Export：复制和 Markdown 导出。

### 16.2 Agent 编排图

推荐画成阶段流水线：

```text
Material Analyst
→ Question Intent Analyst
→ Evidence Planner
→ Evidence Mapper
→ [Skeptical Professor || Gap/Diff Diagnoser]
→ Answer Synthesizer
→ Verifier
→ Training Planner
→ Report Composer
```

其中：

- Material Analyst 可以在首页提前运行；
- Question Intent Analyst 和 Evidence Planner 可以在问题确定后提前运行；
- Gap Diagnoser 只在面试前模式运行；
- Diff Analyst 只在面试后模式运行；
- Professor 和 Gap/Diff 在最终复盘阶段并行；
- Composer 是确定性聚合器，不是 LLM Agent。

### 16.3 用户旅程图

推荐分三段：

```text
准备阶段：输入材料 -> 分析材料 -> 生成证据库
答题阶段：选择模式 -> 输入问题 -> 预分析问题 -> 完成回答
复盘阶段：最终评审 -> 多 Agent 诊断 -> 报告展示 -> 导出/训练
```

### 16.4 数据流图

推荐突出四个关键数据包：

- MaterialPreAnalysis：材料证据库；
- QuestionPreAnalysis：问题意图和期望证据；
- ReplayRequest：用户回答和上下文；
- ReplayReport：最终复盘报告。

数据流：

```text
MaterialPreAnalysis + QuestionPreAnalysis + User Answers
↓
Agent Runner
↓
Agent Outputs
↓
ReplayReport
↓
Report UI / Copy / Markdown
```

## 17. 一句话总结

Interview Replay 当前最终实现是一个“材料驱动、分阶段预分析、多角色 Agent 诊断、安全校验、训练闭环”的轻量 AI 面试复盘系统：它先把用户材料变成证据库，再围绕具体面试问题判断回答是否真正用上了材料，最后通过风险审查、差距/差异诊断、融合回答和训练建议，把一次回答复盘成可继续训练的结构化报告。
