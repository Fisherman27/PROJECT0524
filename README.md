# AIIC 24-Hour Challenge Workspace

本仓库承载北京大学人工智能创新中心 16 小时 AI 项目挑战赛作品 — **Interview Replay（保研面试复盘工具）**。

## 项目简介

Interview Replay 是一个面向保研学生的文字版 AI 面试复盘教练，通过"面试前临场模拟"和"面试后多版本复盘"两种模式，帮助学生诊断回答中的表达损失、证据缺失、逻辑漏洞和导师追问风险，并生成下一次可复用的回答策略。

## 快速开始

```bash
cd ai-interview-replay
npm install
cp .env.example .env.local
# 编辑 .env.local 填入真实 LLM_API_KEY
npm run dev
```

详见 `ai-interview-replay/README.md` 获取完整部署、环境变量和 PM2 说明。

## 文件结构

- `AGENTS.md`: 仓库级 AI Coding 工作流和工程规范。
- `STRAT_HERE.md`: 24 小时比赛执行手册。
- `docs/handoffs/`: 多工具交接记录。
- `ai-interview-replay/`: 比赛作品 — Interview Replay 应用源码。
- `challenge/`: 比赛说明 PDF。

## Git 规则

默认由用户手动执行 Git 提交。AI Coding 工具不能主动运行 `git add`、`git commit`、`git push`、`git reset`、`git checkout --`、`git restore`、`git stash`、`git rebase` 或 `git merge`，除非用户在当前对话中明确要求。
