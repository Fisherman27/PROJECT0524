# Interview Replay P1 实现规划

本文档规划 `1-ProjectProposal.md` 中 11.2 P1 阶段的实现。P1 的目标是在 P0 已有“双模式输入 -> AI 复盘报告 -> 一键复制”闭环上，增强临场模拟真实感、提升面试后复盘输入灵活性，并补充可交付的 Markdown 导出能力。

## 1. P1 范围

根据当前 `1-ProjectProposal.md`，P1 包含 4 项：

1. 面试前准备阶段：问题显示后，5 秒内必须开始作答，否则视为放弃临场回答；
2. 限时倒计时：回答前可设置倒计时时间，默认 60 秒；倒计时结束后锁定临场回答；
3. 面试后复盘：回答版本动态增删；
4. 报告导出为 Markdown。

P1 不做：

- 语音输入；
- 视频回放；
- PDF 简历解析；
- 院校/导师信息库；
- 多轮长期训练记录；
- 多用户账号系统；
- 数据统计看板；
- 英文面试专项模式。

## 2. P1 前置清理

在实现 P1 前，建议先清理 P0 审核发现的问题。否则 P1 代码叠加后，后续定位问题会更困难。

必须处理：

- 修复 `npm run lint`：
  - `src/app/layout.tsx` 内部首页跳转改用 `next/link`；
  - 删除未使用类型或变量；
- 清理 `src/` 根目录下 create-next-app 残留文件：
  - `src/page.tsx`
  - `src/layout.tsx`
  - `src/globals.css`
  - 未使用的默认 `public/*.svg` 可一并清理；
- 修复 AI 生成练习问题失败时静默吞错的问题；
- 让 `/api/questions` 的非 JSON 模型返回按 `MODEL_RESPONSE_INVALID` 返回，而不是落到 `UNKNOWN_ERROR`。

验收：

```bash
npm run lint
npm run build
```

同时按根目录 `AGENTS.md` 要求，至少对后端 API 做一次模拟数据调用测试。

## 3. 技术策略

P1 仍保持 P0 的单体 Next.js 架构，不引入数据库、不引入复杂状态管理库。

原则：

- 倒计时和作答锁定只在前端完成；
- P1 不改 AI 主接口的核心语义；
- Markdown 导出优先复用 P0 的 `copyText` / formatter 能力；
- 动态回答版本继续使用数组结构，保持和后端 `answers` 请求结构兼容；
- 所有新增 UI 状态都应集中在 feature 组件中，不扩散到全局。

## 4. 代码结构调整

建议在 P0 结构基础上新增或调整：

```text
ai-interview-replay/src/
├─ components/
│  ├─ timer-control.tsx
│  ├─ markdown-export-button.tsx
│  └─ answer-version-card.tsx
├─ features/
│  ├─ pre-replay/
│  │  ├─ pre-replay-form.tsx
│  │  ├─ pre-replay-timer.tsx
│  │  └─ use-pre-answer-timer.ts
│  └─ post-replay/
│     ├─ post-replay-form.tsx
│     ├─ answer-version-list.tsx
│     └─ use-answer-versions.ts
├─ lib/
│  ├─ markdown-export.ts
│  └─ filename.ts
```

说明：

- `timer-control.tsx`：通用倒计时设置控件；
- `pre-replay-timer.tsx`：面试前模式专用作答计时 UI；
- `use-pre-answer-timer.ts`：集中管理 5 秒开始限制、正式倒计时、锁定状态；
- `answer-version-card.tsx`：单个回答版本卡片；
- `answer-version-list.tsx`：动态版本列表；
- `use-answer-versions.ts`：回答版本增删改逻辑；
- `markdown-export.ts`：把报告转为 Markdown 文本；
- `filename.ts`：生成安全文件名。

不要把这些逻辑写成页面组件里的大块内联状态。

## 5. P1 功能一：5 秒开始作答约束

### 5.1 产品目标

面试前模拟模式要更接近临场状态。用户看到问题后不能无限思考再写“临场回答”。P1 增加一个准备阶段：

```text
问题显示
  -> 5 秒内点击“开始作答”
  -> 进入限时临场回答
```

如果 5 秒内没有开始，则本次临场回答视为放弃，需要重新生成或重新开始本轮模拟。

### 5.2 推荐交互

在 `/pre` 页面中，将“面试问题”和“临场回答”拆成明确阶段：

```text
阶段 1：填写背景材料和问题
阶段 2：准备开始
阶段 3：限时临场回答
阶段 4：冷静回答
阶段 5：生成复盘报告
```

用户行为：

- 用户填写背景材料和问题；
- 点击“进入临场作答”；
- 页面显示问题和 5 秒准备倒计时；
- 5 秒内点击“开始作答”；
- 正式作答倒计时开始；
- 如果 5 秒倒计时归零还未开始：
  - 标记为 `abandoned`；
  - 禁用临场回答输入；
  - 提示“已视为放弃临场回答，请重新开始本轮模拟”；
  - 提供“重新开始”按钮。

### 5.3 状态设计

建议状态机：

```ts
type PreReplayStage =
  | "editing"
  | "ready"
  | "liveAnswering"
  | "liveLocked"
  | "abandoned"
  | "calmAnswering"
  | "submitting"
  | "result";
```

关键状态：

```ts
type PreTimerState = {
  stage: PreReplayStage;
  preparationSecondsLeft: number;
  answerSecondsLeft: number;
  answerDurationSeconds: number;
  liveAnswerLocked: boolean;
  abandonedReason?: string;
};
```

### 5.4 约束

- 5 秒准备倒计时只作用于临场回答；
- 不需要把 5 秒放到后端；
- 用户未点击“进入临场作答”前，不应启动 5 秒倒计时；
- 用户放弃后，不应允许直接提交空临场回答给 AI；
- 重新开始应清空本次临场回答和冷静回答，但保留背景材料和问题。

## 6. P1 功能二：限时倒计时并锁定回答

### 6.1 产品目标

用户可根据打字速度设置临场作答时间，默认 60 秒。正式倒计时结束后，临场回答锁定，用户不能继续编辑。

### 6.2 推荐 UI

在进入临场作答前提供设置：

- 默认：60 秒；
- 快捷选项：30 秒、60 秒、90 秒、120 秒；
- 自定义输入：建议限制在 15 到 300 秒；
- 清晰提示：倒计时结束后将锁定临场回答。

在作答中显示：

- 剩余时间；
- 进度条；
- “提前结束并锁定”按钮；
- 锁定后显示“临场回答已锁定”。

### 6.3 前端实现

建议实现 hook：

```ts
type UsePreAnswerTimerOptions = {
  defaultDurationSeconds: number;
  preparationSeconds: number;
  onAbandoned: () => void;
  onLocked: () => void;
};
```

核心行为：

- `startPreparation()`：进入 5 秒准备倒计时；
- `startAnswering()`：用户点击开始作答；
- `lockAnswer()`：用户提前结束或倒计时归零；
- `resetRound()`：重新开始本轮模拟；
- 组件卸载时清理 interval；
- 用时间戳计算剩余时间，避免 `setInterval` 漂移。

### 6.4 数据提交

P1 不要求后端知道计时细节，但建议前端保留少量元信息，便于后续扩展：

```ts
type PreReplayTimingMeta = {
  answerDurationSeconds: number;
  usedSeconds: number;
  lockedBy: "timeout" | "manual";
};
```

为了降低风险，建议 P1 只在前端展示和 Markdown/copy 中使用，不改 `/api/replay/pre` 请求结构。

### 6.5 验收

- 进入准备阶段后，5 秒内不开始会进入放弃状态；
- 点击开始后，正式倒计时运行；
- 倒计时结束后临场回答输入框不可编辑；
- 提前结束能锁定回答；
- 锁定后才能填写冷静回答；
- 重新开始能恢复可编辑状态。

## 7. P1 功能三：回答版本动态增删

### 7.1 产品目标

P0 面试后复盘固定 3 个回答版本。P1 改为动态增删，以覆盖真实场景：

- 真实回答；
- 事后想到；
- 同学建议；
- 学长学姐建议；
- AI 改写；
- 其他版本。

### 7.2 数据结构

建议用稳定 id，不要用数组下标作为 React key。

```ts
type AnswerVersionDraft = {
  id: string;
  label: string;
  source: string;
  content: string;
};
```

默认创建 3 个：

```ts
[
  { label: "A", source: "真实回答", content: "" },
  { label: "B", source: "事后想到", content: "" },
  { label: "C", source: "同学/学长/AI建议", content: "" }
]
```

新增版本时自动给下一个 label：`A, B, C, D, E...`。

### 7.3 交互规则

- 至少保留 2 个版本；
- 最多建议 6 个版本，避免报告过长和 token 膨胀；
- 每个版本允许编辑来源和回答内容；
- label 可以自动生成，不建议 P1 让用户手动改 label；
- 删除版本时弹出轻量确认或提供撤销能力；
- 空版本提交前过滤；
- 有效版本少于 2 个时禁用提交并显示提示。

### 7.4 后端影响

P0 后端已使用：

```ts
answers: Array<{
  label: string;
  source: string;
  content: string;
}>
```

因此 P1 动态增删主要是前端改造，不需要改 API 结构。

需要确认：

- 后端 schema 能处理 2 到 6 个版本；
- prompt 不假设只有 A/B/C；
- 报告渲染能处理任意数量的 `answerRanking` 和 `versionReviews`。

### 7.5 验收

- 默认显示 3 个版本；
- 可以新增第 4、第 5、第 6 个版本；
- 可以删除多余版本，但不能少于 2 个；
- 修改来源和内容后提交，API 请求中的 `answers` 与 UI 一致；
- 只填写 2 个版本也能生成报告；
- 版本排序和各版本优缺点展示数量与模型返回一致。

## 8. P1 功能四：报告导出为 Markdown

### 8.1 产品目标

P0 的“一键复制”适合快速粘贴。P1 增加 Markdown 导出，方便用户保存复盘结果、放进笔记工具，或用于 Demo 提交材料。

### 8.2 推荐能力

报告结果区新增：

- “复制 Markdown”；
- “下载 Markdown”。

如果时间有限，优先实现“下载 Markdown”。复制 Markdown 可以复用现有复制按钮。

### 8.3 Markdown 生成

建议新增：

```ts
export function formatPreMarkdown(report: PreReplayReport): string;
export function formatPostMarkdown(report: PostReplayReport): string;
```

结构示例：

```md
# 面试复盘报告：面试前模拟

## 问题真实意图

...

## 临场回答诊断

- **问题点**：具体分析

## 最佳融合回答

...
```

注意：

- 不要直接导出模型原始 JSON；
- 不要包含 API Key、环境变量、请求头或内部错误；
- Markdown 内容应来自标准化 report 对象；
- 文件名应安全，不包含用户输入里的特殊字符。

### 8.4 下载实现

前端可用浏览器 Blob 下载：

```ts
const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
const url = URL.createObjectURL(blob);
```

下载后释放：

```ts
URL.revokeObjectURL(url);
```

文件名建议：

```text
interview-replay-pre-YYYYMMDD-HHmm.md
interview-replay-post-YYYYMMDD-HHmm.md
```

### 8.5 后端影响

P1 不需要新增后端接口。Markdown 导出可以完全在前端基于 `report` 生成。

如果后续要服务端生成正式报告，再另行设计 `/api/export/markdown`，P1 不建议做。

### 8.6 验收

- 面试前报告可下载 Markdown；
- 面试后报告可下载 Markdown；
- Markdown 内容结构完整；
- 下载文件名稳定；
- 不包含敏感信息；
- 复制功能不被破坏。

## 9. 前后端协同

P1 中只有动态回答版本会影响提交 payload，但不改变 API contract。

### 9.1 面试前模式

```text
前端计时状态
  -> 锁定临场回答
  -> 用户填写冷静回答
  -> 使用 P0 /api/replay/pre
```

P1 不应让后端依赖浏览器计时结果。计时只用于产品体验和输入约束。

### 9.2 面试后模式

```text
动态版本列表
  -> 过滤空版本
  -> 至少 2 个有效版本
  -> 使用 P0 /api/replay/post
```

后端仍按 P0 schema 校验，必要时可增加最大版本数限制。

### 9.3 Markdown 导出

```text
API 返回 report
  -> 前端渲染报告
  -> 前端格式化 Markdown
  -> 用户复制或下载
```

不新增模型调用，不新增环境变量。

## 10. 状态管理规划

P1 状态复杂度主要在两个表单内部，不需要 Redux、Zustand 等全局状态库。

建议：

- 面试前计时状态封装到 `use-pre-answer-timer.ts`；
- 面试后回答版本状态封装到 `use-answer-versions.ts`；
- 报告导出不需要状态管理，只需要工具函数；
- 页面级状态仍保留 P0 的 `loading/error/result`。

避免：

- 在 `page.tsx` 里维护所有字段和计时逻辑；
- 用全局 store 保存单页表单；
- 为 P1 引入数据库或 localStorage 强依赖。

## 11. 类型规划

建议新增前端专用类型：

```ts
export type PreReplayStage =
  | "editing"
  | "ready"
  | "liveAnswering"
  | "liveLocked"
  | "abandoned"
  | "calmAnswering";

export type AnswerLockReason = "timeout" | "manual";

export type AnswerVersionDraft = {
  id: string;
  label: string;
  source: string;
  content: string;
};
```

位置建议：

```text
src/types/replay.ts
```

或拆分：

```text
src/types/ui.ts
```

如果类型只用于前端 UI，不要污染 API 请求/响应类型。

## 12. 测试与验证计划

P1 改动涉及交互状态，不能只跑 build。

必须验证：

```bash
npm run lint
npm run build
```

至少做一次 API 模拟调用：

- `/api/replay/pre` 缺字段返回 `VALIDATION_ERROR`；
- `/api/replay/post` 少于 2 个有效回答返回 `VALIDATION_ERROR`；
- `/api/questions` 输入非法 JSON 或模型返回异常时错误码清晰。

建议手动检查：

- 准备倒计时 5 秒未点击开始；
- 自定义作答倒计时结束后锁定；
- 提前结束锁定；
- 重新开始本轮模拟；
- 动态新增和删除回答版本；
- 只提交 2 个回答版本；
- 下载面试前 Markdown；
- 下载面试后 Markdown；
- 移动端宽度下按钮和计时器不重叠。

如果使用浏览器自动化，可优先覆盖：

- 首页可进入 `/pre` 和 `/post`；
- `/pre` 倒计时状态变化；
- `/post` 增删版本；
- 报告页下载按钮存在。

## 13. 实现顺序

建议按以下顺序推进：

1. 修复 P0 lint 和清理残留文件；
2. 修复 P0 已知错误处理问题；
3. 新增 Markdown formatter 和下载按钮；
4. 改造面试后动态回答版本；
5. 新增面试前阶段状态机；
6. 新增 5 秒准备倒计时；
7. 新增正式作答倒计时和锁定；
8. 补充 README 中的 P1 功能说明；
9. 运行 lint/build/API 模拟测试；
10. 新增 handoff。

原因：

- Markdown 导出独立、风险最低；
- 动态回答版本不改后端 contract；
- 倒计时和锁定会显著改造表单状态，放在后面更稳。

## 14. P1 验收标准

功能验收：

- 面试前模式支持问题显示后的 5 秒开始作答约束；
- 未在 5 秒内开始会进入放弃状态；
- 临场回答支持默认 60 秒倒计时；
- 用户可设置倒计时时间；
- 倒计时结束后临场回答锁定；
- 用户可提前结束并锁定临场回答；
- 面试后模式支持回答版本动态增删；
- 有效回答版本少于 2 个时不能提交；
- 报告支持 Markdown 下载；
- 现有一键复制仍可用。

工程验收：

- `npm run lint` 通过；
- `npm run build` 通过；
- API 模拟调用覆盖基本错误路径；
- 不新增真实密钥；
- 不新增本机绝对路径；
- README 同步更新；
- 新增 handoff 记录实际验证结果。

## 15. 风险与取舍

### 15.1 计时器状态复杂

风险：

- 5 秒准备倒计时和正式回答倒计时容易互相干扰；
- 用户重新开始后 interval 未清理可能造成状态错乱。

控制：

- 用 hook 集中管理；
- 每次阶段切换都清理旧 timer；
- 用时间戳计算剩余秒数。

### 15.2 临场回答锁定可能影响用户体验

风险：

- 用户误触或时间设置过短导致体验挫败。

控制：

- 默认 60 秒；
- 提供重新开始；
- 作答前明确提示锁定规则；
- P1 不把放弃状态提交给 AI。

### 15.3 动态回答版本导致报告过长

风险：

- 版本太多导致 token 过长，模型输出质量下降。

控制：

- 最多 6 个版本；
- 每个版本保留 P0 的长度限制；
- 提交前过滤空版本。

### 15.4 Markdown 导出和复制格式重复

风险：

- `copy-format.ts` 和 `markdown-export.ts` 逻辑重复。

控制：

- 短期允许少量重复；
- 后续可抽公共 section formatter；
- P1 不为此引入复杂抽象。

## 16. 后续扩展预留

P1 完成后，可为 P2 预留但不实现：

- 本地历史记录：保存 Markdown 或 report JSON 到 localStorage；
- 30 秒 / 60 秒回答切换：基于 P1 的倒计时配置继续扩展；
- 复盘卡片：基于 Markdown formatter 输出短版；
- 多轮训练记录：基于 report 类型和本地历史；
- 语音输入：替换或补充临场回答输入来源。

不要在 P1 中提前实现这些能力。当前阶段重点是让临场模拟更真实、复盘输入更灵活、报告结果可保存。

