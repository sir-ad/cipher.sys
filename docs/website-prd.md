# [CLASSIFIED] PRD: CIPHER PUBLIC UPLINK (WEBSITE)

## 1. EXECUTIVE SUMMARY

**CIPHER.SYS** currently operates as a localized daemon and terminal application. To expand the operative network and recruit new nodes, we require a public-facing uplink (Landing Page). 

This website must embody the brutalist, anti-engagement philosophy of the terminal itself. It is not a standard SaaS marketing page; it is a stark warning, a manifesto, and a recruitment node. It must filter out standard consumers and attract our core demographic: productivity minimalists, developers, and operatives suffering from cognitive overload (ADHD).

**Objective:** Create a highly immersive, brutalist, sci-fi landing page to distribute the CIPHER desktop/local daemon and articulate its radical anti-productivity philosophy.

---

## 2. DESIGN LANGUAGE & AESTHETICS

The website must feel like discovering an unsecured military terminal. 

*   **Color Palette:** Absolute Black (`#000000`), Stark Red (`#ff0033`), Terminal Gray (`#d1d5db`).
*   **Typography:** Monospace exclusively (e.g., `Fira Code`, `Roboto Mono`). Massive, aggressive weight for headings. 
*   **Visual Effects:** CRT scanlines, vignette edges, phosphor glow, CSS-based glitch animations on hover.
*   **Copywriting:** Espionage terminology. No standard marketing fluff (e.g., replace "Sign Up" with `[ INITIALIZE HANDSHAKE ]`, replace "Features" with `[ TACTICAL CAPABILITIES ]`).
*   **Hostile UX:** The site should feel slightly dangerous but highly intriguing. Heavy use of redacted text (`<span class="redacted">`) that reveals itself on hover.

---

## 3. CORE SITE ARCHITECTURE

The landing page will be a single, long-scroll index with distinct tactical zones.

### A. HERO: THE BOOT SEQUENCE
*   **Visual:** Black screen. A simulated terminal boots up, printing initialization logs.
*   **Headline:** `PRODUCTIVITY IS A TRAP. WE WANT YOU GONE.`
*   **Sub-headline:** The self-destructing terminal. Max 5 directives. 7-day thermal decay. 
*   **Primary CTA:** `[ INITIATE LOCAL NODE ]` (Scrolls to install instructions).

### B. THE PHILOSOPHY (Why we built this)
*   **Section focus:** Attack standard to-do apps (Jira, Todoist, Notion).
*   **Copy:** "Most apps want engagement. They give you points, infinite sub-folders, and 'someday' lists. They are a psychological trap where planning replaces executing. CIPHER operates on absolute constraint and terminal consequences."

### C. TACTICAL CAPABILITIES (Features)
Showcase the brutal constraints through looping, high-contrast GIFs or CSS animations:
1.  **The Hard Cap [ 5/5 ]:** Show an operative trying to add a 6th task and getting violently rejected by the UI.
2.  **Thermal Decay:** Show a task aging over 7 days, turning red, and evaporating.
3.  **Tunnel Vision:** Show the `[ ENGAGE ]` mode where everything disappears except one massive task and a stopwatch.
4.  **Scorched Earth:** Show the 10-second unabortable self-destruct sequence when all tasks are complete.

### D. SYNDICATE PROTOCOL (Multiplayer)
*   **Visual:** A glowing radar showing multiple connected OP-IDs.
*   **Concept:** Introduce **Mutually Assured Destruction**. Explain that if you join a squad, and *anyone* lets a task decay, the entire network burns.

### E. DEPLOYMENT (Install)
*   **Visual:** A stark code block.
*   **Content:** 
```bash
> git clone https://github.com/sir-ad/CIPHER_TERMINAL
> cd CIPHER_TERMINAL
> npm install && npm run start
```
*   **Note:** Emphasize "Zero Cloud" and "100% Local". The telemetry never leaves the host machine.

---

## 4. TECHNICAL STACK (PROPOSED)

To maintain maximum performance and aesthetic control:

*   **Framework:** Vite + React (or plain HTML/JS for ultimate minimalism).
*   **Styling:** TailwindCSS (for rapid scaffolding of grid layouts).
*   **Animations:** Framer Motion (for smooth scroll reveals) + custom CSS keyframes (for glitches, scanlines, and terminal typing effects).
*   **Hosting:** GitHub Pages or Vercel (static export).

---

## 5. SUCCESS METRICS

Standard metrics (Time on Site, DAU) are irrelevant. We track:

1.  **Terminal Clones:** GitHub repository clone and fork rates.
2.  **Field Manual Access:** Click-through rates to the MkDocs documentation.
3.  **Viral Resonance:** Mentions on HackerNews, r/Cyberpunk, r/ADHD, and r/Minimalism.

---
**[ END OF TRANSMISSION ]**
