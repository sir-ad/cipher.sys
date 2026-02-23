# CIPHER.SYS // TERMINAL

> The to-do app that wants you to stop using it.

[![NPM Version](https://img.shields.io/npm/v/@cipher.sys/terminal.svg?style=flat-square&color=ff0033)](https://www.npmjs.com/package/@cipher.sys/terminal)
[![GitHub Repo](https://img.shields.io/badge/github-sir--ad/cipher.sys-black?style=flat-square&logo=github)](https://github.com/sir-ad/cipher.sys)

**Philosophy**: You don't need a to-do app. You need to DO things.

`CIPHER.SYS` is an anti-productivity terminal. It forces you to prioritize by imposing strict constraints. 

## ⚠️ RULES OF ENGAGEMENT

1. **Max 5 tasks at once.** No endless backlogs.
2. **No "someday" list.** If it's not important now, it's not important.
3. **Tasks expire in 7 days.** Auto-deleted if you don't act.
4. **App self-destructs.** When all tasks are complete, the terminal closes.

## 🚀 INSTALLATION

You can run the terminal directly via `npx`:

```bash
npx @cipher.sys/terminal@latest
```

Or install it globally:

```bash
npm install -g @cipher.sys/terminal
```

## 💻 DEPLOYMENT & DEVELOPMENT

### GitHub Deployment

To push your latest changes to GitHub:

```bash
git add .
git commit -m "Update terminal protocols"
git push origin main
```

### Publishing to NPM

To publish a new version to NPM:

1. Update the version in `package.json` (e.g., `npm version patch` or `npm version minor`)
2. Publish the package:
```bash
npm publish --access public
```

### Documentation (MkDocs)

This repository uses MkDocs for documentation.

1. Install MkDocs dependencies:
```bash
pip install -r requirements.txt
```
2. Serve locally:
```bash
mkdocs serve
```
3. Deploy to GitHub Pages:
```bash
mkdocs gh-deploy
```

*Note: The `.github/workflows/publish-docs.yml` file is already set up to automatically publish your docs to GitHub Pages whenever you push to the `main` branch.*

## 🛠️ TECH STACK

- **Frontend**: React 19, Tailwind CSS (Custom CRT/Glitch theme)
- **Backend/Network**: Socket.io (for Syndicate/Multiplayer mode), Express (Daemon)
- **Storage**: Local Storage & SQLite (via Daemon)

## 🕶️ STEALTH MODE

Press `Escape` twice rapidly to trigger Boss Key / Stealth Mode.

---
*End of transmission.*
