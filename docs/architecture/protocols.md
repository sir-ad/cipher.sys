# RUNTIME PROTOCOLS

This document defines the operational protocols that make CIPHER deterministic under pressure.

## 1) AUTO_CLEAN_BOOTSTRAP
**Purpose:** Guarantee clean startup with one command.

**Entry:** `cipher up`

**Sequence:**
1. Stop existing daemon/MCP if present.
2. Kill stale listeners if needed.
3. Remove runtime artifacts (`pid/state/log/lock`).
4. Start fresh daemon detached.
5. Wait for `/healthz` with `X-Cipher: 1`.
6. Open browser app.

**Success criteria:** Exactly one healthy daemon, clean runtime journal.

## 2) THERMAL_DECAY
**Purpose:** Enforce real priority by expiration pressure.

**Policy:** Tasks older than 7 days are purged.

**In Syndicate mode:** Expiry causes integrity strike against shared squad pool.

## 3) SCORCHED_EARTH
**Purpose:** Exit condition by design, not endless engagement.

**Triggers:**
- Mission completion pathway.
- Manual burn pathway.
- Global integrity collapse in Syndicate mode.

**Effects:**
- Task wipe.
- Mission debrief export.
- Host termination sequence.

## 4) SYNDICATE_DELEGATION
**Purpose:** Cross-node task assignment with capacity constraints.

**Mechanics:**
- `@OPID payload` delegation style.
- Reject if target is at max capacity.
- Target receives incoming directive modal.

## 5) TWO_KEY_TURN
**Purpose:** Prevent fake completion in collaborative mode.

**State path:**
`ACTIVE -> PENDING_VERIFICATION -> NEUTRALIZED`

**Rules:**
- Assignee can request verification.
- Handler confirms or denies kill.

## 6) HOST_TERMINATION_BROADCAST
**Purpose:** Synchronize shutdown-aware UI behavior.

**Event:** `host_terminating`

**Client response:**
- Enter destructed state path.
- Clear local active state.
- Continue mission-close UX.

## 7) MISSION_DEBRIEF
**Purpose:** Produce post-run artifact for human tracking.

**Output:** Downloadable `.txt` report with:
- operator id
- outcome reason
- session task summary
- cumulative telemetry stats

## 8) LOCAL_STATE_WIPE
**Purpose:** Avoid ghost identity/session leakage after terminal burn.

**Behavior:** Remove CIPHER-owned local storage keys on destructive exit path.

## 9) AUDIO_SIGNALING
**Purpose:** Make state changes legible under focus mode.

**Engine:** WebAudio procedural synthesis.

**Signals include:**
- keystroke clicks
- success ping
- alarm/warning
- purge static burst
- incoming directive ringtone

## 10) LOCAL_LLM_INTERROGATION
**Purpose:** Keep motivational pressure local and private.

**Transport:** Ollama on `127.0.0.1:11434`

**Flow:**
1. Poll available models.
2. Build contextual prompt from host/task telemetry.
3. Emit handler message back to UI.

No cloud dependency required.

## 11) CROSS_DEVICE_RESUME
**Purpose:** Continue operations from another device without accounts.

**Composition:**
- socket state sync
- LAN discovery/mDNS
- manual IP override fallback
- browser-local persistence for reconnect continuity
