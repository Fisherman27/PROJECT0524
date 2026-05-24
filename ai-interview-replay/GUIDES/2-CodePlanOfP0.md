# Interview Replay P0 实现规划

本文档规划 `1-ProjectProposal.md` 中 11.1 P0 阶段的实现。目标是给后续代码实现者提供清晰边界、系统架构、前后端协作方式和可扩展代码结构。

## 1. P0 目标

P0 只做最小可演示闭环：

1. 两种模式入口：面试前模拟、面试后复盘；
2. 面试背景材料输入；
3. 面试问题输入或生成；
4. 面试前模式：临场回答与冷静回答输入；
5. 面试后模式：多版本回答输入；
6. 服务端调用 AI 生成结构化复盘报告；
7. 输出最佳融合回答；
8. 输出回答公式或救场模板；
9. 一键复制复盘结果。

P0 不做账号系统、数据库、PDF 解析、语音输入、长期历史记录、复杂题库、导师信息库。

## 2. 推荐技术路线

建议使用单体 Web 应用，降低部署和协作成本：

- 框架：Next.js App Router + TypeScript；
- 样式：Tailwind CSS；
- 运行时：Node.js；
- AI 调用：服务端 API Route 内统一调用 LLM；
- 部署：云服务器 Node.js + npm + PM2；
- 数据存储：P0 不落库，前端状态保存在页面内；如需短暂保留，可用浏览器 localStorage，不能作为核心依赖。

原因：

- 前后端同仓、同构建、同部署，适合 16/24 小时项目；
- API Key 只在服务端读取，符合安全要求；
- Next.js API Route 可以直接承载 P0 后端；
- 后续可以平滑扩展数据库、历史记录、导出等功能。

## 3. 系统架构

P0 架构建议：

```text
Browser
  |
  | relative fetch: /api/...
  v
Next.js App
  |
  | UI pages and client components
  v
Server API Routes
  |
  | validate request
  | build prompt
  | call LLM provider
  | normalize structured report
  v
LLM Provider
```

关键原则：

- 前端只负责采集输入、展示状态和渲染报告；
- 后端负责校验输入、拼 prompt、调用模型、返回结构化 JSON；
- Prompt、类型定义、报告结构必须集中管理，避免散落在页面组件里；
- P0 先不引入数据库，避免把时间消耗在非核心能力上。

## 4. 代码结构规划

建议 `ai-interview-replay/` 作为实际应用根目录。后续初始化项目后，推荐结构：

```text
ai-interview-replay/
├─ AGENTS_for_this.md
├─ GUIDES/
│  ├─ README.md
│  ├─ 1-ProjectProposal.md
│  └─ 2-CodePlanOfP0.md
├─ README.md
├─ .env.example
├─ package.json
├─ package-lock.json
├─ next.config.ts
├─ tsconfig.json
├─ src/
│  ├─ app/
│  │  ├─ page.tsx
│  │  ├─ layout.tsx
│  │  ├─ globals.css
│  │  ├─ pre/
│  │  │  └─ page.tsx
│  │  ├─ post/
│  │  │  └─ page.tsx
│  │  └─ api/
│  │     ├─ replay/
│  │     │  ├─ pre/
│  │     │  │  └─ route.ts
│  │     │  └─ post/
│  │     │     └─ route.ts
│  │     └─ questions/
│  │        └─ route.ts
│  ├─ components/
│  │  ├─ mode-card.tsx
│  │  ├─ form-field.tsx
│  │  ├─ report-section.tsx
│  │  ├─ copy-button.tsx
│  │  ├─ loading-state.tsx
│  │  └─ error-panel.tsx
│  ├─ features/
│  │  ├─ pre-replay/
│  │  │  ├─ pre-replay-form.tsx
│  │  │  ├─ pre-replay-result.tsx
│  │  │  └─ pre-replay-client.ts
│  │  └─ post-replay/
│  │     ├─ post-replay-form.tsx
│  │     ├─ post-replay-result.tsx
│  │     └─ post-replay-client.ts
│  ├─ lib/
│  │  ├─ ai/
│  │  │  ├─ provider.ts
│  │  │  ├─ prompts.ts
│  │  │  └─ report-normalizer.ts
│  │  ├─ schemas/
│  │  │  ├─ replay.ts
│  │  │  └─ report.ts
│  │  ├─ env.ts
│  │  └─ copy-format.ts
│  └─ types/
│     └─ replay.ts
└─ public/
```

说明：

- `src/app/`：页面和 API Route；
- `src/features/`：按业务模式组织前端业务组件；
- `src/components/`：可复用 UI 组件，不包含业务 prompt；
- `src/lib/ai/`：模型调用、prompt、报告标准化；
- `src/lib/schemas/`：请求和响应 schema；
- `src/lib/env.ts`：集中读取和校验服务端环境变量；
- `GUIDES/`：只放规划、设计、产品和交接型文档，不放运行时代码。

## 5. 前端规划

### 5.1 页面

P0 建议三个页面：

```text
/       模式选择首页
/pre    面试前模拟
/post   面试后复盘
```

首页只做产品入口，不做营销长页。首屏应直接让用户进入两个模式。

### 5.2 首页

首页展示：

- 产品名：Interview Replay；
- 两个模式入口卡片：
  - 面试前模拟：临场回答 + 冷静回答；
  - 面试后复盘：多版本回答对比；
- 简短说明：这是保研面试复盘工具，不是通用聊天机器人。

首页不需要复杂动画。P0 重点是让评委快速理解产品差异。

### 5.3 面试前模拟页

表单字段：

- 面试类型：夏令营 / 预推免 / 九推 / 导师组面试 / 单导师面试 / 其他；
- 目标方向；
- 目标院校、学院、实验室，可选；
- 背景材料；
- 面试问题；
- 临场回答；
- 冷静回答。

辅助操作：

- “生成练习问题”按钮：调用 `/api/questions`，根据背景材料生成一个问题；
- “生成复盘报告”按钮：调用 `/api/replay/pre`；
- “清空”按钮：只清空当前表单，不影响其他页面；
- “复制报告”按钮：报告生成后可用。

状态：

- 空状态：提示用户先填写材料；
- 加载状态：明确显示正在分析，不重复提交；
- 错误状态：展示可读错误，例如缺少 API Key、输入过短、模型返回失败；
- 成功状态：按固定报告模块渲染。

### 5.4 面试后复盘页

表单字段：

- 真实面试问题；
- 面试场景；
- 目标方向；
- 背景材料，可选但建议填写；
- 回答版本列表。

P0 中回答版本可以先固定为 3 个输入区：

- 回答 A：真实回答；
- 回答 B：事后想到；
- 回答 C：同学、学长或 AI 建议。

如果时间允许，再做动态增删。动态增删属于 P1，不阻塞 P0。

辅助操作：

- “生成复盘报告”按钮：调用 `/api/replay/post`；
- “复制报告”按钮：报告生成后可用。

### 5.5 报告展示

报告应使用固定模块，不直接把大段 Markdown 原样糊到页面。

面试前报告模块：

1. 问题真实意图；
2. 临场回答诊断；
3. 冷静回答改进点；
4. 临场损失分析；
5. 材料证据遗漏；
6. 导师追问风险；
7. 最佳融合回答；
8. 下次救场模板；
9. 下一次练习建议。

面试后报告模块：

1. 问题真实意图；
2. 回答综合排名；
3. 各版本优缺点；
4. 逐句诊断；
5. 空泛表达与过度包装风险；
6. 导师可能追问；
7. 最佳融合回答；
8. 可迁移回答公式；
9. 下一场面试准备清单。

前端应按模块渲染，允许某些模块为空时显示“本次未发现明显问题”或隐藏该模块，但不应破坏整体结构。

## 6. 后端规划

### 6.1 API Route

P0 推荐三个接口：

```text
POST /api/replay/pre
POST /api/replay/post
POST /api/questions
```

### 6.2 `/api/replay/pre`

用途：生成面试前模拟复盘报告。

请求字段：

```ts
{
  interviewType: string;
  targetDirection: string;
  targetSchool?: string;
  backgroundMaterials: string;
  question: string;
  liveAnswer: string;
  calmAnswer: string;
}
```

响应字段：

```ts
{
  mode: "pre";
  report: PreReplayReport;
  copyText: string;
}
```

后端职责：

- 校验必填字段；
- 限制输入长度，避免超 token；
- 构建面试前模式 prompt；
- 调用 LLM；
- 解析并标准化为 `PreReplayReport`；
- 生成便于复制的纯文本 `copyText`。

### 6.3 `/api/replay/post`

用途：生成面试后多版本复盘报告。

请求字段：

```ts
{
  question: string;
  interviewContext: string;
  targetDirection: string;
  backgroundMaterials?: string;
  answers: Array<{
    label: string;
    source: string;
    content: string;
  }>;
}
```

响应字段：

```ts
{
  mode: "post";
  report: PostReplayReport;
  copyText: string;
}
```

后端职责：

- 至少要求 2 个有效回答版本；
- 过滤空回答；
- 构建面试后模式 prompt；
- 调用 LLM；
- 解析并标准化为 `PostReplayReport`；
- 生成 `copyText`。

### 6.4 `/api/questions`

用途：根据背景材料生成练习问题。

请求字段：

```ts
{
  interviewType?: string;
  targetDirection?: string;
  backgroundMaterials: string;
}
```

响应字段：

```ts
{
  question: string;
  reason: string;
}
```

P0 中该接口可以很简单，只生成一个问题和原因。不要做完整题库。

## 7. 前后端协同

### 7.1 数据流

```text
用户填写表单
  -> 前端基础校验
  -> fetch('/api/replay/pre' 或 '/api/replay/post')
  -> 后端 schema 校验
  -> 后端拼 prompt
  -> LLM 返回结构化 JSON
  -> 后端 normalize
  -> 前端按固定模块展示
  -> 用户一键复制 copyText
```

### 7.2 校验分工

前端校验：

- 必填字段是否为空；
- 回答版本数量是否足够；
- 文本长度是否明显过短；
- 防止重复提交。

后端校验：

- 所有必填字段二次校验；
- 限制最大长度；
- 校验环境变量；
- 捕获模型调用失败；
- 模型返回非 JSON 时给出兜底错误。

### 7.3 错误格式

后端统一返回：

```ts
{
  error: {
    code: string;
    message: string;
  }
}
```

建议错误码：

- `VALIDATION_ERROR`
- `MISSING_API_KEY`
- `MODEL_REQUEST_FAILED`
- `MODEL_RESPONSE_INVALID`
- `UNKNOWN_ERROR`

前端只展示 `message`，不要展示 API Key、完整堆栈或服务端内部细节。

## 8. 类型和报告结构

P0 应优先定义稳定的报告类型。这样后续 UI、复制、导出、历史记录都可以复用。

### 8.1 通用类型

```ts
type ReportBullet = {
  title: string;
  detail: string;
};

type RiskItem = {
  risk: string;
  reason: string;
  suggestedPreparation: string;
};

type SentenceDiagnosis = {
  original: string;
  diagnosis: string;
  suggestion: string;
};
```

### 8.2 面试前报告类型

```ts
type PreReplayReport = {
  questionIntent: string;
  liveAnswerDiagnosis: ReportBullet[];
  calmAnswerImprovements: ReportBullet[];
  liveLossAnalysis: ReportBullet[];
  missingEvidence: ReportBullet[];
  followUpRisks: RiskItem[];
  bestMergedAnswer: string;
  rescueTemplate: string;
  nextPracticeAdvice: ReportBullet[];
};
```

### 8.3 面试后报告类型

```ts
type PostReplayReport = {
  questionIntent: string;
  answerRanking: Array<{
    label: string;
    rank: number;
    reason: string;
  }>;
  versionReviews: Array<{
    label: string;
    strengths: string[];
    problems: string[];
    keepParts: string[];
    avoidParts: string[];
  }>;
  sentenceDiagnosis: SentenceDiagnosis[];
  vagueAndOverpackagingRisks: RiskItem[];
  followUpRisks: RiskItem[];
  bestMergedAnswer: string;
  transferableFormula: string;
  nextInterviewChecklist: string[];
};
```

实现者可以用 Zod 或普通 TypeScript 类型。若使用 Zod，需要写入 `dependencies` 或 `devDependencies`，并提交锁文件。

## 9. Prompt 设计原则

Prompt 必须服务于“复盘诊断”，不能退化为普通润色。

### 9.1 通用约束

所有复盘 prompt 都应包含：

- 你是保研面试复盘助理；
- 重点是诊断，不是替用户编经历；
- 不得编造用户没有提供的背景；
- 如果信息不足，要明确说明可信度有限；
- 必须识别过度包装和导师追问风险；
- 输出必须是指定 JSON 结构；
- 语言应适合中国保研面试语境；
- 最佳回答要口语化、真实、边界清楚。

### 9.2 面试前 prompt 重点

必须比较：

- 临场回答 vs 冷静回答；
- 回答内容 vs 背景材料；
- 用户已经知道但临场没说出的信息；
- 下次紧张时可复用的救场结构。

### 9.3 面试后 prompt 重点

必须比较：

- 多版本回答之间的稳定性；
- 哪些句子空泛；
- 哪些表达过度包装；
- 哪些内容容易被导师追问；
- 最佳融合回答应保留什么、删除什么。

## 10. 环境变量

P0 至少需要：

```text
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.example.com/v1
LLM_MODEL=your_model_name
PORT=3000
```

说明：

- `LLM_API_KEY` 只在服务端读取；
- 不能使用 `NEXT_PUBLIC_` 存放密钥；
- `.env.example` 只写占位符；
- `.env.local` 不能提交；
- 缺少 `LLM_API_KEY` 时，API 应返回 `MISSING_API_KEY`。

如果直接使用 OpenAI SDK 或其他供应商 SDK，变量名可以改成供应商标准名，但 README 和 `.env.example` 必须同步。

## 11. README 要求

`ai-interview-replay/README.md` 在实现阶段必须补齐：

- 项目简介；
- 技术栈；
- 本地运行；
- `.env.example` 每个变量说明；
- 生产构建；
- `npm start`；
- PM2 部署；
- 公网端口；
- 常见问题排查。

如果 `package.json` 位于 `ai-interview-replay/`，根 README 必须明确：

```bash
cd ai-interview-replay
npm install
npm run dev
```

## 12. P0 实现顺序

建议后续实现者按以下顺序推进：

1. 初始化 Next.js + TypeScript + Tailwind 项目；
2. 创建 `.env.example`、基础 README、`package.json` scripts；
3. 定义请求和报告类型；
4. 实现首页和两个模式页面的静态 UI；
5. 实现表单状态、前端校验、加载和错误状态；
6. 实现 `/api/questions`；
7. 实现 `/api/replay/pre`；
8. 实现 `/api/replay/post`；
9. 实现报告渲染组件；
10. 实现复制报告；
11. 跑 `npm run build`；
12. 补 handoff，记录验证结果。

## 13. P0 验收标准

功能验收：

- 首页能进入两个模式；
- 面试前模式能填写材料、问题、临场回答、冷静回答，并生成报告；
- 面试后模式能填写问题、背景、多个回答版本，并生成报告；
- 报告包含最佳融合回答；
- 报告包含救场模板或可迁移回答公式；
- 报告可以一键复制；
- 缺少环境变量时显示清晰错误。

工程验收：

- `npm install` 可用；
- `npm run dev` 可用；
- `npm run build` 通过；
- `npm start` 可启动生产服务；
- `.env.example` 存在且无真实密钥；
- 前端不硬编码生产 `localhost` API；
- README 写明部署步骤；
- 新增 handoff 记录实际验证结果。

## 14. 后续扩展预留

P0 代码要为 P1/P2 留接口，但不要提前实现复杂功能。

建议预留点：

- `report` 类型带 `mode`，方便以后加入更多模式；
- AI provider 抽象成 `callLLM()`，方便替换模型供应商；
- Prompt 独立在 `src/lib/ai/prompts.ts`，方便快速迭代；
- 报告复制逻辑独立在 `src/lib/copy-format.ts`，以后可扩展 Markdown 导出；
- 回答版本结构使用数组，P1 可以改成动态增删；
- 如果以后加历史记录，只新增 storage adapter，不改报告核心结构。

## 15. 实现边界

P0 实现者应避免：

- 直接在前端调用 LLM；
- 把 API Key 写进页面、日志或客户端 bundle；
- 让模型自由输出 Markdown 后直接展示，导致报告结构不可控；
- 为 P0 引入账号系统或复杂数据库；
- 为题目生成做大题库；
- 生成用户未提供的经历、论文、导师方向；
- 忽略 `AGENTS.md` 和 `AGENTS_for_this.md` 的交接要求。

