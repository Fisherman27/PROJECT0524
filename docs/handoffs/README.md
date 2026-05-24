# Handoff Records

本目录用于在 Codex、OpenCode、Cursor 或其他 AI Coding 工具之间交接上下文。每次只要修改了代码、配置、文档或依赖，都必须新增一条按时间命名的记录。

## 命名格式

```text
YYYY-MM-DD_HH-mm-ss_简短主题.md
```

示例：

```text
2026-05-24_00-20-00_project_workflow_setup.md
```

## 接手前固定动作

```powershell
git status --short
Get-ChildItem docs\handoffs | Sort-Object Name -Descending | Select-Object -First 5
```

然后读取：

- `AGENTS.md`
- `docs/handoffs/README.md`
- `docs/handoffs/` 中文件名时间最新的一条或几条记录

如果工作涉及具体子项目，还要读取子项目内的 agent/guide 文件。

## 交接记录模板

```md
# Handoff: 简短主题

## Tool

- Codex / OpenCode / Cursor / Other

## Changed Files

- path/to/file: changed what and why

## Reason

- Why this change was made.

## Git Status Summary

- Paste or summarize `git status --short`.

## Suggested Commit

- Files: list suggested files
- Message: suggested commit message

## Completed

- What was completed.

## Not Completed

- What remains.

## Verified

- Commands actually run and results.

## Not Verified

- What was not checked and why.

## Known Issues

- Any known bugs, risks, or constraints.

## Next Notes

- What the next tool/person should pay attention to.

## Env / Dependencies / Deployment Changes

- State whether env vars, dependencies, or deployment commands changed.
```

## 禁止写入

- 真实 API Key
- 服务器密码
- SSH 私钥
- 未脱敏的敏感公网服务器信息
- 只能在当前电脑使用的绝对路径

