# Agent workflow

Artifacts of the AI-driven development process described in the [main README](../../README.md#how-it-was-built-claude-code--ralph).

| File | Purpose |
|------|---------|
| [`prd-hr-portal.md`](prd-hr-portal.md) | Product requirements document (human-readable). |
| [`prd.json`](prd.json) | Same requirements as user stories with `passes: true/false` state, consumed by Ralph. |
| [`ralph.sh`](ralph.sh) | Loop that runs the agent repeatedly against the PRD (`./docs/agent-workflow/ralph.sh --tool claude 10`). |
| [`RALPH_CLAUDE.md`](RALPH_CLAUDE.md) | Prompt given to the agent on every iteration. |
| [`progress.txt`](progress.txt) | Append-only log of learnings and patterns across iterations. |
| [`INSTRUCTION.md`](INSTRUCTION.md), [`GEN_UI_DESIGN.md`](GEN_UI_DESIGN.md) | Frontend redesign instructions and design notes. |

`.last-branch` and `archive/` are created by `ralph.sh` at runtime and are gitignored.
