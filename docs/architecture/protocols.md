# RUNTIME PROTOCOLS

This document defines the operational protocols that keep CIPHER deterministic.

## 1) AUTO_CLEAN_BOOTSTRAP
**Purpose:** Guarantee clean startup with one command.

**Entry:** `cipher up`

**Sequence:**
1. Stop existing local daemon/MCP if present.
2. Kill stale listeners if needed.
3. Remove runtime artifacts (`pid/state/log/lock`).
4. Probe LAN for authoritative host.
5. If host found: enter `JOIN` mode and open host URL.
6. If host not found: start fresh local host daemon.

**Success criteria:** Single active authoritative host target, no duplicate local daemons.

## 2) LAN_JOIN_FALLBACK
**Purpose:** Keep discovery resilient when mDNS is blocked.

**Priority:**
1. `cipher.local` (best effort)
2. direct host IP (`http://<host-ip>:4040`)

**Contract:** CIPHER must still be usable via IP when `cipher.local` fails.

## 3) THERMAL_DECAY
**Purpose:** Enforce real priority by expiration pressure.

**Policy:** Tasks older than 7 days are purged.

**In Syndicate mode:** Expiry causes integrity strike against shared squad pool.

## 4) SCORCHED_EARTH
**Purpose:** Exit condition by design, not endless engagement.

**Triggers:**
- Mission completion pathway.
- Manual burn pathway.
- Global integrity collapse in Syndicate mode.

**Effects:**
- Task wipe.
- Mission debrief export.
- Host termination sequence.

## 5) SYNDICATE_DELEGATION
**Purpose:** Cross-node task assignment with capacity constraints.

**Mechanics:**
- `@OPID payload` delegation style.
- Reject if target is at max capacity.
- Target receives incoming directive modal.

## 6) TWO_KEY_TURN
**Purpose:** Prevent fake completion in collaborative mode.

**State path:**
`ACTIVE -> PENDING_VERIFICATION -> NEUTRALIZED`

**Rules:**
- Assignee can request verification.
- Handler confirms or denies kill.

## 7) HOST_TERMINATION_BROADCAST
**Purpose:** Synchronize shutdown-aware UI behavior.

**Event:** `host_terminating`

**Client response:**
- Enter destructed state path.
- Clear local active state.
- Continue mission-close UX.

## 8) AUTHORITATIVE_SYNC
**Purpose:** Prevent split-brain task timelines across devices.

**Rules:**
1. Server `sync_state` is authoritative.
2. Clients do not push full local state on initial connect.
3. Mutations are locked when disconnected from authority.

## 9) MISSION_DEBRIEF
**Purpose:** Produce post-run artifact for human tracking.

**Output:** Downloadable `.txt` report with:
- operator id
- outcome reason
- session task summary
- cumulative telemetry stats

## 10) LOCAL_STATE_WIPE
**Purpose:** Avoid ghost identity/session leakage after terminal burn.

**Behavior:** Remove CIPHER-owned local storage keys on destructive exit path.

## 11) AUDIO_SIGNALING
**Purpose:** Make state changes legible under focus mode.

**Engine:** WebAudio procedural synthesis.

**Signals include:**
- keystroke clicks
- success ping
- alarm/warning
- purge static burst
- incoming directive ringtone

## 12) LOCAL_LLM_INTERROGATION
**Purpose:** Keep motivational pressure local and private.

**Transport:** Ollama on `127.0.0.1:11434`

**Flow:**
1. Poll available models.
2. Build contextual prompt from host/task telemetry.
3. Emit handler message back to UI.

No cloud dependency required.

## 13) CROSS_DEVICE_RESUME
**Purpose:** Continue operations from another device without accounts.

**Composition:**
- socket state sync
- LAN discovery (`cipher.local` best effort)
- mandatory manual IP fallback
- browser-local persistence for reconnect continuity
