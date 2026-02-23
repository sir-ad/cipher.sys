# [!] CLASSIFIED PRD: SYNDICATE PROTOCOL

## 1. VISION & EXECUTIVE SUMMARY

The current CIPHER.SYS architecture operates in **LONE WOLF** mode. It isolates the operative. However, high-functioning covert teams (startup founders, dev squads, study groups) require localized coordination without sacrificing our core anti-engagement philosophy. 

**SYNDICATE PROTOCOL** is the "Multiplayer Mode" for CIPHER.SYS. It allows operatives connected to the same Local Command Node to discover each other, delegate cross-node directives, and engage in a cooperative productivity "survival game" built on the concept of **Mutually Assured Destruction (M.A.D.)**.

**Tagline:** *Productivity is no longer a solo survival horror. It is a tactical squad shooter.*

---

## 2. PROBLEM STATEMENT & PSYCHOLOGY

Standard team task managers (Jira, Asana, Trello) are broken due to "infinite backlog syndrome" and lack of immediate accountability.

* **The Black Hole:** A manager assigns 50 tickets to a developer. The developer feels overwhelmed, ignores 45 of them, and works on the 5 loudest ones.
* **Fake Productivity:** A team member checks off a task, but the work is subpar. The manager doesn't realize it until weeks later.
* **Zero Stakes:** Tasks sit in "To Do" for 6 months with no consequences.

**SYNDICATE PROTOCOL** solves this by weaponizing peer pressure and extreme constraints.

---

## 3. CORE MULTIPLAYER MECHANICS

### A. The Squad Radar (Discovery)
When an operative boots CIPHER.SYS, they select a mode: `LONE WOLF` or `JOIN SYNDICATE`.
In Syndicate mode, the UI header expands into a **Tactical Radar**. It displays all currently connected `OP-IDs` (e.g., `[GHOST]`, `[VIPER]`, `[ECHO]`) on the local network. 
* Crucially, it shows their capacity: `VIPER: [ 3 / 5 ]`. 

### B. The Cross-Node Contract (Delegation)
Operatives can assign tasks to each other using the `@` terminal syntax.
* *Action:* `GHOST` types: `@VIPER Patch the staging database`.
* *Constraint:* If `VIPER` already has 5 active tasks, the system physically **rejects the assignment** with a loud error: `[REJECTED: VIPER AT MAXIMUM CAPACITY]`. `GHOST` must physically tell `VIPER` to clear their board. You cannot micromanage an overloaded operative.

### C. The Two-Key Turn (Verification)
A task assigned by another device can **only be fully completed by the assigner**.
1. `VIPER` finishes the task and clicks `[ NEUTRALIZE ]`.
2. The task does *not* disappear. It turns amber and enters `[ AWAITING HANDLER VERIFICATION ]`.
3. `GHOST` (the assigner) receives a critical ping. They must inspect the work and click `[ CONFIRM KILL ]`. Only then is the task purged.
4. If the work is bad, `GHOST` clicks `[ DENY ]`, throwing the task back to `VIPER`'s active board.

### D. Mutually Assured Destruction (M.A.D.)
In Syndicate mode, the 7-day thermal decay is a shared threat.
If *any* operative allows a task to expire (7 days without execution), the network takes an **Integrity Strike**. 
At **3 Strikes**, the Host Daemon triggers an involuntary, global **Scorched Earth**. Every connected terminal instantly wipes all tasks. You fail as a team.

---

## 4. TARGET AUDIENCE

1. **Agile Dev Teams / Startups:** Daily standups translated into a 5-task max collaborative board.
2. **Accountability Partners:** Friends studying for exams or working on side-hustles who need mutually assured destruction to stay focused.
3. **ADHD Work Groups:** Body-doubling groups who need immediate, high-stakes verification mechanics to trigger dopamine and executive function.

---

## 5. NON-GOALS (WHAT WE ARE NOT BUILDING)

* **No Cloud Servers:** Syndicate Protocol operates strictly over LAN / Localhost (or VPNs like Tailscale). We will not build a centralized SaaS cloud.
* **No Task Histories/Audit Logs:** When a task is verified and killed, it vanishes forever. Managers cannot pull a "monthly productivity report".
* **No Project Folders:** All tasks share the same tactical flat-level view.

---

## 6. LAUNCH PHASES

### Phase 1: Local Discovery & Radar (v5.0)
* Toggle between `LONE WOLF` and `SYNDICATE` modes.
* Build the `Squad Radar` UI to show active peers via Socket.io.

### Phase 2: Directed Fire (v5.1)
* Implement the `@` syntax for cross-node assignment.
* Implement capacity rejection logic (the 5/5 block).

### Phase 3: The Two-Key Turn (v5.2)
* Implement the Verification State machine (`ACTIVE` -> `PENDING_VERIFICATION` -> `NEUTRALIZED`).
* UI updates for Handlers to Accept/Deny completions.

### Phase 4: M.A.D. Engine (v5.3)
* Implement global health pools and synchronized multi-client wipe animations.
