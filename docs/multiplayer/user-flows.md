# UI & USER FLOWS (SYNDICATE)

This document outlines the visual states and interaction loops for the Multiplayer Syndicate mode.

## 1. BOOT & MODE SELECTION

When an operative loads `http://localhost:4040` (or the network IP), the Onboarding screen is modified:

```text
[ IDENTIFICATION ]
> STATE YOUR DESIGNATION: [ VIPER ]

[ SELECT DEPLOYMENT PROFILE ]
[ ] LONE WOLF (Local Only)
[X] SYNDICATE (Join Network Node)
```

If `SYNDICATE` is chosen, the system negotiates a WebSocket connection to the host daemon's `syndicate-room`.

## 2. THE SQUAD RADAR (HEADER UI)

The top diagnostic ribbon expands to include the **Squad Radar**.

```text
SYS: UP [3] | PHASE: PLANNING | INTEGRITY: [■■■]

[SQUAD RADAR]
> GHOST (192.168.1.5)  - [ 2/5 CAPACITY ]
> VIPER (192.168.1.9)  - [ 5/5 CAPACITY ] !! OVERLOADED !!
> ECHO  (192.168.1.14) - [ 0/5 CAPACITY ]
```

## 3. INCOMING DIRECTIVE TAKEOVER

When `GHOST` assigns a task to `VIPER`, `VIPER`'s UI is forcefully interrupted. 
A modal overlays the screen, locking out all other actions:

```text
=========================================
      ⚠️ INCOMING SQUAD DIRECTIVE ⚠️
=========================================

HANDLER: [GHOST]
PAYLOAD: "Fix the routing bug in production"

[ ACCEPT DIRECTIVE ]   [ REJECT & BOUNCE ]
```
* If Accepted: Enters VIPER's active task list.
* If Rejected: Bounces back into GHOST's input line.

## 4. THE TWO-KEY UI STATE

When a task requires verification, the standard `[ ]` checkbox is replaced.

**On the Assignee's Screen (`VIPER`):**
```text
[ 🔒 ] Fix the routing bug in production
       STATUS: AWAITING HANDLER [GHOST] VERIFICATION
       (This task cannot be deleted. Slot is locked.)
```

**On the Assigner's Screen (`GHOST`):**
```text
[ ? ] Fix the routing bug in production
      ASSIGNEE [VIPER] CLAIMS NEUTRALIZATION.
      [ VERIFY KILL ]   [ REJECT WORK ]
```

## 5. GLOBAL WIPE SEQUENCE

If the Squad Integrity hits zero, the UI transitions to a highly aggressive, synchronized red-screen state across all devices.

```text
=========================================
      ☢️ MUTUALLY ASSURED DESTRUCTION ☢️
=========================================

[ECHO] ALLOWED A DIRECTIVE TO SUFFER THERMAL DECAY.
SQUAD INTEGRITY CRITICAL. 
GLOBAL PURGE INITIATED.

T-MINUS 10... 9... 8...
(No abort button. Sequence is absolute.)
```
All tasks vanish. The UI returns to the empty state, leaving only the stats overlay showing the failure.
