# BOOT SEQUENCE

Initialize CIPHER on your local hardware.

## PREREQUISITES

* Node.js v18+
* A Chromium or WebKit based browser
* LAN access if you want cross-device operations

## DEPLOYMENT

```bash
git clone https://github.com/sir-ad/cipher.sys.git
cd cipher.sys
npm install
```

## IGNITION

Deterministic startup sequence:

```bash
cipher up
```

`cipher` (with no args) also maps to `cipher up`.

`cipher up` always performs local stop/clean first. Then it chooses mode:

1. **JOIN mode (default):** if an authoritative LAN host is discovered, CIPHER opens that host and does not spawn a new daemon.
2. **HOST mode:** if no host is discovered, CIPHER starts a fresh local daemon.

Force behavior:

```bash
cipher up --host                 # always spawn local host daemon
cipher up --join 192.168.1.5     # always join explicit host
```

## CONTROL COMMANDS

```bash
cipher status
cipher stop
cipher open
cipher mcp start
```

`cipher status` reports runtime mode as `HOST` or `JOIN` with active target URL.

## DISCOVERY MODEL

CIPHER discovery is **best-effort mDNS** with mandatory IP fallback.

Primary join paths:

1. `http://cipher.local:4040` (when mDNS works)
2. `http://<host-ip>:4040` (always supported fallback)

In-app **IP OVERRIDE** can attach to a host when `cipher.local` is blocked by router, firewall, or OS policy.

## TROUBLESHOOTING

### `cipher.local` does not resolve

1. Use `cipher status` on host and copy the `JOIN`/`HOST` target URL.
2. Open `http://<host-ip>:4040` directly from peer devices.
3. Enter host IP into IP OVERRIDE in CIPHER UI.

### Tasks are not syncing across devices

1. Ensure peers are joining the same authoritative host (`cipher status`).
2. Do not run `cipher up --host` on secondary devices.
3. Use default `cipher up` to auto-join existing host.

### Duplicate host daemons

Run:

```bash
cipher stop
cipher up
```

This enforces stop-clean-start with a single active runtime target.
