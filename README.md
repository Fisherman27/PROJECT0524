# AIIC 24-Hour Challenge Workspace

本仓库用于准备和承载北京大学人工智能创新中心 24 小时 AI 项目挑战赛作品。

当前状态：赛题尚未写入本仓库，已有内容主要是工程工作流、交接规范和比赛准备材料。赛题公布后，应将本 README 更新为正式项目说明。

## 当前文件

- `AGENTS.md`: 仓库级 AI Coding 工作流和工程规范。
- `STRAT_HERE.md`: 24 小时比赛执行手册。
- `docs/handoffs/`: 多工具交接记录。
- `challenge/2026-05-22_项目准备说明_.pdf`: 比赛准备说明。

## 开赛后需要补齐

- 项目简介和目标用户。
- 技术栈。
- 本地运行命令。
- `.env.example` 中每个变量的含义。
- 生产构建命令。
- 服务器启动命令。
- PM2 部署方式。
- 公网访问端口说明。
- 常见问题排查。

## 建议默认命令

实际命令以赛题确定后的工程目录为准。若使用 Node.js Web 项目，优先保持：

```bash
npm install
npm run dev
npm run build
npm start
```

## Git 规则

默认由用户手动执行 Git 提交。AI Coding 工具不能主动运行 `git add`、`git commit`、`git push`、`git reset`、`git checkout --`、`git restore`、`git stash`、`git rebase` 或 `git merge`，除非用户在当前对话中明确要求。

