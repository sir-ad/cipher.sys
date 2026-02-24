# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Deterministic runtime lifecycle commands: `cipher up`, `cipher stop`, `cipher status`, `cipher open`, and `cipher mcp start`.
- Auto-clean bootstrap flow (stop old runtime, clean artifacts, start fresh daemon, wait on health, open browser).
- Daemon health and control interfaces (`/healthz`, `/api/discovery`, `/api/state`, `/api/tasks`, `/api/shutdown`).
- MCP server and tool surface for daemon control and local Ollama integration.
- Runtime state management utilities for PID/state/log cleanup and stale process recovery.
- Browser state wipe utility for destructive terminal exits.
- New architecture and protocol documentation pages.
- Release manifest templates for separate GitHub and npm release tracks.

### Changed
- README rewritten with deep technical feature map, protocol catalog, architecture diagram, and mission narrative.
- Boot sequence documentation updated to `cipher up` lifecycle model.
- In-app docs/source links normalized to canonical URLs.

## [4.1.3] - 2026-02-23

### Fixed
- **NPM Runtime Packaging**: Published package now ships compiled `dist/` assets to avoid blank-page module MIME failures after global install.
- **Deterministic Launch URL**: Launcher now opens `http://localhost:4040` by default; `http://cipher.local:4040` remains an optional alias when mDNS is available.
- **mDNS Query Matching**: Hardened `cipher.local` discovery by normalizing case, trimming trailing dots, scanning all DNS questions, and falling back to `127.0.0.1` when no non-internal IPv4 is present.

## [4.1.0] - 2026-02-23

### Added
- **Official NPX Support**: Added `terminal` and `cipher` binary links to `package.json`. Users can now run `npx @cipher.sys/terminal`.
- **Enhanced Documentation**: Integrated MkDocs for a comprehensive Field Manual.
- **Improved UX**: New CRT/Glitch terminal aesthetic and Boss Key (Escape x2) functionality.
- **Automatic Deployment**: Configured GitHub Actions for automatic documentation publishing to GitHub Pages.

### Fixed
- **Deployment Protocol**: Resolved MkDocs configuration error regarding missing `custom_dir`.
- **Repository Metadata**: Corrected repository and homepage URLs in `package.json` and `mkdocs.yml`.
- **Bin Linking**: Fixed the `bin` path in `package.json` for proper global installation.

### Changed
- **Branding**: Updated `README.md` with the new Phoenix Protocol branding and rules of engagement.
- **Version Transition**: Transitioned from v4-beta to v4.1.0 stable release.

## [4.0.0] - 2026-02-22

### Added
- Initial v4 Phoenix architecture.
- Self-destructing task engine (Max 5 tasks).
- 7-day task expiry protocol.
- Syndicate/Multiplayer mode via socket.io.
- mDNS local domain resolution (`cipher.local`).
