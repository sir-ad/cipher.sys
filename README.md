
# cipher.sys

A to-do app. Except it hates you for using it.

[![NPM Version](https://img.shields.io/npm/v/@cipher.sys/terminal.svg?style=flat-square&color=ff0033)](https://www.npmjs.com/package/@cipher.sys/terminal)
[![GitHub Repo](https://img.shields.io/badge/github-sir--ad/cipher.sys-black?style=flat-square&logo=github)](https://github.com/sir-ad/cipher.sys)

The problem with productivity software is that it optimises for the feeling of productivity, not productivity itself. Infinite backlogs. Someday lists. Tags, priorities, subtasks, colour-coded urgency labels—all elaborate machinery for avoiding the one thing you should actually do right now.

cipher.sys is a constraint system disguised as a to-do app. The constraints are the feature.

---

## the rules

**5 tasks maximum.** No sixth. Ever. If everything feels important, nothing is. Choose.

**No backlog.** No someday list. No inbox. If it doesn't matter enough to be in the top 5 right now, it doesn't matter.

**7-day expiry.** Tasks auto-delete on day 8. The system does not negotiate. Urgency is manufactured by infinite lists; scarcity is real.

**Scorched Earth.** Complete all 5. The app self-destructs. Server shuts down. This is not a bug. This is the exit condition. The goal was never to use the app forever.

---

## install
```bash
npx @cipher.sys/terminal@latest
```

or globally:
```bash
npm install -g @cipher.sys/terminal
```

---

## architecture

### daemon

cipher.sys runs a detached Node.js daemon in the OS background. The terminal UI is just a window into it. Close the terminal—the daemon stays alive, tasks persist, expiry timers keep ticking. The server only dies when you earn it via Scorched Earth, or you kill it manually.

### storage

Tasks and stats live on your local filesystem. Custom JSON storage utility. No cloud. No sync. No account. Also SQLite via the daemon for structured persistence. Your data doesn't leave your machine.

### local network multiplayer — syndicate mode

cipher.sys nodes on the same local network find each other automatically using multicast-dns. No configuration. No server setup. They just discover each other.

Once connected via Socket.io:

- **Incoming Directives** — other nodes can push tasks to you. You accept or reject them.
- **Kill Verification** — when you complete a task, syndicate nodes can verify or deny the kill. Accountability is social.
- **Global Wipe Sequence** — any node can trigger a network-wide Scorched Earth. Everyone's server goes down together. Use wisely.

The local domain `http://cipher.local:4040` works via custom mDNS. Pure aesthetics. Fully functional.

### frontend

React 19. Tailwind CSS with a custom CRT/glitch theme built on top.

What's running visually:

- **CRT + vignette overlay** — simulates a curved cathode-ray monitor. The screen feels old and physical.
- **Scanline animation** — a slow horizontal sweep across the display. Continuous.
- **Glitch effects** — text flickers and corrupts on hover. Intentional visual noise.
- **Encrypted text transitions** — data scrambles before resolving into readable characters.
- **Fluid typography** — monospace, scales cleanly across screen sizes via dynamic CSS.
- **`#ff0033` on pure black.** That's the palette. Non-negotiable.

### focus mechanics

- **Target Engagement** — activate focus mode on a single task. Everything else blurs out. One thing. That's the point.
- **Stealth Mode (Boss Key)** — double-tap `Escape`. The interface vanishes instantly, replaced by a decoy terminal screen. For open offices and awkward moments.

---

## stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Tailwind CSS |
| UI Effects | Custom CRT, glitch, scanline, fluid typography |
| Backend | Node.js daemon, Express |
| Realtime | Socket.io |
| Network Discovery | multicast-dns |
| Storage | Local JSON + SQLite |
| Local Domain | cipher.local:4040 via mDNS |

---

## dev
```bash
# push to github
git add . && git commit -m "your message" && git push origin main

# publish to npm
npm version patch      # or minor, major
npm publish --access public

# docs
pip install -r requirements.txt
mkdocs serve           # preview locally
mkdocs gh-deploy       # push to github pages
```

CI handles doc deployment automatically on push to `main` via `.github/workflows/publish-docs.yml`.

---

## why

Most productivity systems are optimised for the wrong variable. They measure tasks added, not tasks done. They reward the system, not the outcome.

cipher.sys optimises for one thing: finishing. The constraints exist to make finishing the path of least resistance. The self-destruct exists so there's a real end state—not an endless queue that grows faster than you can empty it.

The best version of this app is the one you no longer need.

Use it. Finish. Let it die.

---

*end of transmission.*
