# Interview Replay 前端轻量优化代码实现规划

## 1. 核心结论

根据当前代码完成情况，前端优化不需要再做大规模重构。

当前已经有：

- 首页材料工作台；
- 文件上传；
- 材料预分析；
- 双模式入口；
- pre/post 分阶段表单；
- Agent Pipeline 侧边栏；
- Loading 状态；
- 质量摘要；
- 折叠式报告；
- Markdown 导出。

因此本阶段代码实现目标是：

```text
在不改变后端 Agent 流程的前提下，补齐用户说明、操作引导、示例数据、报告阅读提示和空状态。
```

## 2. 实现边界

### 2.1 本阶段要做

- 首页增加短使用说明；
- 首页增加材料准备 checklist；
- 首页增加载入示例材料按钮；
- 模式卡片增加“适合场景”和“你需要准备”；
- pre/post 页面增加步骤引导；
- pre/post 表单增加更具体的填写提示；
- LoadingState 增加阶段文案；
- 报告页增加阅读顺序提示；
- 必要空状态提示补齐。

### 2.2 本阶段不做

- 不改 Agent Runner；
- 不改 API 路由；
- 不改请求数据结构；
- 不新增数据库；
- 不新增账号或历史记录；
- 不做服务端流式进度；
- 不重做页面设计；
- 不引入新依赖；
- 不大改报告信息架构。

## 3. 当前代码基础

### 3.1 首页

文件：

```text
src/app/page.tsx
```

已有能力：

- `useInterviewContext()` 管理背景信息、文件、材料分析结果；
- `MaterialFileManager` 管理文件上传；
- `handleAnalyzeMaterials()` 调用 `/api/agents/material`；
- `ModeCard` 展示两个模式入口；
- `AgentPipeline` 展示材料分析状态。

适合新增：

- 首页说明组件；
- 材料准备 checklist；
- 示例材料填充按钮；
- 模式卡片补充信息。

### 3.2 面试前页面

文件：

```text
src/app/pre/page.tsx
src/features/pre-replay/pre-replay-form.tsx
```

已有能力：

- 读取首页上下文；
- 问题预分析；
- 临场倒计时；
- 冷静回答；
- 最终提交；
- 加载时展示 AgentPipeline。

适合新增：

- 页面顶部步骤引导；
- 没有材料分析时的提醒；
- 问题、临场回答、冷静回答的填写提示；
- Loading 阶段说明。

### 3.3 面试后页面

文件：

```text
src/app/post/page.tsx
src/features/post-replay/post-replay-form.tsx
```

已有能力：

- 读取首页上下文；
- 问题预分析；
- 展示问题意图和建议材料；
- 多回答版本管理；
- 最终提交；
- 加载时展示 AgentPipeline。

适合新增：

- 页面顶部步骤引导；
- 没有材料分析时的提醒；
- 真实问题和回答版本填写提示；
- Loading 阶段说明。

### 3.4 报告展示

文件：

```text
src/features/pre-replay/pre-replay-result.tsx
src/features/post-replay/post-replay-result.tsx
src/components/report-section.tsx
```

已有能力：

- `QualitySummaryCard`；
- `ReportSection`；
- 折叠展开；
- 空状态参数；
- Markdown 导出按钮。

适合新增：

- 报告阅读顺序提示；
- 局部空状态文案微调；
- 轻量“为什么可信”说明。

## 4. 建议新增组件

为了避免把页面文件写得更长，建议新增少量纯展示组件。

### 4.1 `src/components/use-guide-panel.tsx`

用途：

- 首页展示“怎么使用”。

建议 props：

```ts
type UseGuidePanelProps = {
  compact?: boolean;
};
```

展示内容：

```text
1. 填材料
2. 分析材料
3. 选择模式
4. 生成复盘
```

实现要求：

- 纯展示；
- 不读写状态；
- 不调用 API；
- 使用当前 Tailwind 风格。

### 4.2 `src/components/material-readiness-panel.tsx`

用途：

- 根据用户材料给出轻量准备提示。

建议 props：

```ts
type MaterialReadinessPanelProps = {
  materials: string;
  targetDirection?: string;
};
```

建议内部规则：

```text
材料长度 >= 200 字
包含项目/系统/平台/实验/模型/算法等项目关键词
包含贡献/负责/实现/设计/优化/完成等贡献关键词
包含目标方向或研究方向
包含结果/提升/准确率/效率/指标/论文/奖项等结果关键词
```

输出：

- 已覆盖；
- 建议补充。

注意：

- 只是提示，不要叫评分；
- 不要阻止用户继续操作；
- 不调用 LLM。

### 4.3 `src/components/step-guide.tsx`

用途：

- pre/post 页面顶部展示当前流程。

建议 props：

```ts
type StepGuideProps = {
  steps: Array<{
    title: string;
    description: string;
  }>;
};
```

第一版可以不做 active 状态。

面试前 steps：

```text
确认问题
临场作答
冷静重答
生成复盘
```

面试后 steps：

```text
填写真实问题
添加回答版本
比较与诊断
提炼公式
```

### 4.4 `src/components/report-reading-guide.tsx`

用途：

- 报告顶部展示阅读建议。

建议 props：

```ts
type ReportReadingGuideProps = {
  mode: "pre" | "post";
};
```

面试前文案：

```text
建议先看质量摘要和最佳安全回答，再看临场损失、材料召回和导师压力测试。
```

面试后文案：

```text
建议先看质量摘要、回答排名和最佳安全回答，再看版本差异、材料召回和风险项。
```

### 4.5 `src/lib/demo-data.ts`

用途：

- 保存虚构示例材料。

建议导出：

```ts
export const demoInterviewContext = {
  interviewType: "...",
  targetDirection: "...",
  targetSchool: "...",
  backgroundMaterials: "...",
};
```

注意：

- 只放虚构脱敏内容；
- 不放真实学校敏感信息；
- 不放 API Key；
- 不需要 API。

## 5. 首页改造计划

文件：

```text
src/app/page.tsx
```

### 5.1 引入新组件

新增 imports：

```ts
import { UseGuidePanel } from "@/components/use-guide-panel";
import { MaterialReadinessPanel } from "@/components/material-readiness-panel";
import { demoInterviewContext } from "@/lib/demo-data";
```

### 5.2 增加载入示例材料函数

在 `Home` 组件内新增：

```ts
const handleLoadDemo = () => {
  update(demoInterviewContext);
  setMaterialError("");
};
```

如果希望避免误覆盖用户输入，可在按钮文案上写清楚：

```text
载入示例材料（会覆盖当前填写）
```

不建议第一版加 confirm 弹窗，减少交互复杂度。

### 5.3 首页标题下方插入使用说明

位置：

- `mainContent` 中标题区域后；
- 面试背景卡片前。

实现：

```tsx
<UseGuidePanel />
```

### 5.4 材料输入区插入准备提示

位置：

- textarea 和文件上传之间，或文件上传之后；
- 推荐放在 textarea 下方。

实现：

```tsx
<MaterialReadinessPanel
  materials={fullMaterials}
  targetDirection={data.targetDirection}
/>
```

### 5.5 分析材料按钮旁增加示例按钮

位置：

- “分析材料”按钮同一行；
- 使用次级按钮样式。

行为：

```tsx
<button type="button" onClick={handleLoadDemo}>
  载入示例材料
</button>
```

### 5.6 模式卡片补充场景信息

需要修改：

```text
src/components/mode-card.tsx
```

建议扩展 props：

```ts
fitFor?: string;
needs?: string;
```

首页传入：

面试前：

```text
fitFor="正式面试前，想练真实临场表达"
needs="一道问题 + 临场回答 + 冷静回答"
```

面试后：

```text
fitFor="真实面试后，想比较多个回答版本"
needs="真实问题 + 至少两个回答版本"
```

兼容性：

- props 设为可选；
- 不影响已有调用。

## 6. 面试前页面改造计划

文件：

```text
src/app/pre/page.tsx
src/features/pre-replay/pre-replay-form.tsx
```

### 6.1 页面顶部增加步骤引导

在标题和说明文字后加入：

```tsx
<StepGuide
  steps={[
    { title: "确认问题", description: "输入或生成一道练习题" },
    { title: "临场作答", description: "限时写下真实表达" },
    { title: "冷静重答", description: "补充遗漏证据和逻辑" },
    { title: "生成复盘", description: "查看损失、风险和救场模板" },
  ]}
/>
```

### 6.2 没有材料分析时给提醒

在表单上方判断：

```ts
!materialAnalysis
```

展示轻量提示：

```text
建议先回首页分析材料，这样系统能提前生成证据库；也可以继续填写，最终评审时会自动补跑。
```

需要提供返回首页链接。

### 6.3 表单提示文案微调

在 `PreReplayForm` 内调整：

- 面试问题 placeholder：

```text
尽量写完整问题，例如“请介绍一个你做过的科研或项目经历”
```

- 临场回答提示：

```text
请保留真实临场表达，不要事后润色，这样系统才能诊断表达损失。
```

- 冷静回答提示：

```text
补充刚才没说出的项目证据、个人贡献、结果和未来计划。
```

### 6.4 Loading 文案

在 `pre/page.tsx` 中调用：

```tsx
<LoadingState
  text="正在生成面试前复盘..."
  steps={[
    "复用材料证据库",
    "匹配回答中的材料证据",
    "分析临场损失",
    "模拟导师追问风险",
    "生成最佳安全回答",
  ]}
/>
```

这需要先扩展 `LoadingState` props。

## 7. 面试后页面改造计划

文件：

```text
src/app/post/page.tsx
src/features/post-replay/post-replay-form.tsx
```

### 7.1 页面顶部增加步骤引导

在标题和说明文字后加入：

```tsx
<StepGuide
  steps={[
    { title: "填写真实问题", description: "尽量还原导师原话" },
    { title: "添加回答版本", description: "至少两个版本用于比较" },
    { title: "比较与诊断", description: "识别更稳表达和追问风险" },
    { title: "提炼公式", description: "沉淀下一次可复用说法" },
  ]}
/>
```

### 7.2 没有材料分析时给提醒

同 pre 页面。

文案：

```text
建议先回首页分析材料。材料证据库越完整，多版本比较越能判断哪些表达有支撑。
```

### 7.3 表单提示文案微调

在 `PostReplayForm` 内调整：

- 问题 placeholder：

```text
尽量还原导师原话，例如“你在这个项目中的具体贡献是什么？”
```

- 回答版本区说明：

```text
建议至少填写“真实回答”和“事后修改版”。如果有同学建议或 AI 改写，也可以作为新版本加入。
```

### 7.4 Loading 文案

在 `post/page.tsx` 中调用：

```tsx
<LoadingState
  text="正在生成面试后复盘..."
  steps={[
    "复用材料证据库",
    "比较多个回答版本",
    "识别导师追问风险",
    "生成最佳安全回答",
    "提炼可迁移回答公式",
  ]}
/>
```

## 8. LoadingState 改造计划

文件：

```text
src/components/loading-state.tsx
```

当前：

```ts
export function LoadingState({ text = "正在分析中..." }: { text?: string })
```

建议改成：

```ts
type LoadingStateProps = {
  text?: string;
  steps?: string[];
};
```

展示逻辑：

- 没有 steps 时保持当前样式；
- 有 steps 时在 spinner 下方展示最多 5 条短步骤；
- 不做定时切换也可以，静态列出即可；
- 如需更强动态感，可以用 CSS pulse 标记第一条，但不是必须。

兼容性：

- 旧调用仍然可用；
- 不影响其他页面。

## 9. 报告页改造计划

文件：

```text
src/features/pre-replay/pre-replay-result.tsx
src/features/post-replay/post-replay-result.tsx
src/components/report-reading-guide.tsx
```

### 9.1 新增阅读顺序提示组件

新增组件：

```tsx
<ReportReadingGuide mode="pre" />
<ReportReadingGuide mode="post" />
```

插入位置：

- 复制按钮和 Markdown 导出按钮下方；
- `QualitySummaryCard` 上方或下方均可；
- 推荐在 `QualitySummaryCard` 上方，让用户先知道怎么看。

### 9.2 轻量“为什么可信”

如果时间允许，在报告底部“多角色诊断链”之前增加一小段说明。

实现方式：

- 可以直接写在 `ReportReadingGuide` 里；
- 或单独做 `TrustNote` 组件。

建议第一版合并到 `ReportReadingGuide`，减少组件数量。

### 9.3 空状态文案

检查使用 `ReportSection` 的位置。

优先补：

- 风险列表为空；
- 压力测试为空；
- 证据依据为空；
- 复盘卡片字段为空。

不要为了空状态重构所有列表，只在明显空白处加 `isEmpty` 或局部 fallback。

## 10. 推荐实现顺序

建议分 6 步完成：

### Step 1：新增纯展示组件和示例数据

新增：

```text
src/components/use-guide-panel.tsx
src/components/material-readiness-panel.tsx
src/components/step-guide.tsx
src/components/report-reading-guide.tsx
src/lib/demo-data.ts
```

风险低，不触碰业务逻辑。

### Step 2：首页接入

修改：

```text
src/app/page.tsx
src/components/mode-card.tsx
```

完成：

- 使用说明；
- 材料 checklist；
- 示例材料；
- 模式卡片补充信息。

### Step 3：pre/post 页面接入步骤引导和材料提醒

修改：

```text
src/app/pre/page.tsx
src/app/post/page.tsx
```

完成：

- 顶部步骤条；
- 缺少材料分析提醒；
- 加载文案传入。

### Step 4：表单提示微调

修改：

```text
src/features/pre-replay/pre-replay-form.tsx
src/features/post-replay/post-replay-form.tsx
```

完成：

- placeholder；
- 输入说明；
- 回答版本说明。

### Step 5：LoadingState 扩展

修改：

```text
src/components/loading-state.tsx
```

完成：

- `steps?: string[]`；
- 静态阶段列表。

### Step 6：报告阅读提示

修改：

```text
src/features/pre-replay/pre-replay-result.tsx
src/features/post-replay/post-replay-result.tsx
```

完成：

- 接入 `ReportReadingGuide`；
- 必要空状态微调。

## 11. 验收检查

代码完成后建议检查：

```text
首页：
- 进入后能看到使用流程
- 背景材料区有准备提示
- 载入示例材料能填充上下文
- 分析材料按钮仍正常
- 模式卡片能看出怎么选

面试前：
- 页面顶部有 4 步引导
- 没有材料分析时有提示
- 问题、临场回答、冷静回答提示更明确
- Loading 有具体诊断步骤

面试后：
- 页面顶部有 4 步引导
- 没有材料分析时有提示
- 多回答版本填写说明更明确
- Loading 有具体诊断步骤

报告：
- 顶部有阅读顺序提示
- 复制和 Markdown 导出不受影响
- 折叠区仍可展开收起
```

## 12. 验证建议

因为这是前端轻量改动，建议代码实现后至少做：

```bash
npm run build
```

如果时间紧，最低限度也要做代码检查：

- TypeScript props 是否匹配；
- 新组件路径是否正确；
- 没有新增未使用 import；
- 没有硬编码本机路径；
- 没有新增真实敏感信息。

## 13. 风险与控制

### 13.1 示例材料覆盖用户输入

风险：

- 用户已经填写材料后点击示例按钮，内容被覆盖。

控制：

- 按钮文案写清“载入示例材料”；
- 示例按钮放在次级位置；
- 第一版可不做复杂确认弹窗。

### 13.2 材料 checklist 被误解为质量评分

风险：

- 用户以为 checklist 是 AI 判断结果。

控制：

- 文案写成“准备提示”，不要写“评分”；
- 只显示“建议补充/已覆盖”。

### 13.3 页面信息过多

风险：

- 加说明后页面变啰嗦。

控制：

- 每个提示区只写 2-4 行；
- 使用折叠或浅色提示卡；
- 不重复解释多 Agent 技术。

### 13.4 当前工作区已有未提交改动

风险：

- 实现时误碰已有代码改动。

控制：

- 修改前先读相关文件；
- 只改计划列出的前端文件；
- 不运行会改变 Git 状态的命令；
- 每次改完新增 handoff。

## 14. 不需要调整后端

本次前端优化不需要修改：

```text
src/app/api/*
src/lib/agents/*
src/types/replay.ts
```

除非实现过程中发现类型已经不匹配，否则不要触碰后端和 Agent。

## 15. 最小可交付切片

如果只能做最小版本，建议只做：

```text
1. 首页使用说明
2. 载入示例材料
3. pre/post 步骤引导
4. Loading 阶段文案
5. 报告阅读提示
```

这五项最能提升 Demo 可理解性，而且不改变业务逻辑。

## 16. 最终判断

这次前端升级的重点不是“做更多功能”，而是“把已有功能讲清楚、串起来、让用户不迷路”。

代码实现应保持轻量、局部、可回退。只要用户能顺着提示完成一次材料分析、选择模式、提交回答、读懂报告，这一阶段就算达到目标。
