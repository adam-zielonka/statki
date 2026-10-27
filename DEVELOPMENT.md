# Development

Use Node.js 24.22+ (24–26) and pnpm 12. The repository pins the verified package manager and runtime.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm test
pnpm build
pnpm audit --audit-level=high
```

Pull requests run validation without deploying. Pages deployment is restricted to
the default branch. Dependabot checks compatible updates weekly; major updates
are reviewed separately.

Engine tests cover complete matches, legal targeting, fleet integrity, hidden information, pause and restart cancellation.

Browser regression checks use native Chromium timers against the production build:

```sh
pnpm exec playwright install --only-shell chromium
pnpm build
pnpm test:browser
```

Do not replace the browser clock in these checks: fake timers can mask invalid
receivers on Window.setTimeout and Window.clearTimeout. Engine tests also assert
the receiver used by the default timer adapters.

To check an already published version with the same native-timer tests, set
`PLAYWRIGHT_BASE_URL=https://adam-zielonka.github.io/statki/` when running
`pnpm test:browser`. This skips the local preview server.
