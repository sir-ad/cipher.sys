# Hotfix Plan: Blank Screen After Global Install

## Problem Statement
- Global/npm installs of `@cipher.sys/terminal@4.1.2` can render a blank page.
- Root causes:
  - `dist/` is excluded from published package because npm falls back to `.gitignore`.
  - Server then serves source `index.tsx`, which the browser rejects as a module due to MIME type.
- Secondary issue:
  - Launcher opens `http://cipher.local:4040` by default, which can fail with NXDOMAIN on hosts without working mDNS resolution.

## Files To Change
- `package.json`
- `package-lock.json`
- `bin/cipher.js`
- `server.js`
- `CHANGELOG.md`

## Risks And Mitigations
- Risk: npm tarball misses required runtime files.
  - Mitigation: enforce `prepack` build and explicit `files` whitelist.
- Risk: mDNS behavior regressions on some networks.
  - Mitigation: keep `localhost` as primary launch target; mDNS remains optional alias.
- Risk: launcher exits early if dist missing in local dev scenarios.
  - Mitigation: actionable error message explains rebuild path (`npm run build`).

## Step-by-Step Tasks
1. Bump package version to `4.1.3`.
2. Add `prepack` script to build before packaging.
3. Add `files` whitelist to include runtime artifacts (`bin/`, `dist/`, `server.js`, docs/license/changelog).
4. Add launcher preflight check for `dist/index.html`.
5. Switch launcher default URL to `http://localhost:4040`.
6. Keep fallback guidance including optional `http://cipher.local:4040`.
7. Harden mDNS query handling in server for case-insensitive and trailing-dot hostnames across all questions.
8. Add changelog entry for `4.1.3`.

## Validation Commands
1. `npm run build`
2. `npm pack --dry-run --cache /tmp/npm-cache-cipher`
3. `npm pack --cache /tmp/npm-cache-cipher`
4. `TMP=$(mktemp -d) && cd "$TMP" && npm init -y && npm install /Users/starlord/Downloads/vanish-2/cipher.sys-terminal-4.1.3.tgz && ls -la node_modules/@cipher.sys/terminal/dist`
5. `node /Users/starlord/Downloads/vanish-2/bin/cipher.js`

## Rollback Strategy
1. Revert the hotfix commit.
2. Restore previous launch and packaging behavior.
3. If already released, publish follow-up patch with corrected packaging/launcher behavior.
