# NETWORK TOPOLOGY (SYNDICATE MODE)

To support **SYNDICATE PROTOCOL**, the underlying Node.js daemon requires state expansion from a localized array to a multi-client mesh.

## 1. STATE MANAGEMENT SCHEMA

The `dbState` object must evolve to handle multi-tenant tracking and global integrity pools.

```javascript
// Proposed Architecture Upgrade (server.js)
let networkState = {
  mode: 'SYNDICATE', // LONE_WOLF | SYNDICATE
  squadIntegrity: 3, // Starts at 3. Reaching 0 triggers Global Wipe.
  nodes: {
    "socket-id-1": { opId: "GHOST", ip: "192.168.1.5", activeTaskCount: 2 },
    "socket-id-2": { opId: "VIPER", ip: "192.168.1.9", activeTaskCount: 5 }
  },
  tasks: [
    {
      id: "uuid-1",
      text: "Reboot the mainframe",
      owner: "VIPER",        // The node currently holding the task
      handler: "GHOST",      // Who assigned it (requires their confirmation)
      status: "ACTIVE",      // ACTIVE | PENDING_VERIFICATION | NEUTRALIZED
      createdAt: 1690000000,
      updatedAt: 1690000000,
      deletedAt: null
    }
  ]
}
```

## 2. SOCKET EVENT LIFECYCLES

New WebSocket events will be required to handle the Two-Key Turn and Cross-Node routing.

### A. Connection & Discovery
* `join_syndicate (opId)`: Client registers their codename. Server responds by broadcasting `squad_update` containing the new radar list.
* `squad_update`: Broadcasts the `networkState.nodes` to all clients to populate the Squad Radar UI.

### B. The Delegation Loop
1. `delegate_directive (payload)`: Emitted by Handler (`GHOST`). Server checks if Assignee (`VIPER`) is at capacity (5). 
    * If Full: Emits `delegation_rejected` back to `GHOST`.
    * If Available: Emits `incoming_directive` specifically to `VIPER`'s socket ID.
2. `accept_directive (taskId)`: Emitted by `VIPER`. Server writes task to DB and syncs state.

### C. The Two-Key Turn Loop
1. `request_verification (taskId)`: Emitted by `VIPER` when checking the box. Server changes status to `PENDING_VERIFICATION`. Server emits `verify_required` to `GHOST`.
2. `confirm_kill (taskId)`: Emitted by `GHOST`. Server permanently purges task, frees slots, updates stats.
3. `deny_kill (taskId)`: Emitted by `GHOST`. Server flips status back to `ACTIVE`.

### D. Mutually Assured Destruction
1. Server's `setInterval` runs every minute checking `createdAt` vs `EXPIRY_MS` (7 days).
2. If task expires: `networkState.squadIntegrity -= 1`.
3. Server broadcasts `integrity_strike`.
4. If `networkState.squadIntegrity === 0`: Server immediately broadcasts `global_scorched_earth`. All local storages are wiped, DB is zeroed out.

## 3. SECURITY & CHEATING

Because CIPHER.SYS runs locally, the "server" is just whichever team member booted the Node.js process first. 
* There are no user accounts. Identity is based on `OP-ID` string claiming.
* If the host computer goes offline, the Syndicate drops. Operatives will fall back to `LONE WOLF` mode with whatever tasks were last synced to their browser's `localStorage`.
