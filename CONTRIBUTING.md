# Contributing

Thank you for helping make agent-operable creative tools easier to inspect and own.

## Before you start

- Search existing issues and discussions.
- Open an issue before a large change, new provider, or file-format break.
- Keep pull requests focused and explain the user problem they solve.
- Never include API keys, private designs, generated client work, or copyrighted assets you cannot redistribute.

## Local checks

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm smoke
```

For UI changes, include before/after screenshots at a wide and narrow viewport. Check keyboard focus, readable contrast, and that controls remain reachable without precise pointer work.

For MCP changes, keep stdout protocol-only, return structured content with a text fallback, and test the changed tool from an actual stdio client.

For data-model changes, preserve existing design files or include a documented migration. Do not put provider credentials into the design schema.

## Pull requests

Describe:

1. the problem;
2. the chosen behavior;
3. the checks you ran;
4. screenshots or MCP transcripts when relevant;
5. any compatibility or security impact.

By contributing, you agree that your contribution may be distributed under the repository's AGPL-3.0-or-later license and certify that you have the right to submit it (Developer Certificate of Origin 1.1). Add `Signed-off-by: Your Name <email>` to commits.
