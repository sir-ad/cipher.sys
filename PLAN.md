# CIPHER v5 Plan (GitHub and npm Released Separately)

## Summary
Use two independent release tracks:
1. GitHub track for code/docs PR + merge.
2. npm track for package publish at a separate time.

## Release Model Update
1. Do not couple npm publish timing to GitHub merge.
2. Keep a release manifest per run with:
   - `version` or `version_target`
   - `git commit SHA`
   - `date_utc`
   - `channel` (`github` or `npm`)
3. Prefer publishing npm from a known commit SHA.

## Track A: GitHub
1. Branch from `origin/main` using `ad/cipher-v5-release`.
2. Finalize runtime, docs, README, GIF, and architecture/protocol content.
3. Validate build/typecheck/CLI/API/MCP smoke checks.
4. Push branch and open PR to `main`.
5. Record GitHub manifest in `release-manifests/github-track.json`.

## Track B: npm (Separate Session)
1. Checkout intended publish commit on `main`.
2. Authenticate npm.
3. Set version (`5.0.0` target).
4. Validate with `npm run build` and `npm pack --dry-run`.
5. Publish with `npm publish --access public`.
6. Verify `npm view` and `npx @cipher.sys/terminal@latest`.
7. Record npm manifest from template.

## Content Requirements
1. Founder-style clean README rewrite.
2. GIF embed from `docs/assets/rollbot.gif`.
3. Mermaid architecture diagram in README.
4. Deep tech features + protocol catalog.
5. Mission-style narrative and mission debrief behavior.
6. Local LLM/Ollama integration explanation.

## Validation Commands
1. `npm run build`
2. `npx tsc --noEmit`
3. `node bin/cipher.js up`
4. `node bin/cipher.js status`
5. `node bin/cipher.js mcp start`
6. `node bin/cipher.js stop`
7. `npm pack --dry-run`

## Rollback
1. Revert PR branch before merge if needed.
2. If npm release is wrong, publish corrective follow-up version.
3. Keep GitHub and npm rollback independent.
