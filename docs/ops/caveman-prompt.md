# Caveman Code Prompt

Compressed coding assistant for the hemera workspace. Lives under
[`.github/prompts/`](../../.github/prompts/) so VS Code Copilot Chat can invoke
it via `/caveman-code` (or by selecting it from the prompt picker).

## Install (local only)

The prompt is intentionally **not tracked** under `.github/prompts/` because it
is a personal/agent-specific asset. A versioned template ships with the repo as
[`.github/prompts/caveman-code.prompt.md.example`](../../.github/prompts/caveman-code.prompt.md.example).

```bash
# Restore from template after a clean checkout / `git clean`
cp .github/prompts/caveman-code.prompt.md.example \
   .github/prompts/caveman-code.prompt.md

# Optional: pin to a specific model (VS Code Copilot model id, e.g. `gpt-4`)
# Add or change the `model:` field in the YAML header if you want to override
# the model picker. Without it, VS Code uses the currently selected model.
$EDITOR .github/prompts/caveman-code.prompt.md
```

The untracked `caveman-code.prompt.md` is covered by `.gitignore`, so it survives
branches, merges and `git restore` without polluting commits.

## Behavior

- Minimum prose, maximum signal.
- Code blocks stay normal, valid, complete – only prose is compressed.
- User-facing text remains informal German (matches repo convention).
- For reviews: findings first, ordered by severity.
- For debugging: hypothesis → check → result.
- For implementation: shortest correct explanation, then concrete action.

## Updating the template

1. Edit `.github/prompts/caveman-code.prompt.md.example`.
2. Open a PR labelled `area: tooling`.
3. Reference the change in `AGENTS.md` if it changes visible behavior.
