# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
