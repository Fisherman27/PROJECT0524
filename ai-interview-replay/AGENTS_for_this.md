# AGENTS for ai-interview-replay

本文件只约束 `ai-interview-replay/` 子项目。根目录 `AGENTS.md` 仍然是仓库级通用规则；如果两者冲突，优先满足安全、部署和 Git 权限边界。

## 1. 子项目定位

`ai-interview-replay/` 是保研面试复盘工具 Interview Replay 的项目目录。

产品目标：

- 面向准备保研复试、夏令营、预推免、导师组面试的本科生；
- 通过“面试前模拟”和“面试后复盘”两种模式，帮助用户诊断回答中的表达损失、证据缺失、逻辑漏洞和导师追问风险；
- P0 阶段只实现文字输入、AI 结构化复盘报告、最佳融合回答、救场模板或回答公式、一键复制。

## 2. 目录职责

```text
ai-interview-replay/
├─ AGENTS_for_this.md
├─ GUIDES/
├─ README.md
├─ .env.example
├─ package.json
└─ src/
```

当前阶段：

- `GUIDES/` 专门放规划类文件、产品设计、实现计划、架构说明和阶段复盘；
- `GUIDES/1-ProjectProposal.md` 是产品策划；
- `GUIDES/2-CodePlanOfP0.md` 是 P0 实现规划；
- `GUIDES/README.md` 说明规划文件的维护方式；
- 运行时代码后续应放在 `src/`；
- 不要把运行时代码放进 `GUIDES/`。

## 3. 接手顺序

每次处理本子项目时，先读取：

1. 根目录 `AGENTS.md`；
2. 根目录 `docs/handoffs/README.md`；
3. 根目录 `docs/handoffs/` 最新交接记录；
4. `ai-interview-replay/AGENTS_for_this.md`；
5. `ai-interview-replay/GUIDES/README.md`；
6. 与当前任务相关的 `GUIDES/*.md`。

然后运行或查看：

```bash
git status --short
```

## 4. P0 技术边界

P0 建议使用：

- Next.js App Router + TypeScript；
- Tailwind CSS；
- Next.js API Routes；
- 服务端 LLM 调用；
- Node.js + npm + PM2 部署。

P0 不做：

- 账号系统；
- 数据库；
- PDF 简历解析；
- 语音输入；
- 视频回放；
- 长期训练记录；
- 院校或导师信息库；
- 多用户权限系统。

## 5. 前后端原则

- 前端只负责表单、状态、报告展示和复制；
- 后端负责输入校验、prompt 构建、模型调用、报告结构化；
- 前端请求后端 API 必须使用相对路径，例如 `/api/replay/pre`；
- API Key 只能在服务端读取；
- 报告结构应稳定，避免直接展示不可控的大段模型输出；
- 如果模型输出不符合结构，后端要给出清晰错误或做最小标准化处理。

## 6. 环境变量规则

- 真实密钥只放 `.env.local` 或服务器环境变量；
- 仓库只提交 `.env.example`；
- 服务端密钥不要使用 `NEXT_PUBLIC_`；
- 缺少必要变量时，API 返回清晰错误；
- README 必须解释每个环境变量。

建议变量：

```text
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.example.com/v1
LLM_MODEL=your_model_name
PORT=3000
```

## 7. Git 和交接

- 默认不要运行 `git add`、`git commit`、`git push`、`git reset`、`git checkout --`、`git restore`、`git stash`、`git rebase`、`git merge`；
- 修改代码、配置、文档或依赖后，必须在根目录 `docs/handoffs/` 新增交接记录；
- 交接记录必须写明实际验证结果和未验证原因；
- 不要把推测写成已验证事实。

## 8. 实现优先级

实现时按以下顺序推进：

1. 可运行项目骨架；
2. 两种模式页面；
3. 服务端 AI 复盘接口；
4. 固定结构报告展示；
5. 一键复制；
6. README、`.env.example`、构建和部署说明；
7. 生产构建验证。

视觉和交互动效不能优先于 P0 闭环。

