# Project Coding Workflow Rules

本文件只约束本仓库的写代码流程与工程规范，不规定产品功能优先级。目标是：本地能稳定运行，上传 GitHub 后不泄露敏感信息，服务器从 GitHub clone 后能按文档直接安装、构建、启动。

## 1. 总原则

- 每次写代码都必须同时考虑三个环境：
  - 本地开发环境；
  - GitHub 仓库环境；
  - 干净云服务器部署环境。
- 每次接手项目时，无论使用 Codex、OpenCode 还是其他 AI Coding 工具，都必须先读取本文件和 `docs/handoffs/` 下最新的交接记录。
- 如果本次工作涉及 `ai-multimodal-coach/` 子项目，必须继续读取 `ai-multimodal-coach/Agents_for_this.md` 和 `ai-multimodal-coach/guides/` 下的相关 guide。根目录 `AGENTS.md` 只定义通用工作流，子项目具体架构、目录职责、界面计划和扩展约束以后以子项目内 guide 为准。
- 不写只能在当前电脑上运行的代码。
- 不依赖未写入 `package.json` 的全局工具、全局 npm 包、本机绝对路径或 IDE 配置。
- 不把真实密钥、服务器密码、SSH 私钥、个人本机路径提交到 GitHub。
- 所有启动、构建、部署命令必须能被 README 或脚本复现。
- Agent 必须客观记录事实：实现了什么、没有实现什么、验证了什么、没有验证什么、还存在什么问题。不能把推测当成验证结果。

## 2. 文件与路径规范

- 代码中禁止硬编码本机路径，例如 `D:\...`、`C:\Users\...`、`/Users/...`。
- 需要访问项目内文件时，使用项目相对路径或运行时安全解析路径。
- 前端请求本项目后端 API 时，优先使用相对路径，例如 `/api/text`，不要写死 `http://localhost:3000`。
- 服务器端口必须允许通过环境变量覆盖，例如 `PORT=3000`。
- 上传文件、临时文件、缓存文件如果不是交付代码，必须进入 `.gitignore`。

## 3. 依赖规范

- 新增运行时依赖必须写入 `dependencies`。
- 新增开发依赖必须写入 `devDependencies`。
- 不假设服务器已经安装某个 npm 全局包，除非 README 的部署步骤明确要求安装，例如 `pm2`。
- 必须提交锁文件，例如 `package-lock.json`，保证服务器安装结果可复现。
- 如果更换包管理器，只能使用一种包管理器，并同步更新 README。

## 4. 环境变量规范

- 真实环境变量只放在本地 `.env.local`、服务器环境变量或服务器 `.env.local`。
- 必须提供 `.env.example`，只写变量名和占位符，不写真实值。
- 服务端密钥变量不要使用 `NEXT_PUBLIC_` 前缀。
- API Key 只能在服务端代码中读取，例如 `process.env.DEEPSEEK_API_KEY`。
- 前端不能接收、打印、展示、传递真实 API Key。
- 如果缺少必要环境变量，后端应返回清晰错误，方便服务器排查。

## 5. Git 权限边界与提交规范

默认情况下，所有 Git 提交动作都由用户手动完成，Agent 不允许自动提交。

Agent 可以运行只读 Git 命令，例如：

```bash
git status --short
git diff
git log --oneline -5
```

Agent 禁止主动运行会改变 Git 状态、历史或远端的命令，包括但不限于：

```bash
git add
git commit
git push
git reset
git checkout --
git restore
git stash
git rebase
git merge
```

- 除非用户在当前对话中明确要求，否则 Agent 不能创建分支、切换分支、stash、rebase、merge 或 push。
- 即使用户曾经在其他对话中允许过，也不能视为永久授权。
- Agent 可以建议应提交哪些文件和 commit message，但只能写成建议，由用户决定是否执行。
- 如果用户明确要求 Agent 执行某次 Git 提交，也必须只针对这一次请求生效，不能改变默认禁止自动提交的规则。

- `.gitignore` 必须至少覆盖：

```text
node_modules
.next
out
build
coverage
.env
.env*.local
*.log
*.pem
```

- 用户手动提交前，应确认 `.env.local` 未被跟踪：

```bash
git status --short
```

- 每个 commit 应表达一个清晰改动，不把无关修改混在一起。
- Agent 只能建议 commit 信息，示例：
  - `add env example`
  - `fix server build config`
  - `document pm2 deployment`
- 避免 `update`、`fix`、`test`、`111` 这类无信息提交。
- 不提交本机测试产生的大文件、录屏原文件、缓存目录或临时调试脚本，除非它们是明确交付物。

## 6. 本地运行规范

- 本地开发命令必须在 README 中写清楚。
- 推荐统一为：

```bash
npm install
npm run dev
```

- 本地验证至少包括：

```bash
npm run build
```

- 如果项目有 lint 或 test，也要保持可运行：

```bash
npm run lint
npm test
```

- 不能只验证开发模式，也要验证生产构建，因为服务器通常运行构建后的项目。

## 7. 服务器 clone 后可用规范

服务器从 GitHub 拉取代码后，应能按以下通用流程启动：

```bash
git clone <repo-url>
cd <repo>
npm install
cp .env.example .env.local
# 手动填写 .env.local 中的真实密钥
npm run build
npm start
```

- 如果实际项目在子目录中，README 必须明确 `cd` 到哪个目录。
- `npm start` 必须存在并能启动生产服务。
- 如果使用 PM2，README 必须给出完整命令，例如：

```bash
pm2 start npm --name aiic-project -- start
pm2 logs aiic-project
pm2 restart aiic-project
pm2 save
```

- 服务器更新代码的流程也要写清楚：

```bash
git pull
npm install
npm run build
pm2 restart aiic-project
```

## 8. README 必备内容

README 必须能让一个新环境复现项目，至少包含：

- 项目简介；
- 技术栈；
- 本地运行命令；
- `.env.example` 中每个变量的含义；
- 生产构建命令；
- 服务器启动命令；
- PM2 部署方式；
- 公网访问端口说明；
- 常见问题排查，例如端口未开放、环境变量缺失、构建失败。

README 中不能出现真实 API Key、服务器密码、私钥或只属于当前电脑的路径。

## 9. 分级验证与代码可部署检查

不是每次小改都需要完整检查端口和公网访问。验证范围应匹配改动风险：

- 小改：只改文案、局部样式、局部提示词或局部后端逻辑时，做相关局部检查，并在 handoff 中说明未运行完整构建或部署验证的原因。
- 构建相关改动：改依赖、配置、API 路由、环境变量、构建脚本或 Next.js 配置时，至少运行 `npm run build`。
- 部署相关改动：改启动脚本、端口、PM2、服务器部署说明、环境变量名称或最终提交前，才执行服务器 clone、端口和公网访问检查。

用户手动 push 或部署前建议检查：

- `npm install` 能安装依赖；
- `npm run build` 能通过；
- `npm start` 能启动生产服务；
- `.env.example` 已更新；
- `.env.local` 未被 Git 跟踪；
- README 的命令与实际脚本一致；
- 代码中没有本机绝对路径；
- 代码中没有真实 API Key；
- 前端没有硬编码 `localhost` 作为生产接口；
- 服务器需要开放的端口已在 README 中说明。

## 10. 出问题时的排查顺序

- 先看本地是否能 `npm run build`。
- 再看服务器 Node.js 和 npm 版本是否满足 README 要求。
- 再看服务器是否正确创建 `.env.local`。
- 再看 `npm install` 是否完整成功。
- 再看 `npm start` 或 PM2 日志。
- 最后检查云服务器安全组或防火墙端口是否开放。

## 11. 多工具交接规范

为了在 Codex、OpenCode、Cursor 或其他工具之间切换时不丢上下文，每次开始和结束工作都必须维护交接记录。

### 接手前必须做

- 读取 `AGENTS.md`。
- 读取 `docs/handoffs/README.md`。
- 读取 `docs/handoffs/` 中文件名时间最新的一条或几条记录。
- 执行或查看：

```bash
git status --short
```

- 如果发现未提交改动，先判断哪些是前一个工具留下的，不能随意覆盖或删除。

### 每次完成改动后必须做

- 在 `docs/handoffs/` 新增一条按时间命名的记录，格式：

```text
YYYY-MM-DD_HH-mm-ss_简短主题.md
```

- 记录内容必须包含：
  - 本次使用的工具；
  - 修改了哪些文件；
  - 为什么改；
  - Git 状态摘要；
  - 建议提交哪些文件和建议 commit message，但不能执行提交；
  - 已完成内容；
  - 未完成内容；
  - 实际验证结果；
  - 未验证内容和原因；
  - 已知问题；
  - 下个工具需要注意的事项或改进点；
  - 是否涉及环境变量、依赖、部署命令变化。
- 如果只是回答问题、没有改文件，可以不新增记录；但只要改了代码、配置、文档或依赖，就必须新增记录。

### 交接记录不能包含

- 真实 API Key；
- 服务器密码；
- SSH 私钥；
- 未脱敏的公网服务器敏感信息；
- 只能在当前电脑使用的绝对路径。

### 推荐接手顺序

```bash
git status --short
Get-ChildItem docs/handoffs | Sort-Object Name -Descending | Select-Object -First 5
```

在 Linux 服务器上可用：

```bash
git status --short
ls -1 docs/handoffs | sort -r | head -5
```
