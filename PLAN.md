# CIPHER v5.0.1 Reliability Hotfix Plan

## Summary
Patch release to harden LAN discovery/sync behavior and align launcher UX with install UX.

## Scope
1. Make `cipher.local` best-effort with mandatory IP fallback.
2. Enforce single authoritative host by default (`cipher up` auto-join).
3. Lock task mutations when disconnected from authoritative daemon.
4. Show ASCII banner on install and launch.
5. Preserve separate GitHub and npm release tracks.

## Files
1. `server.js`
2. `bin/cipher.js`
3. `scripts/postinstall.js`
4. `utils/runtimeState.js`
5. `utils/banner.js` (new)
6. `utils/discoveryClient.js` (new)
7. `hooks/useVanish.ts`
8. `components/ActiveTasks.tsx`
9. `components/LandingPage.tsx`
10. `App.tsx`
11. `README.md`
12. `docs/briefing/boot-sequence.md`
13. `docs/architecture/protocols.md`
14. `package.json`
15. `tests/cli-up-mode.test.js` (new)
16. `tests/discovery-mdns.test.js` (new)
17. `scripts/smoke/multidevice-sync.js` (new)

## Risks
1. LAN probe false-positives could send clients to wrong host.
2. Mutation lock may feel strict if a host is flaky.
3. Browser restrictions may limit public-page reachability checks.

## Mitigations
1. Verify host with `/healthz` + `X-Cipher: 1` before join.
2. Keep manual overrides: `--host`, `--join`, and UI IP override.
3. Keep connect fallback UX explicit in landing page.

## Validation Commands
1. `npm run build`
2. `npx tsc --noEmit`
3. `npm run test`
4. `node scripts/smoke/multidevice-sync.js`
5. `node bin/cipher.js up --host`
6. `node bin/cipher.js status`
7. `node bin/cipher.js stop`
8. `npm pack --dry-run`
