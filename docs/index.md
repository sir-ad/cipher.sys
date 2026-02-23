# [!] CONNECTION SECURED

Welcome to the **CIPHER.SYS** Field Manual (V4 Phoenix).

This repository contains classified operational guidelines for deploying and surviving the autonomous covert terminal.

## THE PHILOSOPHY_

Most to-do apps want you to stay. They want engagement. They give you points, infinite sub-folders, and "someday" lists. They are a psychological trap where the act of planning replaces the act of executing.

**CIPHER.SYS wants you gone.**

It operates on a principle of absolute constraint and terminal consequences:

1. **MAXIMUM CAPACITY:** You cannot exceed 5 active directives.
2. **THERMAL DECAY:** Directives unexecuted within 168 hours (7 days) are permanently purged.
3. **SCORCHED EARTH:** Upon completion of all targets, the interface self-destructs to prevent lingering.

---

## ARCHITECTURE OVERVIEW

CIPHER is not a standard web application. It runs as a detached Node.js daemon on your local hardware, serving the tactical UI via a socket connection.

* **Zero Cloud:** All telemetry remains on the host machine via SQLite / LocalStorage.
* **Network Isolation:** Operates fully offline, utilizing mDNS for local network discovery.
* **AI Interrogation:** If an active Ollama instance is detected on port `11434`, the daemon spins up an AI Handler to issue aggressive, contextual sitreps based on your host system's RAM and CPU usage.

```bash
# Initiate the ghost protocol
npm run start
```

Proceed to the [Boot Sequence](briefing/boot-sequence.md) to initialize your command node.
