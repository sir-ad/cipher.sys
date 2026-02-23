# HOST DAEMON

CIPHER.SYS uses a custom Node.js daemon (`server.js`) rather than a standard web backend.

## LOCAL_ONLY TOPOLOGY

All state is maintained in-memory on the daemon and replicated to the client's `localStorage`.

```javascript
let dbState = { tasks: [], stats: {}, lastBurnTime: 0 }; 
```

Whenever the client reconnects, the socket fires `sync_state`. If the server's `lastBurnTime` is newer than the client's, the client undergoes an immediate data wipe to respect the Scorched Earth protocol executed on another node.

## DETACHED EXECUTION

The `bin/cipher.js` launcher spawns the server using Node's `child_process.spawn` with `{ detached: true, stdio: 'ignore' }`. 

This allows the CLI to close immediately, leaving the daemon running silently in the OS background. The only way to gracefully stop it is via the `terminate_host_process` socket event, which is fired when the UI countdown hits zero.
