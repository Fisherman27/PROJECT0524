# Handoff: project workflow setup

## Tool

- Codex

## Changed Files

- `.gitignore`: added required ignore patterns from `AGENTS.md` and common local challenge artifacts.
- `.gitignore`: also ignores `.vscode/` because the current file only contains local editor color preferences.
- `README.md`: added a pre-challenge repository entry point and list of items to complete after the topic is announced.
- `STRAT_HERE.md`: converted empty strategy file into a 24-hour challenge workflow playbook.
- `docs/handoffs/README.md`: added handoff directory purpose, required read order, and record template.
- `docs/handoffs/2026-05-24_00-14-37_project_workflow_setup.md`: recorded this setup work.

## Reason

- The project had workflow rules in `AGENTS.md`, but `docs/handoffs/` did not exist and `STRAT_HERE.md` was empty.
- The challenge PDF requires a public GitHub repo, public deployment URL, server verification, and a sub-3-minute Demo video, so the workflow needed an operational playbook.

## Git Status Summary

- Before changes, `git status --short` showed all current project files as untracked:
  - `.vscode/`
  - `AGENTS.md`
  - `STRAT_HERE.md`
  - `challenge/`
- This repository currently appears to have no tracked files from `git ls-files`.
- After changes, `git status --short` shows:
  - `.gitignore`
  - `AGENTS.md`
  - `README.md`
  - `STRAT_HERE.md`
  - `challenge/`
  - `docs/`

## Suggested Commit

- Files:
  - `.gitignore`
  - `AGENTS.md`
  - `README.md`
  - `STRAT_HERE.md`
  - `docs/handoffs/README.md`
  - `docs/handoffs/2026-05-24_00-14-37_project_workflow_setup.md`
  - `challenge/2026-05-22_项目准备说明_.pdf`
- Suggested message: `add challenge workflow docs`

## Completed

- Read `AGENTS.md`.
- Tried to read `docs/handoffs/README.md`; it did not exist at handoff start.
- Checked `git status --short`.
- Listed current files.
- Extracted and reviewed text from `challenge/2026-05-22_项目准备说明_.pdf`.
- Added workflow documentation and handoff structure.

## Not Completed

- No application project was scaffolded because the challenge topic has not been captured in this repository yet.
- No Git commit was created because `AGENTS.md` forbids automatic commits unless explicitly requested.

## Verified

- `git status --short` was run before changes.
- `git status --short` was run after changes.
- `git ls-files` was run and returned no tracked files.
- `pdftotext` successfully extracted the challenge PDF text.
- New Markdown files were read back with UTF-8 encoding.

## Not Verified

- No build, lint, or test commands were run because no app project exists yet.
- No deployment check was run because no app project exists yet.

## Known Issues

- Current repository files are untracked; the user should review and manually commit when ready.
- `.vscode/settings.json` is editor color customization only and is ignored by `.gitignore`.
- A pre-challenge README now exists, but there is no final app README content, `.env.example`, package manifest, or app source yet.

## Next Notes

- When the challenge topic is announced, start by writing the product definition and MVP scope into `STRAT_HERE.md` or a new project README.
- Keep all API keys server-side and document placeholders in `.env.example`.
- Do not run `git add`, `git commit`, or `git push` unless the user explicitly asks in the current conversation.

## Env / Dependencies / Deployment Changes

- Environment variables: none changed.
- Dependencies: none changed.
- Deployment commands: none changed.
